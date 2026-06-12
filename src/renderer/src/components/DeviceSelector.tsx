import React from 'react'
import { MediaDeviceEntry } from '../hooks/useMediaDevices'

interface DeviceSelectorProps {
  label: string
  icon: React.ReactNode
  devices: MediaDeviceEntry[]
  selectedDeviceId: string
  onSelect: (deviceId: string) => void
  allowNone?: boolean
}

export function DeviceSelector({
  label,
  icon,
  devices,
  selectedDeviceId,
  onSelect,
  allowNone = false
}: DeviceSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-tv-muted">
        {icon}
        {label}
      </label>
      <select
        value={selectedDeviceId}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full bg-tv-surface border border-tv-border rounded-lg px-3 py-2.5 text-sm text-tv-text
          focus:outline-none focus:ring-2 focus:ring-tv-accent/50 focus:border-tv-accent
          appearance-none cursor-pointer hover:bg-tv-hover transition-colors"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23737373' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center'
        }}
      >
        {allowNone && <option value="">None</option>}
        {devices.map((device) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label}
          </option>
        ))}
        {devices.length === 0 && (
          <option value="" disabled>No devices found</option>
        )}
      </select>
    </div>
  )
}
