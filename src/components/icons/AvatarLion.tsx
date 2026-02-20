import React from 'react'

interface AvatarLionProps {
  size?: number
  className?: string
}

export const AvatarLion: React.FC<AvatarLionProps> = ({ size = 48, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Lion avatar"
    >
      {/* Mane */}
      <circle cx="24" cy="24" r="18" fill="#E8A74F" />
      
      {/* Head */}
      <circle cx="24" cy="26" r="12" fill="#D4A156" />
      
      {/* Eyes */}
      <circle cx="20" cy="23" r="2" fill="#000000" />
      <circle cx="28" cy="23" r="2" fill="#000000" />
      
      {/* Nose */}
      <ellipse cx="24" cy="28" rx="1.5" ry="2" fill="#8B6914" />
      
      {/* Mouth */}
      <path
        d="M 24 30 Q 20 33 16 31"
        stroke="#000000"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 24 30 Q 28 33 32 31"
        stroke="#000000"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
