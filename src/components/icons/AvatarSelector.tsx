'use client'

import React from 'react'
import { AvatarType, getAllAvatars, AVATAR_DEFINITIONS } from '@/lib/avatars'
import { AvatarDisplay } from './AvatarDisplay'

interface AvatarSelectorProps {
  value: AvatarType
  onChange: (avatar: AvatarType) => void
  className?: string
  label?: string
}

/**
 * AvatarSelector Component
 * 
 * Provides a grid-based UI for selecting an avatar
 * Replaces the previous emoji-based system
 */
export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  value,
  onChange,
  className = '',
  label = 'Lievelings avatar',
}) => {
  const avatars = getAllAvatars()

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-bold text-ink-700 mb-3">
          {label}
        </label>
      )}

      <div className="grid grid-cols-5 gap-3">
        {avatars.map((avatar) => {
          const definition = AVATAR_DEFINITIONS[avatar]
          const isSelected = value === avatar

          return (
            <button
              key={avatar}
              type="button"
              onClick={() => onChange(avatar)}
              className={`
                p-3 rounded-lg transition-all duration-200
                flex items-center justify-center
                border-2
                ${
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-md'
                    : 'border-gray-200 bg-white hover:border-primary/30 hover:bg-gray-50'
                }
                focus:outline-none focus:ring-2 focus:ring-primary/50
                active:scale-95
              `}
              title={definition.label}
              aria-label={`Select ${definition.label} avatar`}
              aria-pressed={isSelected}
            >
              <AvatarDisplay avatar={avatar} size={32} />
            </button>
          )
        })}
      </div>

      {/* Avatar name below grid */}
      <div className="mt-3 text-center text-sm font-medium text-gray-600">
        {AVATAR_DEFINITIONS[value].label}
      </div>
    </div>
  )
}
