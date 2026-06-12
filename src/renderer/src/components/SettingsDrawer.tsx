import React from 'react'
import { DeviceSelector } from './DeviceSelector'
import { MediaDeviceEntry } from '../hooks/useMediaDevices'

interface SettingsDrawerProps {
  isOpen: boolean
  onClose: () => void
  videoInputs: MediaDeviceEntry[]
  audioInputs: MediaDeviceEntry[]
  audioOutputs: MediaDeviceEntry[]
  selectedVideoInput: string
  selectedAudioInput: string
  selectedAudioOutput: string
  onVideoInputChange: (deviceId: string) => void
  onAudioInputChange: (deviceId: string) => void
  onAudioOutputChange: (deviceId: string) => void
  onRefreshDevices: () => void
  aspectRatio: string
  onAspectRatioChange: (ratio: string) => void
}

export function SettingsDrawer({
  isOpen,
  onClose,
  videoInputs,
  audioInputs,
  audioOutputs,
  selectedVideoInput,
  selectedAudioInput,
  selectedAudioOutput,
  onVideoInputChange,
  onAudioInputChange,
  onAudioOutputChange,
  onRefreshDevices,
  aspectRatio,
  onAspectRatioChange
}: SettingsDrawerProps) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="absolute inset-0 bg-black/50 z-30 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`absolute top-0 right-0 h-full w-80 bg-tv-dark border-l border-tv-border z-40
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-tv-border">
          <h2 className="text-base font-semibold text-tv-text">Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-tv-hover transition-colors text-tv-muted hover:text-tv-text"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6 overflow-y-auto h-[calc(100%-60px)]">
          {/* Video Input */}
          <DeviceSelector
            label="Video Input"
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 7l-7 5 7 5V7z" />
                <rect x="1" y="5" width="15" height="14" rx="2" />
              </svg>
            }
            devices={videoInputs}
            selectedDeviceId={selectedVideoInput}
            onSelect={onVideoInputChange}
            allowNone
          />

          {/* Audio Input */}
          <DeviceSelector
            label="Audio Input"
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
              </svg>
            }
            devices={audioInputs}
            selectedDeviceId={selectedAudioInput}
            onSelect={onAudioInputChange}
            allowNone
          />

          <div className="border-t border-tv-border" />

          {/* Audio Output */}
          <DeviceSelector
            label="Audio Output"
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
              </svg>
            }
            devices={audioOutputs}
            selectedDeviceId={selectedAudioOutput}
            onSelect={onAudioOutputChange}
          />

          <div className="border-t border-tv-border" />

          {/* Aspect Ratio */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-tv-muted">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" />
              </svg>
              Aspect Ratio
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['auto', '16:9', '4:3', '21:9'].map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => onAspectRatioChange(ratio)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    aspectRatio === ratio
                      ? 'bg-tv-accent text-white'
                      : 'bg-tv-surface text-tv-muted hover:bg-tv-hover hover:text-tv-text'
                  }`}
                >
                  {ratio === 'auto' ? 'Auto' : ratio}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-tv-border" />

          {/* Refresh devices */}
          <button
            onClick={onRefreshDevices}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
              bg-tv-surface border border-tv-border text-sm text-tv-text
              hover:bg-tv-hover transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            Refresh Devices
          </button>

          <div className="border-t border-tv-border" />

          {/* Keyboard shortcuts */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-tv-muted">Keyboard Shortcuts</h3>
            <div className="space-y-1.5">
              {[
                ['F11', 'Toggle fullscreen'],
                ['Ctrl+F', 'Toggle fullscreen'],
                ['M', 'Toggle mute'],
                ['S', 'Toggle settings'],
                ['Esc', 'Close settings'],
              ].map(([key, desc]) => (
                <div key={key} className="flex items-center justify-between text-xs">
                  <span className="text-tv-muted">{desc}</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-tv-surface border border-tv-border text-tv-text font-mono">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
