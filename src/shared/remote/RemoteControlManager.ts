import { RemoteControlProvider, RemoteDevice } from './types'

/**
 * Registry and manager for remote control providers.
 *
 * Usage:
 *   const manager = new RemoteControlManager()
 *   manager.register(new AppleTVRemote())
 *   manager.register(new RokuRemote())
 *
 *   const devices = await manager.scanAll()
 *   manager.setActiveProvider('appletv')
 *   await manager.getActiveProvider()!.connect(device)
 */
export class RemoteControlManager {
  private providers: Map<string, RemoteControlProvider> = new Map()
  private activeProvider: RemoteControlProvider | null = null

  /** Register a new remote control provider */
  register(provider: RemoteControlProvider): void {
    if (this.providers.has(provider.type)) {
      console.warn(`Provider "${provider.type}" already registered, replacing.`)
    }
    this.providers.set(provider.type, provider)
  }

  /** Unregister and dispose a provider */
  async unregister(type: string): Promise<void> {
    const provider = this.providers.get(type)
    if (provider) {
      await provider.dispose()
      this.providers.delete(type)
      if (this.activeProvider === provider) {
        this.activeProvider = null
      }
    }
  }

  /** Get all registered providers */
  getProviders(): RemoteControlProvider[] {
    return Array.from(this.providers.values())
  }

  /** Get a specific provider by type */
  getProvider(type: string): RemoteControlProvider | undefined {
    return this.providers.get(type)
  }

  /** Get the currently active provider */
  getActiveProvider(): RemoteControlProvider | null {
    return this.activeProvider
  }

  /** Set the active provider by type */
  setActiveProvider(type: string): RemoteControlProvider | null {
    const provider = this.providers.get(type)
    if (provider) {
      this.activeProvider = provider
      return provider
    }
    return null
  }

  /** Scan all providers for devices */
  async scanAll(): Promise<Map<string, RemoteDevice[]>> {
    const results = new Map<string, RemoteDevice[]>()
    const scanPromises = Array.from(this.providers.entries()).map(
      async ([type, provider]) => {
        try {
          const devices = await provider.scan()
          results.set(type, devices)
        } catch (err) {
          console.error(`Scan failed for provider "${type}":`, err)
          results.set(type, [])
        }
      }
    )
    await Promise.all(scanPromises)
    return results
  }

  /** Dispose all providers */
  async dispose(): Promise<void> {
    const promises = Array.from(this.providers.values()).map(p => p.dispose())
    await Promise.all(promises)
    this.providers.clear()
    this.activeProvider = null
  }
}
