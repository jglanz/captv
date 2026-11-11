import type { BrowserWindow } from 'electron'
import { ALWAYS_ON_TOP_IPC, ALWAYS_ON_TOP_SHORTCUT, MACOS_PLATFORM } from '@shared/window'

export const ALWAYS_ON_TOP_WINDOW_EVENTS = {
  beforeInput: 'before-input-event',
  changed: 'always-on-top-changed',
} as const

export const KEY_DOWN_INPUT_TYPE = 'keyDown'

export function installAlwaysOnTop(window: BrowserWindow, platform = process.platform): void {
  window.webContents.on(ALWAYS_ON_TOP_WINDOW_EVENTS.beforeInput, (event, input) => {
    const isMacOS = platform === MACOS_PLATFORM
    const primaryModifier = isMacOS ? input.meta : input.control
    const extraModifier = isMacOS ? input.control : input.meta
    const matchesShortcut = input.key.toLowerCase() === ALWAYS_ON_TOP_SHORTCUT.key
      && primaryModifier && !extraModifier && !input.alt && !input.shift

    if (!matchesShortcut) return

    event.preventDefault()
    if (input.type === KEY_DOWN_INPUT_TYPE && !input.isAutoRepeat) {
      window.setAlwaysOnTop(!window.isAlwaysOnTop())
    }
  })

  window.on(ALWAYS_ON_TOP_WINDOW_EVENTS.changed, (_event, enabled) => {
    window.webContents.send(ALWAYS_ON_TOP_IPC.changed, enabled)
  })
}
