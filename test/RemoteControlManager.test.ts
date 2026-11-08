import { RemoteControlManager } from '@shared/remote/RemoteControlManager'
import { RemoteControlProvider, RemoteDevice } from '@shared/remote/types'

function fakeProvider(type: string, devices: RemoteDevice[] = []): RemoteControlProvider {
  return {
    name: type,
    type,
    supportedButtons: [],
    connectionState: 'disconnected',
    supportsPairing: false,
    connectedDevice: null,
    scan: jest.fn().mockResolvedValue(devices),
    stopScan: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    pair: jest.fn(),
    submitPairingPin: jest.fn(),
    pressButton: jest.fn(),
    longPressButton: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    dispose: jest.fn().mockResolvedValue(undefined),
  }
}

describe('RemoteControlManager', () => {
  let manager: RemoteControlManager

  beforeEach(() => {
    manager = new RemoteControlManager()
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => jest.restoreAllMocks())

  it('registers providers and looks them up by type', () => {
    const tv = fakeProvider('appletv')
    manager.register(tv)
    expect(manager.getProvider('appletv')).toBe(tv)
    expect(manager.getProviders()).toEqual([tv])
  })

  it('replaces a provider registered under the same type', () => {
    const first = fakeProvider('roku')
    const second = fakeProvider('roku')
    manager.register(first)
    manager.register(second)
    expect(manager.getProviders()).toEqual([second])
    expect(console.warn).toHaveBeenCalled()
  })

  it('sets the active provider only for known types', () => {
    const tv = fakeProvider('appletv')
    manager.register(tv)
    expect(manager.setActiveProvider('appletv')).toBe(tv)
    expect(manager.getActiveProvider()).toBe(tv)
    expect(manager.setActiveProvider('unknown')).toBeNull()
    expect(manager.getActiveProvider()).toBe(tv)
  })

  it('unregister disposes the provider and clears it as active', async () => {
    const tv = fakeProvider('appletv')
    manager.register(tv)
    manager.setActiveProvider('appletv')
    await manager.unregister('appletv')
    expect(tv.dispose).toHaveBeenCalledTimes(1)
    expect(manager.getProvider('appletv')).toBeUndefined()
    expect(manager.getActiveProvider()).toBeNull()
  })

  it('scanAll collects devices per provider and maps failures to an empty list', async () => {
    const device: RemoteDevice = { id: '1', name: 'Living Room', address: '10.0.0.5', type: 'appletv' }
    const ok = fakeProvider('appletv', [device])
    const broken = fakeProvider('roku')
    ;(broken.scan as jest.Mock).mockRejectedValue(new Error('network down'))
    manager.register(ok)
    manager.register(broken)

    const results = await manager.scanAll()
    expect(results.get('appletv')).toEqual([device])
    expect(results.get('roku')).toEqual([])
  })

  it('dispose disposes every provider and empties the registry', async () => {
    const a = fakeProvider('appletv')
    const b = fakeProvider('roku')
    manager.register(a)
    manager.register(b)
    manager.setActiveProvider('roku')
    await manager.dispose()
    expect(a.dispose).toHaveBeenCalled()
    expect(b.dispose).toHaveBeenCalled()
    expect(manager.getProviders()).toEqual([])
    expect(manager.getActiveProvider()).toBeNull()
  })
})
