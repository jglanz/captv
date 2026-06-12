import { useState, useEffect, useCallback } from 'react'

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toggleFullscreen = useCallback(async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.toggleFullscreen()
      setIsFullscreen(result)
    } else {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }, [])

  useEffect(() => {
    const checkFullscreen = async () => {
      if (window.electronAPI) {
        const fs = await window.electronAPI.getFullscreen()
        setIsFullscreen(fs)
      }
    }

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'F11' || (e.key === 'f' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault()
        toggleFullscreen()
      }
    }

    window.addEventListener('keydown', handleKeydown)
    const interval = setInterval(checkFullscreen, 2000)

    return () => {
      window.removeEventListener('keydown', handleKeydown)
      clearInterval(interval)
    }
  }, [toggleFullscreen])

  return { isFullscreen, toggleFullscreen }
}
