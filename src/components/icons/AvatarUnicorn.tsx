import React from 'react'

interface AvatarUnicornProps {
  size?: number
  className?: string
}

export const AvatarUnicorn: React.FC<AvatarUnicornProps> = ({ size = 48, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Unicorn avatar"
    >
      {/* Head */}
      <circle cx="24" cy="28" r="12" fill="#E8B4D9" />
      
      {/* Horn */}
      <polygon points="24,8 22,16 26,16" fill="#FFD700" />
      
      {/* Mane */}
      <path
        d="M 16 20 Q 15 16 16 12 Q 20 10 24 10 Q 28 10 32 12 Q 33 16 32 20"
        fill="#FF69B4"
      />
      
      {/* Eyes */}
      <circle cx="20" cy="26" r="2" fill="#000000" />
      <circle cx="28" cy="26" r="2" fill="#000000" />
      
      {/* Star on forehead */}
      <path
        d="M 24 14 L 25 17 L 28 17 L 25.5 19 L 26.5 22 L 24 20 L 21.5 22 L 22.5 19 L 20 17 L 23 17 Z"
        fill="#FFD700"
      />
      
      {/* Nose */}
      <circle cx="24" cy="30" r="1.5" fill="#FF69B4" />
    </svg>
  )
}
