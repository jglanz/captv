import { useEffect, useState } from 'react'

export function useAlwaysOnTop(): boolean {
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false)

  useEffect(() => {
    const api = window.electronAPI
    if (!api) return

    let active = true
    let stateChanged = false
    const unsubscribe = api.onAlwaysOnTopChanged((enabled) => {
      stateChanged = true
      if (active) setIsAlwaysOnTop(enabled)
    })

    // Subscribe first so a toggle during the initial IPC request cannot be lost.
    api.getAlwaysOnTop().then((enabled) => {
      if (active && !stateChanged) setIsAlwaysOnTop(enabled)
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return isAlwaysOnTop
}
