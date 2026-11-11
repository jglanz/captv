import { contextBridge, ipcRenderer } from 'electron'
import type { IpcRendererEvent } from 'electron'
import type { AppSettings } from '@shared/settings/types'
import { ALWAYS_ON_TOP_IPC } from '@shared/window'

export interface ElectronAPI {
  toggleFullscreen: () => Promise<boolean>
  getFullscreen: () => Promise<boolean>
  setFullscreen: (fullscreen: boolean) => Promise<void>
  getAlwaysOnTop: () => Promise<boolean>
  onAlwaysOnTopChanged: (callback: (enabled: boolean) => void) => () => void
  minimizeWindow: () => Promise<void>
  maximizeWindow: () => Promise<void>
  closeWindow: () => Promise<void>
  getSettings: () => Promise<AppSettings>
  updateSettings: (partial: Partial<AppSettings>) => Promise<AppSettings>
  platform: string
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

const api: ElectronAPI = {
  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  getFullscreen: () => ipcRenderer.invoke('get-fullscreen'),
  setFullscreen: (fullscreen: boolean) => ipcRenderer.invoke('set-fullscreen', fullscreen),
  getAlwaysOnTop: () => ipcRenderer.invoke(ALWAYS_ON_TOP_IPC.get),
  onAlwaysOnTopChanged: (callback) => {
    const listener = (_event: IpcRendererEvent, enabled: boolean) => callback(enabled)
    ipcRenderer.on(ALWAYS_ON_TOP_IPC.changed, listener)
    return () => { ipcRenderer.removeListener(ALWAYS_ON_TOP_IPC.changed, listener) }
  },
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (partial: Partial<AppSettings>) => ipcRenderer.invoke('update-settings', partial),
  platform: process.platform,
}

contextBridge.exposeInMainWorld('electronAPI', api)
