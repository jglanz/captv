/**
 * Remote Control Framework
 *
 * A pluggable interface for controlling devices over LAN/WiFi.
 * Implement RemoteControlProvider to add support for new device types
 * (e.g., Apple TV, Roku, Samsung TV, LG webOS, Fire TV, Chromecast).
 */

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'pairing' | 'error'

/** A device discovered on the network */
export interface RemoteDevice {
  id: string
  name: string
  address: string
  port?: number
  type: string
  metadata?: Record<string, unknown>
}

/** Standard remote control buttons */
export type RemoteButton =
  | 'up' | 'down' | 'left' | 'right' | 'select'
  | 'menu' | 'back' | 'home'
  | 'play-pause' | 'play' | 'pause' | 'stop'
  | 'volume-up' | 'volume-down' | 'mute'
  | 'power-on' | 'power-off' | 'power-toggle'
  | 'channel-up' | 'channel-down'
  | 'fast-forward' | 'rewind'
  | 'skip-forward' | 'skip-backward'

/** Result from a pairing attempt */
export interface PairResult {
  success: boolean
  requiresPin: boolean
  error?: string
}

/** Events emitted by a remote control provider */
export interface RemoteControlEvents {
  'connection-state-changed': (state: ConnectionState, error?: Error) => void
  'device-discovered': (device: RemoteDevice) => void
  'device-lost': (deviceId: string) => void
  'error': (error: Error) => void
  'power-state-changed': (isOn: boolean) => void
}

/**
 * Interface for remote control provider implementations.
 *
 * To add support for a new device type, implement this interface:
 *
 * 1. Create a class in src/shared/remote/implementations/
 * 2. Implement all required methods
 * 3. Register it with RemoteControlManager
 *
 * Example device types and their typical protocols:
 * - Apple TV:   pyatv library via WebSocket bridge
 * - Roku:       HTTP REST API (External Control Protocol)
 * - Samsung TV: SmartThings API or legacy WebSocket
 * - LG webOS:   WebSocket (ssap:// protocol)
 * - Fire TV:    ADB over WiFi
 * - Chromecast: Google Cast protocol (mDNS + protobuf)
 */
export interface RemoteControlProvider {
  /** Human-readable name (e.g., "Apple TV") */
  readonly name: string

  /** Provider type identifier (e.g., "appletv", "roku") */
  readonly type: string

  /** Buttons this provider supports */
  readonly supportedButtons: RemoteButton[]

  /** Current connection state */
  readonly connectionState: ConnectionState

  /** Whether this device type requires pairing before use */
  readonly supportsPairing: boolean

  /** Currently connected device, if any */
  readonly connectedDevice: RemoteDevice | null

  // --- Discovery ---

  /** Scan the local network for controllable devices */
  scan(): Promise<RemoteDevice[]>

  /** Stop an ongoing scan */
  stopScan(): void

  // --- Connection ---

  /** Connect to a discovered device */
  connect(device: RemoteDevice): Promise<void>

  /** Disconnect from the current device */
  disconnect(): Promise<void>

  // --- Pairing ---

  /** Initiate pairing with a device */
  pair(device: RemoteDevice): Promise<PairResult>

  /** Submit a PIN code during pairing */
  submitPairingPin(pin: string): Promise<PairResult>

  // --- Controls ---

  /** Press a button on the remote */
  pressButton(button: RemoteButton): Promise<void>

  /** Long-press a button (optional, may fall back to pressButton) */
  longPressButton(button: RemoteButton): Promise<void>

  // --- Events ---

  on<K extends keyof RemoteControlEvents>(event: K, listener: RemoteControlEvents[K]): void
  off<K extends keyof RemoteControlEvents>(event: K, listener: RemoteControlEvents[K]): void

  // --- Lifecycle ---

  /** Clean up resources (WebSocket connections, timers, etc.) */
  dispose(): Promise<void>
}
