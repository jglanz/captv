import { contextBridge, ipcRenderer } from 'electron'
import type { AppSettings } from '@shared/settings/types'

export interface ElectronAPI {
  toggleFullscreen: () => Promise<boolean>
  getFullscreen: () => Promise<boolean>
  setFullscreen: (fullscreen: boolean) => Promise<void>
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
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (partial: Partial<AppSettings>) => ipcRenderer.invoke('update-settings', partial),
  platform: process.platform,
}

contextBridge.exposeInMainWorld('electronAPI', api)