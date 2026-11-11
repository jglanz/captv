export const MACOS_PLATFORM = 'darwin'
export const WINDOWS_PLATFORM = 'win32'

export const ALWAYS_ON_TOP_IPC = {
  get: 'get-always-on-top',
  changed: 'always-on-top-changed',
} as const

export const ALWAYS_ON_TOP_SHORTCUT = {
  key: 't',
  macLabel: '⌘T',
  defaultLabel: 'Ctrl+T',
} as const
