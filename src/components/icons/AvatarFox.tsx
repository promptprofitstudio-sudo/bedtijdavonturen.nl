import React from 'react'

interface AvatarFoxProps {
  size?: number
  className?: string
}

export const AvatarFox: React.FC<AvatarFoxProps> = ({ size = 48, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Fox avatar"
    >
      {/* Head */}
      <circle cx="24" cy="26" r="14" fill="#FF6B35" />
      
      {/* Left Ear */}
      <path d="M 8 12 Q 6 8 4 6 L 8 14 Z" fill="#FF6B35" />
      <path d="M 8 12 Q 6.5 10 6 8 L 8 13 Z" fill="#FFE8D6" />
      
      {/* Right Ear */}
      <path d="M 40 12 Q 42 8 44 6 L 40 14 Z" fill="#FF6B35" />
      <path d="M 40 12 Q 41.5 10 42 8 L 40 13 Z" fill="#FFE8D6" />
      
      {/* Snout */}
      <ellipse cx="24" cy="28" rx="7" ry="6" fill="#FFE8D6" />
      
      {/* Eyes */}
      <circle cx="19" cy="22" r="2" fill="#000000" />
      <circle cx="29" cy="22" r="2" fill="#000000" />
      
      {/* Nose */}
      <circle cx="24" cy="28" r="1.5" fill="#000000" />
      
      {/* Mouth */}
      <path
        d="M 24 29 Q 22 31 20 30"
        stroke="#000000"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 24 29 Q 26 31 28 30"
        stroke="#000000"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
