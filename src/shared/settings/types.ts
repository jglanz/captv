export interface RemoteSettings {
  bridgeUrl: string
  lastDeviceName: string | null
  lastDeviceAddress: string | null
}

export interface AppSettings {
  volume: number
  muted: boolean
  aspectRatio: string
  selectedVideoInput: string
  selectedAudioInput: string
  selectedAudioOutput: string
  remote: RemoteSettings
}

export const DEFAULT_SETTINGS: AppSettings = {
  volume: 100,
  muted: false,
  aspectRatio: 'auto',
  selectedVideoInput: '',
  selectedAudioInput: '',
  selectedAudioOutput: '',
  remote: {
    bridgeUrl: 'ws://localhost:8765',
    lastDeviceName: null,
    lastDeviceAddress: null,
  },
}
