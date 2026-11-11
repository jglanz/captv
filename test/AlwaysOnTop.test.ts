import { EventEmitter } from 'events'
import type { BrowserWindow, Input } from 'electron'
import { installAlwaysOnTop, ALWAYS_ON_TOP_WINDOW_EVENTS, KEY_DOWN_INPUT_TYPE } from '../src/main/AlwaysOnTop'
import { ALWAYS_ON_TOP_IPC, ALWAYS_ON_TOP_SHORTCUT, MACOS_PLATFORM, WINDOWS_PLATFORM } from '@shared/window'

const SUPPORTED_PLATFORMS = ['linux', WINDOWS_PLATFORM, MACOS_PLATFORM] as const
const KEY_UP_INPUT_TYPE = 'keyUp'
const SHORTCUT_KEY_CODE = 'KeyT'
const OTHER_KEY = 'f'

class FakeWindow extends EventEmitter {
  private pinned = false
  webContents = Object.assign(new EventEmitter(), { send: jest.fn() })
  isAlwaysOnTop = jest.fn(() => this.pinned)
  setAlwaysOnTop = jest.fn((enabled: boolean) => {
    this.pinned = enabled
    this.emit(ALWAYS_ON_TOP_WINDOW_EVENTS.changed, {}, enabled)
  })
}

describe.each(SUPPORTED_PLATFORMS)('always on top on %s', (platform) => {
  let window: FakeWindow

  function dispatchInput(overrides: Partial<Input> = {}) {
    const event = { preventDefault: jest.fn() }
    const input: Input = {
      type: KEY_DOWN_INPUT_TYPE,
      key: ALWAYS_ON_TOP_SHORTCUT.key,
      code: SHORTCUT_KEY_CODE,
      isAutoRepeat: false,
      isComposing: false,
      shift: false,
      alt: false,
      control: platform !== MACOS_PLATFORM,
      meta: platform === MACOS_PLATFORM,
      location: 0,
      modifiers: [],
      ...overrides,
    }
    window.webContents.emit(ALWAYS_ON_TOP_WINDOW_EVENTS.beforeInput, event, input)
    return event
  }

  beforeEach(() => {
    window = new FakeWindow()
    installAlwaysOnTop(window as unknown as BrowserWindow, platform)
  })

  it('toggles the native window state and notifies the renderer on each press', () => {
    expect(dispatchInput().preventDefault).toHaveBeenCalled()
    expect(window.isAlwaysOnTop()).toBe(true)
    expect(window.webContents.send).toHaveBeenLastCalledWith(ALWAYS_ON_TOP_IPC.changed, true)

    expect(dispatchInput().preventDefault).toHaveBeenCalled()
    expect(window.isAlwaysOnTop()).toBe(false)
    expect(window.webContents.send).toHaveBeenLastCalledWith(ALWAYS_ON_TOP_IPC.changed, false)
    expect(window.setAlwaysOnTop.mock.calls).toEqual([[true], [false]])
  })

  it('consumes repeated keys and key-up without toggling a second time', () => {
    dispatchInput()
    expect(dispatchInput({ isAutoRepeat: true }).preventDefault).toHaveBeenCalled()
    expect(dispatchInput({ type: KEY_UP_INPUT_TYPE }).preventDefault).toHaveBeenCalled()
    expect(window.isAlwaysOnTop()).toBe(true)
    expect(window.setAlwaysOnTop.mock.calls).toEqual([[true]])
  })

  it.each([
    { alt: true },
    { shift: true },
    { meta: true, control: true },
    { meta: false, control: false },
    { meta: platform !== MACOS_PLATFORM, control: platform === MACOS_PLATFORM },
    { key: OTHER_KEY },
  ])('ignores other key combinations: %j', (input) => {
    expect(dispatchInput(input).preventDefault).not.toHaveBeenCalled()
    expect(window.setAlwaysOnTop).not.toHaveBeenCalled()
  })

  it('updates the renderer when the window state changes outside the shortcut', () => {
    window.setAlwaysOnTop(true)
    expect(window.webContents.send).toHaveBeenLastCalledWith(ALWAYS_ON_TOP_IPC.changed, true)
    window.setAlwaysOnTop(false)
    expect(window.webContents.send).toHaveBeenLastCalledWith(ALWAYS_ON_TOP_IPC.changed, false)
  })
})
