import { useState, useEffect, useCallback, useRef } from 'react'

export interface MediaDeviceEntry {
  deviceId: string
  label: string
  kind: MediaDeviceKind
  groupId: string
}

export interface MediaDeviceState {
  videoInputs: MediaDeviceEntry[]
  audioInputs: MediaDeviceEntry[]
  audioOutputs: MediaDeviceEntry[]
  selectedVideoInput: string
  selectedAudioInput: string
  selectedAudioOutput: string
  setVideoInput: (deviceId: string) => void
  setAudioInput: (deviceId: string) => void
  setAudioOutput: (deviceId: string) => void
  refreshDevices: () => Promise<void>
  stream: MediaStream | null
  error: string | null
}

export interface UseMediaDevicesOptions {
  initialVideoInput?: string
  initialAudioInput?: string
  initialAudioOutput?: string
}

export function useMediaDevices(options: UseMediaDevicesOptions = {}): MediaDeviceState {
  const [videoInputs, setVideoInputs] = useState<MediaDeviceEntry[]>([])
  const [audioInputs, setAudioInputs] = useState<MediaDeviceEntry[]>([])
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceEntry[]>([])
  const [selectedVideoInput, setSelectedVideoInput] = useState(() => {
    console.log('[media] useMediaDevices mounted with initialVideoInput:', JSON.stringify(options.initialVideoInput))
    return options.initialVideoInput ?? ''
  })
  const [selectedAudioInput, setSelectedAudioInput] = useState(() => {
    console.log('[media] useMediaDevices mounted with initialAudioInput:', JSON.stringify(options.initialAudioInput))
    return options.initialAudioInput ?? ''
  })
  const [selectedAudioOutput, setSelectedAudioOutput] = useState(() => {
    console.log('[media] useMediaDevices mounted with initialAudioOutput:', JSON.stringify(options.initialAudioOutput))
    return options.initialAudioOutput || 'default'
  })
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const enumerateDevices = useCallback(async () => {
    try {
      let devices = await navigator.mediaDevices.enumerateDevices()

      // Labels are only exposed once capture permission is granted. Electron
      // auto-grants, so normally they're present without a temp stream. Only
      // open a temp permission stream if labels are actually missing — opening
      // one unconditionally races with startStream() for the capture device and
      // forces it into its default (4:3) format.
      const labelsMissing = devices.some(d => !d.label)
      console.log('[media] enumerateDevices: initial pass, labels missing:', labelsMissing)
      if (labelsMissing) {
        console.log('[media] Requesting temporary permission stream to reveal device labels')
        const tempStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        })
        tempStream.getTracks().forEach(t => t.stop())
        devices = await navigator.mediaDevices.enumerateDevices()
      }

      const videos = devices
        .filter(d => d.kind === 'videoinput')
        .map(d => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${d.deviceId.slice(0, 8)}`,
          kind: d.kind as MediaDeviceKind,
          groupId: d.groupId
        }))

      const audios = devices
        .filter(d => d.kind === 'audioinput')
        .map(d => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${d.deviceId.slice(0, 8)}`,
          kind: d.kind as MediaDeviceKind,
          groupId: d.groupId
        }))

      const outputs = devices
        .filter(d => d.kind === 'audiooutput')
        .map(d => ({
          deviceId: d.deviceId,
          label: d.label || `Speaker ${d.deviceId.slice(0, 8)}`,
          kind: d.kind as MediaDeviceKind,
          groupId: d.groupId
        }))

      console.log('[media] Enumerated video inputs:', videos.map(d => `${d.label} (${d.deviceId})`))
      console.log('[media] Enumerated audio inputs:', audios.map(d => `${d.label} (${d.deviceId})`))
      console.log('[media] Enumerated audio outputs:', outputs.map(d => `${d.label} (${d.deviceId})`))

      setVideoInputs(videos)
      setAudioInputs(audios)
      setAudioOutputs(outputs)
      setError(null)

      // Auto-select first device if none selected; keep (and log) saved selections
      setSelectedVideoInput(prev => {
        if (prev && videos.some(d => d.deviceId === prev)) {
          console.log('[media] Keeping selected video input (found in device list):', prev)
          return prev
        }
        if (prev) {
          console.warn('[media] Selected video input NOT found in enumerated devices, falling back to first:', prev)
        }
        const next = videos[0]?.deviceId ?? ''
        console.log('[media] Auto-selecting video input:', next ? `${videos[0].label} (${next})` : '(none available)')
        return next
      })
      setSelectedAudioInput(prev => {
        if (prev && audios.some(d => d.deviceId === prev)) {
          console.log('[media] Keeping selected audio input (found in device list):', prev)
          return prev
        }
        if (prev) {
          console.warn('[media] Selected audio input NOT found in enumerated devices, falling back to first:', prev)
        }
        const next = audios[0]?.deviceId ?? ''
        console.log('[media] Auto-selecting audio input:', next ? `${audios[0].label} (${next})` : '(none available)')
        return next
      })
    } catch (err) {
      console.error('[media] Device enumeration failed:', err)
      setError(`Failed to enumerate devices: ${err}`)
    }
  }, [])

  // Start/update media stream when input selections change
  const startStream = useCallback(async (videoId: string, audioId: string) => {
    console.log('[media] startStream called with videoId:', JSON.stringify(videoId), 'audioId:', JSON.stringify(audioId))
    // Stop existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }

    if (!videoId && !audioId) {
      console.log('[media] No devices selected, stream cleared')
      setStream(null)
      return
    }

    const constraints: MediaStreamConstraints = {}

    try {
      if (videoId) {
        constraints.video = {
          deviceId: { exact: videoId },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 60 }
        }
      }

      if (audioId) {
        constraints.audio = {
          deviceId: { exact: audioId },
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      }

      const newStream = await navigator.mediaDevices.getUserMedia(constraints)
      console.log('[media] Stream started, tracks:', newStream.getTracks().map(t => `${t.kind}: ${t.label}`))
      const videoTrack = newStream.getVideoTracks()[0] ?? null
      if (videoTrack) {
        const s = videoTrack.getSettings()
        console.log('[media] Video track settings:', `${s.width}x${s.height}@${s.frameRate}fps`, 'aspectRatio:', s.aspectRatio)
      }
      streamRef.current = newStream
      setStream(newStream)
      setError(null)
    } catch (err) {
      console.error('[media] getUserMedia failed for constraints', JSON.stringify(constraints), '->', err)
      setError(`Failed to start stream: ${err}`)
      setStream(null)
    }
  }, [])

  // Initial device enumeration
  useEffect(() => {
    enumerateDevices()
    navigator.mediaDevices.addEventListener('devicechange', enumerateDevices)
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', enumerateDevices)
    }
  }, [enumerateDevices])

  // Restart stream when selections change
  useEffect(() => {
    if (selectedVideoInput || selectedAudioInput) {
      startStream(selectedVideoInput, selectedAudioInput)
    }
  }, [selectedVideoInput, selectedAudioInput, startStream])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

  return {
    videoInputs,
    audioInputs,
    audioOutputs,
    selectedVideoInput,
    selectedAudioInput,
    selectedAudioOutput,
    setVideoInput: setSelectedVideoInput,
    setAudioInput: setSelectedAudioInput,
    setAudioOutput: setSelectedAudioOutput,
    refreshDevices: enumerateDevices,
    stream,
    error
  }
}
