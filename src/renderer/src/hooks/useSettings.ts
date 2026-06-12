import { useState, useEffect, useCallback, useRef } from 'react'
import { AppSettings, DEFAULT_SETTINGS } from '@shared/settings/types'

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Accumulates partials between debounced sends so rapid successive updates
  // don't clobber each other (previously only the LAST partial was sent).
  const pending = useRef<Partial<AppSettings>>({})

  useEffect(() => {
    console.log('[settings:renderer] Fetching settings from main process...')
    window.electronAPI?.getSettings().then((s) => {
      console.log('[settings:renderer] Received settings from main:', JSON.stringify(s))
      setSettings(s)
      setLoaded(true)
    }).catch((err) => {
      console.error('[settings:renderer] getSettings failed, using defaults:', err)
      setLoaded(true)
    })
  }, [])

  const sendPending = useCallback(() => {
    const partial = pending.current
    pending.current = {}
    if (Object.keys(partial).length === 0) return
    console.log('[settings:renderer] Sending settings update to main:', JSON.stringify(partial))
    window.electronAPI?.updateSettings(partial)
      .then((result) => {
        console.log('[settings:renderer] Main acknowledged update, settings now:', JSON.stringify(result))
      })
      .catch((err) => {
        console.error('[settings:renderer] updateSettings IPC failed:', err)
      })
  }, [])

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    console.log('[settings:renderer] updateSettings called with:', JSON.stringify(partial))
    setSettings((prev) => {
      const next = { ...prev, ...partial }
      if (partial.remote) {
        next.remote = { ...prev.remote, ...partial.remote }
      }
      return next
    })

    // Merge into pending instead of replacing, so earlier partials survive the debounce
    const prevRemote = pending.current.remote
    pending.current = { ...pending.current, ...partial }
    if (partial.remote && prevRemote) {
      pending.current.remote = { ...prevRemote, ...partial.remote }
    }

    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null
      sendPending()
    }, 300)
  }, [sendPending])

  // Flush any pending update if the window is closed before the debounce fires
  useEffect(() => {
    const flush = () => {
      if (saveTimer.current) {
        console.log('[settings:renderer] Window closing with pending settings update, flushing now')
        clearTimeout(saveTimer.current)
        saveTimer.current = null
        sendPending()
      }
    }
    window.addEventListener('pagehide', flush)
    return () => window.removeEventListener('pagehide', flush)
  }, [sendPending])

  return { settings, loaded, updateSettings }
}
