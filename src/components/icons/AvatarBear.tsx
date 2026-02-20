import React from 'react'

interface AvatarBearProps {
  size?: number
  className?: string
}

export const AvatarBear: React.FC<AvatarBearProps> = ({ size = 48, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Bear avatar"
    >
      {/* Head */}
      <circle cx="24" cy="26" r="16" fill="#8B6F47" />
      
      {/* Ears */}
      <circle cx="12" cy="12" r="6" fill="#8B6F47" />
      <circle cx="36" cy="12" r="6" fill="#8B6F47" />
      
      {/* Inner ears */}
      <circle cx="12" cy="12" r="3" fill="#6B5637" />
      <circle cx="36" cy="12" r="3" fill="#6B5637" />
      
      {/* Snout */}
      <ellipse cx="24" cy="28" rx="8" ry="7" fill="#A0826D" />
      
      {/* Eyes */}
      <circle cx="18" cy="22" r="2.5" fill="#000000" />
      <circle cx="30" cy="22" r="2.5" fill="#000000" />
      
      {/* Nose */}
      <circle cx="24" cy="28" r="1.5" fill="#000000" />
      
      {/* Mouth */}
      <path
        d="M 24 28 Q 21 31 18 30"
        stroke="#000000"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 24 28 Q 27 31 30 30"
        stroke="#000000"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
