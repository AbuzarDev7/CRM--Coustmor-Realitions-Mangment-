import React, { useState, useRef } from 'react'
import {
  Camera,
  Upload,
  Link as LinkIcon,
  X,
  Check,
  Sparkles,
  User,
  Trash2,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react'

// Curated high quality professional avatar presets for all roles
export const PRESET_AVATARS = [
  {
    id: 'preset-1',
    label: 'Executive 1',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'preset-2',
    label: 'Manager 1',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'preset-3',
    label: 'Agent 1',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'preset-4',
    label: 'Client 1',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'preset-5',
    label: 'Executive 2',
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'preset-6',
    label: 'Manager 2',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'preset-7',
    label: 'Agent 2',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'preset-8',
    label: 'Client 2',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80'
  }
]

const ProfileAvatarUploader = ({
  avatar,
  name = 'User',
  role = 'Member',
  email = '',
  onAvatarChange,
  showToast
}) => {
  const [urlInput, setUrlInput] = useState('')
  const [showUrlField, setShowUrlField] = useState(false)
  const fileInputRef = useRef(null)

  const userInitials = (name || email || 'US')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  // Handle local image file upload from PC / mobile
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      if (showToast) showToast('Please select a valid image file (PNG, JPG, WebP)!')
      return
    }

    // Limit to 4MB for responsive data URL storage
    if (file.size > 4 * 1024 * 1024) {
      if (showToast) showToast('Image size should be under 4MB for fast loading!')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result
      if (dataUrl) {
        onAvatarChange(dataUrl)
        if (showToast) showToast('New profile photo loaded! Click Save to confirm.')
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // Handle URL apply
  const handleApplyUrl = (e) => {
    e.preventDefault()
    if (!urlInput.trim()) return

    onAvatarChange(urlInput.trim())
    if (showToast) showToast('Profile image URL updated! Click Save to confirm.')
    setUrlInput('')
    setShowUrlField(false)
  }

  // Handle preset selection
  const handleSelectPreset = (presetUrl) => {
    onAvatarChange(presetUrl)
    if (showToast) showToast('Preset avatar selected! Click Save to confirm.')
  }

  // Handle photo removal
  const handleRemovePhoto = () => {
    onAvatarChange('')
    if (showToast) showToast('Profile photo removed. Initial avatar will be shown.')
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <span>Profile Photo & Avatar</span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100">
              Personalized Identity
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload a custom photo, enter an image URL, or choose a curated professional avatar preset.
          </p>
        </div>

        {avatar && (
          <button
            type="button"
            onClick={handleRemovePhoto}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition cursor-pointer self-start sm:self-center"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove Photo</span>
          </button>
        )}
      </div>

      {/* Main Avatar Preview & Upload Action Controls */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Avatar Display Frame */}
        <div className="relative group shrink-0">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl tracking-wider ring-4 ring-slate-100">
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            ) : (
              <span>{userInitials}</span>
            )}
          </div>

          {/* Quick Camera Overlay Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Upload photo from device"
            className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-xl bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center shadow-md shadow-violet-600/30 transition hover:scale-110 cursor-pointer border-2 border-white"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Buttons & Info */}
        <div className="flex-1 space-y-3 text-center sm:text-left">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">{name}</h4>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-0.5">
              <span className="text-[11px] font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full capitalize">
                {role}
              </span>
              {email && <span className="text-xs text-slate-400 font-medium">{email}</span>}
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Upload Method Buttons */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-xs shadow-violet-600/20 transition cursor-pointer hover:scale-[1.01]"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload from Device</span>
            </button>

            <button
              type="button"
              onClick={() => setShowUrlField(!showUrlField)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
            >
              <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>{showUrlField ? 'Cancel URL' : 'Use Image URL'}</span>
            </button>
          </div>

          {/* URL Input Dropdown Form */}
          {showUrlField && (
            <form onSubmit={handleApplyUrl} className="flex items-center gap-2 pt-1 animate-fade-in max-w-md">
              <input
                type="url"
                required
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer shrink-0"
              >
                Apply
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Preset Curated Avatars Section */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            <span>Or Choose a Professional Preset Avatar:</span>
          </p>
          <span className="text-[11px] text-slate-400 font-medium">Click any avatar to select</span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {PRESET_AVATARS.map((preset) => {
            const isSelected = avatar === preset.url
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.url)}
                className={`relative rounded-xl p-1 transition cursor-pointer group hover:scale-105 ${
                  isSelected
                    ? 'ring-2 ring-violet-600 bg-violet-50 shadow-xs'
                    : 'hover:bg-slate-100 ring-1 ring-slate-200/60'
                }`}
                title={preset.label}
              >
                <img
                  src={preset.url}
                  alt={preset.label}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                {isSelected && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default ProfileAvatarUploader
