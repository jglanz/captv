import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import windowStateKeeper from 'electron-window-state'
import { SettingsManager } from './SettingsManager'
import { AppSettings } from '@shared/settings/types'

const MACOS_PLATFORM = 'darwin'
const WINDOWS_PLATFORM = 'win32'
const ICON_ASSET_DIRECTORY_PARTS = ['assets', 'app', 'icons'] as const
const PACKAGED_ICON_DIRECTORY = 'icons'
const WINDOW_ICON_PATH_PARTS = process.platform === WINDOWS_PLATFORM
  ? ['win', 'icon.ico'] as const
  : ['linux', '512x512.png'] as const

let mainWindow: BrowserWindow
let settings: SettingsManager

function getAppIconPath(): string {
  const iconDirectory = app.isPackaged
    ? join(process.resourcesPath, PACKAGED_ICON_DIRECTORY)
    : join(app.getAppPath(), ...ICON_ASSET_DIRECTORY_PARTS)
  return join(iconDirectory, ...WINDOW_ICON_PATH_PARTS)
}

function createWindow(): void {
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1280,
    defaultHeight: 720
  })

  mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    minWidth: 640,
    minHeight: 360,
    icon: getAppIconPath(),
    backgroundColor: '#0a0a0a',
    titleBarStyle: process.platform === MACOS_PLATFORM ? 'hiddenInset' : 'default',
    frame: process.platform === MACOS_PLATFORM,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    },
    show: false
  })

  mainWindowState.manage(mainWindow)

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.tvview.app')
  if (is.dev && process.platform === MACOS_PLATFORM) {
    app.dock?.setIcon(getAppIconPath())
  }
  settings = new SettingsManager()

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC: Settings
  ipcMain.handle('get-settings', () => {
    const all = settings.getAll()
    console.log('[settings:main] IPC get-settings ->', JSON.stringify(all))
    return all
  })

  ipcMain.handle('update-settings', (_event, partial: Partial<AppSettings>) => {
    console.log('[settings:main] IPC update-settings <-', JSON.stringify(partial))
    return settings.update(partial)
  })

  // IPC: Fullscreen controls
  ipcMain.handle('toggle-fullscreen', () => {
    if (mainWindow) {
      mainWindow.setFullScreen(!mainWindow.isFullScreen())
      return mainWindow.isFullScreen()
    }
    return false
  })

  ipcMain.handle('get-fullscreen', () => {
    return mainWindow?.isFullScreen() ?? false
  })

  ipcMain.handle('set-fullscreen', (_event, fullscreen: boolean) => {
    mainWindow?.setFullScreen(fullscreen)
  })

  // IPC: Window controls (for frameless window on Windows/Linux)
  ipcMain.handle('minimize-window', () => {
    mainWindow?.minimize()
  })

  ipcMain.handle('maximize-window', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })

  ipcMain.handle('close-window', () => {
    mainWindow?.close()
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== MACOS_PLATFORM) {
    app.quit()
  }
})

app.on('before-quit', () => {
  settings?.flush()
})
