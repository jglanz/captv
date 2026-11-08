import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { DEFAULT_SETTINGS } from '@shared/settings/types'

let mockHome = ''
jest.mock('electron', () => ({ app: { getPath: () => mockHome } }))

import { SettingsManager } from '../src/main/SettingsManager'

const configDir = () => join(mockHome, '.config', 'tv-view')
const settingsFile = () => join(configDir(), 'settings.json')

function writeSettings(contents: string): void {
  mkdirSync(configDir(), { recursive: true })
  writeFileSync(settingsFile(), contents, 'utf-8')
}

describe('SettingsManager', () => {
  beforeEach(() => {
    mockHome = mkdtempSync(join(tmpdir(), 'captv-test-'))
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
    rmSync(mockHome, { recursive: true, force: true })
  })

  it('creates the config directory and starts from defaults', () => {
    const settings = new SettingsManager()
    expect(existsSync(configDir())).toBe(true)
    expect(settings.getAll()).toEqual(DEFAULT_SETTINGS)
  })

  it('merges saved settings over defaults, including nested remote settings', () => {
    writeSettings(JSON.stringify({ volume: 40, remote: { lastDeviceName: 'Den' } }))
    const all = new SettingsManager().getAll()
    expect(all.volume).toBe(40)
    expect(all.aspectRatio).toBe(DEFAULT_SETTINGS.aspectRatio)
    expect(all.remote).toEqual({ ...DEFAULT_SETTINGS.remote, lastDeviceName: 'Den' })
  })

  it('falls back to defaults when the settings file is corrupt', () => {
    writeSettings('{not json')
    expect(new SettingsManager().getAll()).toEqual(DEFAULT_SETTINGS)
  })

  it('update merges a partial remote change and persists to disk', () => {
    const settings = new SettingsManager()
    const result = settings.update({ muted: true, remote: { lastDeviceAddress: '10.0.0.7' } as never })

    expect(result.muted).toBe(true)
    expect(result.remote.bridgeUrl).toBe(DEFAULT_SETTINGS.remote.bridgeUrl)
    expect(result.remote.lastDeviceAddress).toBe('10.0.0.7')

    const onDisk = JSON.parse(readFileSync(settingsFile(), 'utf-8'))
    expect(onDisk).toEqual(result)
  })

  it('getAll returns a copy that does not alias internal state', () => {
    const settings = new SettingsManager()
    const snapshot = settings.getAll()
    snapshot.volume = 1
    expect(settings.getAll().volume).toBe(DEFAULT_SETTINGS.volume)
  })
})
