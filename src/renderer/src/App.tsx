import React, { useState, useCallback, useEffect } from 'react'
import { VideoPlayer } from './components/VideoPlayer'
import { ControlBar } from './components/ControlBar'
import { SettingsDrawer } from './components/SettingsDrawer'
import { useMediaDevices } from './hooks/useMediaDevices'
import { useFullscreen } from './hooks/useFullscreen'
import { useSettings } from './hooks/useSettings'
import type { AppSettings } from '@shared/settings/types'

export default function App() {
  const { settings, loaded, updateSettings } = useSettings()

  // Settings load asynchronously from the main process. useMediaDevices only reads
  // its initial* options once (useState initializers), so mounting it before settings
  // arrive would permanently discard the saved device selections — the original
  // "audio input not persisting" bug. Gate mounting on `loaded`.
  if (!loaded) {
    console.log('[app] Settings not loaded yet, deferring media device initialization')
    return <div className="w-full h-full bg-black" />
  }

  return <AppContent settings={settings} updateSettings={updateSettings} />
}

function AppContent({
  settings,
  updateSettings,
}: {
  settings: AppSettings
  updateSettings: (partial: Partial<AppSettings>) => void
}) {
  useEffect(() => {
    console.log('[app] Mounted with saved device selections — video:',
      JSON.stringify(settings.selectedVideoInput), 'audioIn:',
      JSON.stringify(settings.selectedAudioInput), 'audioOut:',
      JSON.stringify(settings.selectedAudioOutput))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const devices = useMediaDevices({
    initialVideoInput: settings.selectedVideoInput,
    initialAudioInput: settings.selectedAudioInput,
    initialAudioOutput: settings.selectedAudioOutput,
  })
  const { isFullscreen, toggleFullscreen } = useFullscreen()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const isMuted = settings.muted
  const volume = settings.volume
  const aspectRatio = settings.aspectRatio

  const toggleMute = useCallback(() => updateSettings({ muted: !isMuted }), [isMuted, updateSettings])
  const toggleSettings = useCallback(() => setSettingsOpen(s => !s), [])

  const handleVolumeChange = useCallback((v: number) => updateSettings({ volume: v }), [updateSettings])
  const handleAspectRatioChange = useCallback((r: string) => updateSettings({ aspectRatio: r }), [updateSettings])

  const handleVideoInputChange = useCallback((id: string) => {
    console.log('[app] User changed video input to:', JSON.stringify(id))
    devices.setVideoInput(id)
    updateSettings({ selectedVideoInput: id })
  }, [devices, updateSettings])

  const handleAudioInputChange = useCallback((id: string) => {
    console.log('[app] User changed audio input to:', JSON.stringify(id))
    devices.setAudioInput(id)
    updateSettings({ selectedAudioInput: id })
  }, [devices, updateSettings])

  const handleAudioOutputChange = useCallback((id: string) => {
    console.log('[app] User changed audio output to:', JSON.stringify(id))
    devices.setAudioOutput(id)
    updateSettings({ selectedAudioOutput: id })
  }, [devices, updateSettings])

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLSelectElement || e.target instanceof HTMLInputElement) return

      switch (e.key.toLowerCase()) {
        case 'm':
          toggleMute()
          break
        case 's':
          if (!e.ctrlKey && !e.metaKey) toggleSettings()
          break
        case 'escape':
          if (settingsOpen) setSettingsOpen(false)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleMute, toggleSettings, settingsOpen])

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {/* macOS title bar drag area */}
      {window.electronAPI?.platform === 'darwin' && (
        <div className="absolute top-0 left-0 right-0 h-8 titlebar-drag z-50" />
      )}

      {/* Windows/Linux custom title bar */}
      {window.electronAPI && window.electronAPI.platform !== 'darwin' && (
        <div className="absolute top-0 left-0 right-0 h-8 flex items-center justify-between z-50 bg-black/60 titlebar-drag">
          <span className="text-xs text-tv-muted pl-3 titlebar-drag">TV View</span>
          <div className="flex titlebar-no-drag">
            <button
              onClick={() => window.electronAPI.minimizeWindow()}
              className="px-3 py-1 hover:bg-white/10 text-tv-muted hover:text-white transition-colors"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14" />
              </svg>
            </button>
            <button
              onClick={() => window.electronAPI.maximizeWindow()}
              className="px-3 py-1 hover:bg-white/10 text-tv-muted hover:text-white transition-colors"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
            </button>
            <button
              onClick={() => window.electronAPI.closeWindow()}
              className="px-3 py-1 hover:bg-red-500 text-tv-muted hover:text-white transition-colors"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Video Player */}
      <VideoPlayer
        stream={devices.stream}
        audioOutputDeviceId={devices.selectedAudioOutput}
        muted={isMuted}
        volume={volume}
        aspectRatio={aspectRatio}
      />

      {/* Control Bar (auto-hides) */}
      <ControlBar
        isMuted={isMuted}
        isFullscreen={isFullscreen}
        hasStream={!!devices.stream}
        onToggleMute={toggleMute}
        onToggleFullscreen={toggleFullscreen}
        onOpenSettings={toggleSettings}
        volume={volume}
        onVolumeChange={handleVolumeChange}
      />

      {/* Settings Drawer */}
      <SettingsDrawer
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        videoInputs={devices.videoInputs}
        audioInputs={devices.audioInputs}
        audioOutputs={devices.audioOutputs}
        selectedVideoInput={devices.selectedVideoInput}
        selectedAudioInput={devices.selectedAudioInput}
        selectedAudioOutput={devices.selectedAudioOutput}
        onVideoInputChange={handleVideoInputChange}
        onAudioInputChange={handleAudioInputChange}
        onAudioOutputChange={handleAudioOutputChange}
        onRefreshDevices={devices.refreshDevices}
        aspectRatio={aspectRatio}
        onAspectRatioChange={handleAspectRatioChange}
      />

      {/* Error toast */}
      {devices.error && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50
          bg-red-500/20 border border-red-500/40 rounded-lg px-4 py-2 max-w-md">
          <p className="text-sm text-red-300">{devices.error}</p>
        </div>
      )}
    </div>
  )
}
