import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { AppSettings, DEFAULT_SETTINGS } from '@shared/settings/types'

export class SettingsManager {
  private settings: AppSettings
  private filePath: string
  private saveTimer: ReturnType<typeof setTimeout> | null = null

  constructor() {
    const configDir = join(app.getPath('home'), '.config', 'tv-view')
    this.filePath = join(configDir, 'settings.json')
    console.log('[settings:main] SettingsManager init, file:', this.filePath)

    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true })
    }

    this.settings = this.load()
  }

  private load(): AppSettings {
    try {
      if (existsSync(this.filePath)) {
        const raw = readFileSync(this.filePath, 'utf-8')
        const parsed = JSON.parse(raw)
        console.log('[settings:main] Loaded settings from disk:', JSON.stringify(parsed))
        return { ...DEFAULT_SETTINGS, ...parsed, remote: { ...DEFAULT_SETTINGS.remote, ...parsed.remote } }
      }
      console.log('[settings:main] No settings file on disk, using defaults')
    } catch (err) {
      console.error('[settings:main] Failed to load settings, using defaults:', err)
    }
    return { ...DEFAULT_SETTINGS }
  }

  private saveNow(): void {
    try {
      console.log('[settings:main] Writing settings to disk:', JSON.stringify(this.settings))
      writeFileSync(this.filePath, JSON.stringify(this.settings, null, 2), 'utf-8')
    } catch (err) {
      console.error('[settings:main] Failed to save settings:', err)
    }
  }

  private scheduleSave(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer)
    this.saveTimer = setTimeout(() => {
      this.saveNow()
      this.saveTimer = null
    }, 500)
  }

  getAll(): AppSettings {
    return { ...this.settings }
  }

  update(partial: Partial<AppSettings>): AppSettings {
    console.log('[settings:main] update() received partial:', JSON.stringify(partial))
    if (partial.remote) {
      this.settings.remote = { ...this.settings.remote, ...partial.remote }
      const { remote: _, ...rest } = partial
      Object.assign(this.settings, rest)
    } else {
      Object.assign(this.settings, partial)
    }
    this.saveNow()
    return { ...this.settings }
  }

  flush(): void {
    console.log('[settings:main] flush() called, pending save:', this.saveTimer !== null)
    if (this.saveTimer) {
      clearTimeout(this.saveTimer)
      this.saveTimer = null
      this.saveNow()
    }
  }
}
