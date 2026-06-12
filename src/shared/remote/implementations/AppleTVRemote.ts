import {
  RemoteControlProvider,
  RemoteDevice,
  RemoteButton,
  ConnectionState,
  PairResult,
  RemoteControlEvents
} from '../types'

type ListenerSet<K extends keyof RemoteControlEvents> = Set<RemoteControlEvents[K]>
type EventMap = { [K in keyof RemoteControlEvents]: ListenerSet<K> }

/**
 * Apple TV Remote Control Implementation
 *
 * Controls an Apple TV over the local network using the pyatv library
 * via a WebSocket bridge server.
 *
 * Architecture:
 *   [This App] <--WebSocket--> [Python Bridge Server] <--pyatv--> [Apple TV]
 *
 * Prerequisites:
 * - Python 3.9+ with pyatv installed: pip install pyatv
 * - Bridge server running: python server/appletv-bridge.py
 *
 * The bridge server (a thin WebSocket wrapper around pyatv) handles:
 * - mDNS device discovery
 * - AirPlay/Companion protocol pairing
 * - Remote control command relay
 * - Power state monitoring
 *
 * Protocol reference: https://pyatv.dev/
 * Based on: https://github.com/jklewa/atv-desktop-remote
 */
export class AppleTVRemote implements RemoteControlProvider {
  readonly name = 'Apple TV'
  readonly type = 'appletv'
  readonly supportsPairing = true
  readonly supportedButtons: RemoteButton[] = [
    'up', 'down', 'left', 'right', 'select',
    'menu', 'back', 'home',
    'play-pause', 'play', 'pause', 'stop',
    'volume-up', 'volume-down',
    'power-on', 'power-off', 'power-toggle',
    'skip-forward', 'skip-backward'
  ]

  private _connectionState: ConnectionState = 'disconnected'
  private _connectedDevice: RemoteDevice | null = null
  private ws: WebSocket | null = null
  private wsUrl: string
  private listeners: EventMap = {
    'connection-state-changed': new Set(),
    'device-discovered': new Set(),
    'device-lost': new Set(),
    'error': new Set(),
    'power-state-changed': new Set()
  } as EventMap
  private pendingResolvers = new Map<string, { resolve: (value: unknown) => void; reject: (reason: unknown) => void }>()
  private scanResults: RemoteDevice[] = []

  constructor(bridgeUrl = 'ws://localhost:8765') {
    this.wsUrl = bridgeUrl
  }

  get connectionState(): ConnectionState {
    return this._connectionState
  }

  get connectedDevice(): RemoteDevice | null {
    return this._connectedDevice
  }

  // --- WebSocket Communication ---

