'use client'

import * as React from 'react'
import { type AvatarType, AVATAR_DEFINITIONS } from '@/lib/avatars'

/**
 * Bear Avatar SVG Component
 */
export function BearAvatar({ className = 'w-12 h-12' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      aria-label="Bear avatar"
      role="img"
    >
      {/* Head */}
      <circle cx="50" cy="50" r="35" fill="#8B6F47" />
      
      {/* Ears */}
      <circle cx="25" cy="25" r="12" fill="#8B6F47" />
      <circle cx="75" cy="25" r="12" fill="#8B6F47" />
      <circle cx="25" cy="25" r="8" fill="#A0826D" />
      <circle cx="75" cy="25" r="8" fill="#A0826D" />
      
      {/* Snout */}
      <ellipse cx="50" cy="60" rx="15" ry="12" fill="#A0826D" />
      
      {/* Eyes */}
      <circle cx="40" cy="45" r="4" fill="#000000" />
      <circle cx="60" cy="45" r="4" fill="#000000" />
      
      {/* Nose */}
      <circle cx="50" cy="60" r="3" fill="#000000" />
      
      {/* Mouth */}
      <path d="M 50 63 Q 45 68 40 66" stroke="#000000" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M 50 63 Q 55 68 60 66" stroke="#000000" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  )
}

/**
 * Fox Avatar SVG Component
 */
export function FoxAvatar({ className = 'w-12 h-12' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      aria-label="Fox avatar"
      role="img"
    >
      {/* Head */}
      <circle cx="50" cy="55" r="30" fill="#FF6B35" />
      
      {/* Ears */}
      <polygon points="30,25 25,5 35,20" fill="#FF6B35" />
      <polygon points="70,25 75,5 65,20" fill="#FF6B35" />
      <polygon points="30,25 27,12 33,22" fill="#FFF8DC" />
      <polygon points="70,25 73,12 67,22" fill="#FFF8DC" />
      
      {/* Snout */}
      <ellipse cx="50" cy="65" rx="12" ry="10" fill="#FFF8DC" />
      
      {/* Eyes */}
      <circle cx="42" cy="50" r="3" fill="#000000" />
      <circle cx="58" cy="50" r="3" fill="#000000" />
      
      {/* Nose */}
      <circle cx="50" cy="65" r="2" fill="#000000" />
      
      {/* Whiskers */}
      <line x1="35" y1="60" x2="20" y2="58" stroke="#FF6B35" strokeWidth="1" />
      <line x1="35" y1="65" x2="20" y2="68" stroke="#FF6B35" strokeWidth="1" />
      <line x1="65" y1="60" x2="80" y2="58" stroke="#FF6B35" strokeWidth="1" />
      <line x1="65" y1="65" x2="80" y2="68" stroke="#FF6B35" strokeWidth="1" />
    </svg>
  )
}

/**
 * Lion Avatar SVG Component
 */
export function LionAvatar({ className = 'w-12 h-12' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      aria-label="Lion avatar"
      role="img"
    >
      {/* Mane */}
      <circle cx="50" cy="50" r="38" fill="#D4A574" />
      
      {/* Mane spikes */}
      <circle cx="25" cy="30" r="8" fill="#D4A574" />
      <circle cx="15" cy="50" r="8" fill="#D4A574" />
      <circle cx="25" cy="70" r="8" fill="#D4A574" />
      <circle cx="50" cy="20" r="8" fill="#D4A574" />
      <circle cx="75" cy="30" r="8" fill="#D4A574" />
      <circle cx="85" cy="50" r="8" fill="#D4A574" />
      <circle cx="75" cy="70" r="8" fill="#D4A574" />
      <circle cx="50" cy="85" r="8" fill="#D4A574" />
      
      {/* Head */}
      <circle cx="50" cy="50" r="25" fill="#CD9B6B" />
      
      {/* Eyes */}
      <circle cx="42" cy="45" r="3" fill="#000000" />
      <circle cx="58" cy="45" r="3" fill="#000000" />
      
      {/* Nose */}
      <circle cx="50" cy="55" r="2" fill="#000000" />
      
      {/* Mouth */}
      <path d="M 50 57 Q 45 62 40 60" stroke="#000000" strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d="M 50 57 Q 55 62 60 60" stroke="#000000" strokeWidth="1" fill="none" strokeLinecap="round" />
    </svg>
  )
}

/**
 * Rabbit Avatar SVG Component
 */
export function RabbitAvatar({ className = 'w-12 h-12' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      aria-label="Rabbit avatar"
      role="img"
    >
      {/* Head */}
      <circle cx="50" cy="60" r="28" fill="#FFC0CB" />
      
      {/* Ears */}
      <ellipse cx="35" cy="15" rx="8" ry="20" fill="#FFC0CB" />
      <ellipse cx="65" cy="15" rx="8" ry="20" fill="#FFC0CB" />
      <ellipse cx="35" cy="20" rx="4" ry="12" fill="#FF69B4" />
      <ellipse cx="65" cy="20" rx="4" ry="12" fill="#FF69B4" />
      
      {/* Snout */}
      <ellipse cx="50" cy="70" rx="10" ry="8" fill="#FFF0F5" />
      
      {/* Eyes */}
      <circle cx="42" cy="55" r="3" fill="#000000" />
      <circle cx="58" cy="55" r="3" fill="#000000" />
      
      {/* Nose */}
      <circle cx="50" cy="70" r="2" fill="#FF1493" />
      
      {/* Mouth */}
      <path d="M 50 72 Q 45 76 42 74" stroke="#000000" strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d="M 50 72 Q 55 76 58 74" stroke="#000000" strokeWidth="1" fill="none" strokeLinecap="round" />
    </svg>
  )
}

/**
 * Rocket Avatar SVG Component
 */
export function RocketAvatar({ className = 'w-12 h-12' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      aria-label="Rocket avatar"
      role="img"
    >
      {/* Rocket body */}
      <path d="M 50 10 L 65 50 L 65 70 Q 50 80 35 70 L 35 50 Z" fill="#FF6B6B" />
      
      {/* Window */}
      <circle cx="50" cy="35" r="8" fill="#FFD93D" />
      <circle cx="50" cy="35" r="6" fill="#FFF" opacity="0.6" />
      
      {/* Left fin */}
      <path d="M 35 55 L 20 75 L 35 70 Z" fill="#4ECDC4" />
      
      {/* Right fin */}
      <path d="M 65 55 L 80 75 L 65 70 Z" fill="#4ECDC4" />
      
      {/* Flames */}
      <path d="M 42 75 L 45 90 L 50 85 Z" fill="#FF9F43" />
      <path d="M 58 75 L 55 90 L 50 85 Z" fill="#FF9F43" />
      <path d="M 50 75 L 48 88 L 52 88 Z" fill="#FFC837" />
    </svg>
  )
}

/**
 * Princess Avatar SVG Component
 */
export function PrincessAvatar({ className = 'w-12 h-12' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      aria-label="Princess avatar"
      role="img"
    >
      {/* Crown */}
      <path d="M 30 30 L 35 15 L 50 20 L 65 15 L 70 30" fill="#FFD700" />
      <circle cx="50" cy="18" r="4" fill="#FF1493" />
      
      {/* Head */}
      <circle cx="50" cy="55" r="25" fill="#F5DEB3" />
      
      {/* Hair */}
      <path d="M 30 50 Q 25 40 30 30 Q 40 25 50 25 Q 60 25 70 30 Q 75 40 70 50" fill="#FFD700" />
      
      {/* Face */}
      <circle cx="50" cy="55" r="22" fill="#FFE4B5" />
      
      {/* Eyes */}
      <circle cx="42" cy="50" r="2.5" fill="#000000" />
      <circle cx="58" cy="50" r="2.5" fill="#000000" />
      {/* Eye shine */}
      <circle cx="43" cy="49" r="1" fill="#FFFFFF" />
      <circle cx="59" cy="49" r="1" fill="#FFFFFF" />
      
      {/* Nose */}
      <circle cx="50" cy="58" r="1.5" fill="#000000" />
      
      {/* Mouth - smile */}
      <path d="M 50 62 Q 45 66 40 64" stroke="#FF1493" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M 50 62 Q 55 66 60 64" stroke="#FF1493" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  )
}

/**
 * Wizard Avatar SVG Component
 */
export function WizardAvatar({ className = 'w-12 h-12' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      aria-label="Wizard avatar"
      role="img"
    >
      {/* Hat */}
      <path d="M 25 35 L 50 10 L 75 35 Z" fill="#4B0082" />
      <ellipse cx="50" cy="35" rx="25" ry="6" fill="#4B0082" />
      {/* Moon on hat */}
      <circle cx="55" cy="22" r="4" fill="#FFD700" />
      <circle cx="57" cy="22" r="4" fill="#4B0082" />
      
      {/* Head */}
      <circle cx="50" cy="60" r="22" fill="#D2B48C" />
      
      {/* Long beard */}
      <path d="M 40 75 Q 35 85 40 95" stroke="#8B7355" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M 50 75 Q 50 90 50 100" stroke="#8B7355" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M 60 75 Q 65 85 60 95" stroke="#8B7355" strokeWidth="2" fill="none" strokeLinecap="round" />
      
      {/* Eyes */}
      <circle cx="42" cy="55" r="2.5" fill="#000000" />
      <circle cx="58" cy="55" r="2.5" fill="#000000" />
      
      {/* Magical sparkle effect */}
      <line x1="70" y1="45" x2="80" y2="35" stroke="#FFD700" strokeWidth="1.5" />
      <line x1="75" y1="40" x2="85" y2="40" stroke="#FFD700" strokeWidth="1.5" />
    </svg>
  )
}

/**
 * T-Rex Avatar SVG Component (Dinosaur)
 */
export function TRexAvatar({ className = 'w-12 h-12' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      aria-label="T-Rex avatar"
      role="img"
    >
      {/* Head */}
      <ellipse cx="55" cy="45" rx="20" ry="22" fill="#228B22" />
      
      {/* Snout */}
      <ellipse cx="75" cy="48" rx="12" ry="10" fill="#228B22" />
      
      {/* Back spikes */}
      <polygon points="35,30 32,18 38,28" fill="#32CD32" />
      <polygon points="42,25 40,12 46,23" fill="#32CD32" />
      <polygon points="49,23 47,8 53,21" fill="#32CD32" />
      
      {/* Eye */}
      <circle cx="60" cy="38" r="3" fill="#FFFF00" />
      <circle cx="61" cy="37" r="1.5" fill="#000000" />
      
      {/* Nostril */}
      <circle cx="82" cy="45" r="2" fill="#000000" />
      
      {/* Teeth */}
      <rect x="75" y="55" width="2" height="4" fill="#FFFFFF" />
      <rect x="80" y="55" width="2" height="4" fill="#FFFFFF" />
      
      {/* Tongue */}
      <ellipse cx="78" cy="60" rx="3" ry="2" fill="#FF69B4" />
      
      {/* Jaw line */}
      <path d="M 75 58 Q 85 62 88 58" stroke="#1a6b1a" strokeWidth="1" fill="none" />
    </svg>
  )
}

/**
 * Unicorn Avatar SVG Component
 */
export function UnicornAvatar({ className = 'w-12 h-12' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      aria-label="Unicorn avatar"
      role="img"
    >
      {/* Horn */}
      <path d="M 50 15 L 48 40 L 52 40 Z" fill="#FFD700" />
      {/* Horn shine */}
      <line x1="49.5" y1="20" x2="49.5" y2="38" stroke="#FFF" strokeWidth="0.5" opacity="0.6" />
      
      {/* Mane - magical colors */}
      <path d="M 40 35 Q 38 30 42 25 Q 45 20 48 25 Q 50 30 48 35" fill="#FF69B4" />
      <path d="M 48 35 Q 50 30 54 25 Q 57 20 60 25 Q 62 30 60 35" fill="#9370DB" />
      
      {/* Head */}
      <circle cx="50" cy="52" r="23" fill="#FFB6C1" />
      
      {/* Ears */}
      <ellipse cx="38" cy="35" rx="6" ry="10" fill="#FFB6C1" />
      <ellipse cx="62" cy="35" rx="6" ry="10" fill="#FFB6C1" />
      
      {/* Snout */}
      <ellipse cx="50" cy="65" rx="10" ry="8" fill="#FFC0CB" />
      
      {/* Eyes - magical */}
      <circle cx="42" cy="48" r="3" fill="#9370DB" />
      <circle cx="58" cy="48" r="3" fill="#9370DB" />
      <circle cx="43" cy="47" r="1.5" fill="#FFFFFF" />
      <circle cx="59" cy="47" r="1.5" fill="#FFFFFF" />
      
      {/* Nose */}
      <circle cx="50" cy="65" r="2" fill="#FF1493" />
      
      {/* Smile */}
      <path d="M 50 68 Q 46 71 42 69" stroke="#FF1493" strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d="M 50 68 Q 54 71 58 69" stroke="#FF1493" strokeWidth="1" fill="none" strokeLinecap="round" />
    </svg>
  )
}

/**
 * Robot Avatar SVG Component
 */
export function RobotAvatar({ className = 'w-12 h-12' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      aria-label="Robot avatar"
      role="img"
    >
      {/* Head */}
      <rect x="30" y="25" width="40" height="35" rx="5" fill="#C0C0C0" />
      
      {/* Antenna left */}
      <line x1="38" y1="25" x2="38" y2="10" stroke="#C0C0C0" strokeWidth="2" />
      <circle cx="38" cy="8" r="2" fill="#FF6B6B" />
      
      {/* Antenna right */}
      <line x1="62" y1="25" x2="62" y2="10" stroke="#C0C0C0" strokeWidth="2" />
      <circle cx="62" cy="8" r="2" fill="#FFD93D" />
      
      {/* Left eye */}
      <rect x="35" y="35" width="8" height="10" rx="1" fill="#00FF00" />
      
      {/* Right eye */}
      <rect x="57" y="35" width="8" height="10" rx="1" fill="#00FF00" />
      
      {/* Mouth (speaker grille) */}
      <rect x="38" y="52" width="2" height="6" fill="#333" />
      <rect x="42" y="52" width="2" height="6" fill="#333" />
      <rect x="46" y="52" width="2" height="6" fill="#333" />
      <rect x="50" y="52" width="2" height="6" fill="#333" />
      <rect x="54" y="52" width="2" height="6" fill="#333" />
      <rect x="58" y="52" width="2" height="6" fill="#333" />
      
      {/* Body */}
      <rect x="28" y="65" width="44" height="25" rx="3" fill="#808080" />
      
      {/* Chest panel */}
      <rect x="35" y="72" width="30" height="12" fill="#A9A9A9" />
      <circle cx="42" cy="78" r="2" fill="#FFD93D" />
      <circle cx="50" cy="78" r="2" fill="#FF6B6B" />
      <circle cx="58" cy="78" r="2" fill="#4ECDC4" />
    </svg>
  )
}

/**
 * Avatar Component - Renders the appropriate avatar by type
 */
export function Avatar({
  type,
  className = 'w-12 h-12',
}: {
  type: AvatarType
  className?: string
}) {
  switch (type) {
    case 'bear':
      return <BearAvatar className={className} />
    case 'fox':
      return <FoxAvatar className={className} />
    case 'lion':
      return <LionAvatar className={className} />
    case 'rabbit':
      return <RabbitAvatar className={className} />
    case 'rocket':
      return <RocketAvatar className={className} />
    case 'princess':
      return <PrincessAvatar className={className} />
    case 'wizard':
      return <WizardAvatar className={className} />
    case 'dinosaur':
      return <TRexAvatar className={className} />
    case 'unicorn':
      return <UnicornAvatar className={className} />
    case 'robot':
      return <RobotAvatar className={className} />
    default:
      // Fallback to bear if type is unknown
      return <BearAvatar className={className} />
  }
}

/**
 * Avatar Gallery Component
 * Displays all available avatars for selection
 */
export function AvatarGallery({
  selectedAvatar,
  onSelect,
  columns = 5,
}: {
  selectedAvatar?: AvatarType
  onSelect: (avatar: AvatarType) => void
  columns?: number
}) {
  const avatarTypes: AvatarType[] = ['bear', 'fox', 'lion', 'rabbit', 'rocket', 'princess', 'wizard', 'dinosaur', 'unicorn', 'robot']

  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {avatarTypes.map((type) => {
        const def = AVATAR_DEFINITIONS[type]
        const isSelected = selectedAvatar === type

        return (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className={`
              relative p-3 rounded-lg transition-all transform hover:scale-105
              ${isSelected
                ? 'bg-teal-500 ring-2 ring-teal-600 shadow-lg'
                : 'bg-navy-50 hover:bg-navy-100'
              }
            `}
            aria-label={`Select ${def.label} avatar`}
            aria-pressed={isSelected}
          >
            <Avatar type={type} className="w-10 h-10 mx-auto" />
            <p className="text-xs font-medium text-center mt-2 text-navy-900">
              {def.label}
            </p>
            {isSelected && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg">
                <span className="material-symbols-outlined text-white">check_circle</span>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
