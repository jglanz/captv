import React, { useRef, useEffect } from 'react'

interface VideoPlayerProps {
  stream: MediaStream | null
  audioOutputDeviceId: string
  muted: boolean
  volume: number
  aspectRatio?: string
}

export function VideoPlayer({ stream, audioOutputDeviceId, muted, volume, aspectRatio }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Attach video tracks to the video element
  useEffect(() => {
    if (!videoRef.current) return
    if (stream) {
      const videoTracks = stream.getVideoTracks()
      if (videoTracks.length > 0) {
        videoRef.current.srcObject = new MediaStream(videoTracks)
        videoRef.current.play().catch(() => {})
      }
    } else {
      videoRef.current.srcObject = null
    }
  }, [stream])

  // Attach audio tracks to a separate audio element for output device routing
  useEffect(() => {
    if (!audioRef.current) return
    if (stream) {
      const audioTracks = stream.getAudioTracks()
      if (audioTracks.length > 0) {
        audioRef.current.srcObject = new MediaStream(audioTracks)
        audioRef.current.play().catch(() => {})
      }
    } else {
      audioRef.current.srcObject = null
    }
  }, [stream])

  // Route audio to selected output device via setSinkId
  useEffect(() => {
    if (!audioRef.current || !audioOutputDeviceId) return
    const el = audioRef.current as HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> }
    if (typeof el.setSinkId === 'function') {
      el.setSinkId(audioOutputDeviceId).catch((err: Error) => {
        console.error('Failed to set audio output device:', err)
      })
    }
  }, [audioOutputDeviceId])

  // Handle muting
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = muted
    }
  }, [muted])

  // Apply volume (UI scale 0-100 -> media element scale 0-1)
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.min(Math.max(volume / 100, 0), 1)
    }
  }, [volume])

  // Prevent accidental pause (e.g. clicking the video)
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const handlePause = () => {
      if (video.srcObject) video.play().catch(() => {})
    }
    video.addEventListener('pause', handlePause)
    return () => video.removeEventListener('pause', handlePause)
  }, [])

  const aspectStyle: React.CSSProperties = {}
  if (aspectRatio && aspectRatio !== 'auto') {
    const [w, h] = aspectRatio.split(':').map(Number)
    if (w && h) {
      aspectStyle.aspectRatio = `${w} / ${h}`
      aspectStyle.maxWidth = '100%'
      aspectStyle.maxHeight = '100%'
    }
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black">
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        style={aspectStyle}
        playsInline
        muted
        autoPlay
      />
      <audio ref={audioRef} />

      {!stream && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-tv-muted">
          <svg className="w-24 h-24 mb-4 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
          <p className="text-lg font-medium opacity-40">No video source selected</p>
          <p className="text-sm opacity-30 mt-1">Press S to open settings and select an input device</p>
        </div>
      )}
    </div>
  )
}