  private async ensureWebSocket(): Promise<WebSocket> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return this.ws
    }

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.wsUrl)

      ws.onopen = () => {
        this.ws = ws
        resolve(ws)
      }

      ws.onmessage = (event) => {
        try {
          this.handleMessage(JSON.parse(event.data as string))
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
        }
      }

      ws.onerror = () => {
        this.emit('error', new Error('WebSocket connection error'))
        reject(new Error('WebSocket connection failed'))
      }

      ws.onclose = () => {
        this.ws = null
        if (this._connectionState === 'connected') {
          this.setConnectionState('disconnected')
        }
      }
    })
  }

  private async sendCommand(cmd: string, data?: unknown): Promise<void> {
    const ws = await this.ensureWebSocket()
    ws.send(JSON.stringify({ cmd, data }))
  }

  private sendCommandAndWait<T>(cmd: string, responseCmd: string, data?: unknown): Promise<T> {
    return new Promise(async (resolve, reject) => {
      this.pendingResolvers.set(responseCmd, {
        resolve: resolve as (v: unknown) => void,
        reject
      })

      const timeout = setTimeout(() => {
        if (this.pendingResolvers.has(responseCmd)) {
          this.pendingResolvers.delete(responseCmd)
          reject(new Error(`Timeout waiting for ${responseCmd}`))
        }
      }, 30000)

      try {
        await this.sendCommand(cmd, data)
      } catch (err) {
        clearTimeout(timeout)
        this.pendingResolvers.delete(responseCmd)
        reject(err)
      }
    })
  }

  private handleMessage(msg: { command: string; data: unknown }): void {
    const { command, data } = msg

    // Check for pending resolvers first
    const resolver = this.pendingResolvers.get(command)
    if (resolver) {
      this.pendingResolvers.delete(command)
      resolver.resolve(data)
      return
    }

    switch (command) {
      case 'scanResult': {
        const names = data as string[]
        this.scanResults = names.map((name, i) => ({
          id: `atv-${i}`,
          name: name.replace(/\s*\([\d.]+\)$/, ''),
          address: name.match(/\(([\d.]+)\)/)?.[1] ?? '',
          type: 'appletv',
          metadata: { rawName: name }
        }))
        break
      }

      case 'connected': {
        const result = data as { connected: boolean; error?: string }
        if (result.connected) {
          this.setConnectionState('connected')
        } else {
          this.setConnectionState('error')
          this.emit('error', new Error(result.error ?? 'Connection failed'))
        }
        break
      }

      case 'power_status':
        this.emit('power-state-changed', data === 'on')
        break

      case 'pairError':
        this.setConnectionState('error')
        this.emit('error', new Error(data as string))
        break

      case 'keyboard_changestate':
        // Apple TV keyboard focus state changed
        break
    }
  }

  // --- State Management ---

  private setConnectionState(state: ConnectionState, error?: Error): void {
    this._connectionState = state
    this.emit('connection-state-changed', state, error)
  }

  // --- Discovery ---

  async scan(): Promise<RemoteDevice[]> {
    this.scanResults = []
    const result = await this.sendCommandAndWait<string[]>('scan', 'scanResult')
    return this.scanResults
  }

  stopScan(): void {
    this.scanResults = []
  }

  // --- Connection ---

  async connect(device: RemoteDevice): Promise<void> {
    this.setConnectionState('connecting')
    this._connectedDevice = device
    const rawName = (device.metadata?.rawName as string) ?? `${device.name} (${device.address})`
    await this.sendCommand('connectSaved', rawName)
  }

  async disconnect(): Promise<void> {
    this._connectedDevice = null
    this.setConnectionState('disconnected')
  }

  // --- Pairing ---

  async pair(device: RemoteDevice): Promise<PairResult> {
    this.setConnectionState('pairing')
    const rawName = (device.metadata?.rawName as string) ?? `${device.name} (${device.address})`
    await this.sendCommand('startPair', rawName)
    return { success: false, requiresPin: true }
  }

  async submitPairingPin(pin: string): Promise<PairResult> {
    try {
      await this.sendCommand('finishPair1', pin)
      return { success: true, requiresPin: false }
    } catch (err) {
      return { success: false, requiresPin: false, error: String(err) }
    }
  }

  // --- Controls ---

  private readonly buttonCommandMap: Record<string, string> = {
    'up': 'up',
    'down': 'down',
    'left': 'left',
    'right': 'right',
    'select': 'select',
    'menu': 'menu',
    'back': 'menu',
    'home': 'home',
    'play-pause': 'play_pause',
    'play': 'play',
    'pause': 'pause',
    'stop': 'stop',
    'volume-up': 'volume_up',
    'volume-down': 'volume_down',
    'mute': 'volume_down',
    'power-on': 'turn_on',
    'power-off': 'turn_off',
    'power-toggle': 'turn_on',
    'channel-up': 'channel_up',
    'channel-down': 'channel_down',
    'fast-forward': 'next',
    'rewind': 'previous',
    'skip-forward': 'skip_forward',
    'skip-backward': 'skip_backward'
  }

  async pressButton(button: RemoteButton): Promise<void> {
    const cmd = this.buttonCommandMap[button]
    if (!cmd) {
      throw new Error(`Unsupported button: ${button}`)
    }
    await this.sendCommand('sendCommand', cmd)
  }

  async longPressButton(button: RemoteButton): Promise<void> {
    // pyatv doesn't distinguish long-press for most buttons
    await this.pressButton(button)
  }

  // --- Events ---

  on<K extends keyof RemoteControlEvents>(event: K, listener: RemoteControlEvents[K]): void {
    const set = this.listeners[event] as Set<RemoteControlEvents[K]>
    set.add(listener)
  }

  off<K extends keyof RemoteControlEvents>(event: K, listener: RemoteControlEvents[K]): void {
    const set = this.listeners[event] as Set<RemoteControlEvents[K]>
    set.delete(listener)
  }

  private emit<K extends keyof RemoteControlEvents>(event: K, ...args: Parameters<RemoteControlEvents[K]>): void {
    const set = this.listeners[event]
    for (const listener of set) {
      try {
        ;(listener as Function)(...args)
      } catch (err) {
        console.error(`Error in ${event} listener:`, err)
      }
    }
  }

  // --- Lifecycle ---

  async dispose(): Promise<void> {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this._connectionState = 'disconnected'
    this._connectedDevice = null
    for (const set of Object.values(this.listeners)) {
      ;(set as Set<Function>).clear()
    }
    this.pendingResolvers.clear()
  }
}
