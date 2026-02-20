import React from 'react'

interface AvatarRabbitProps {
  size?: number
  className?: string
}

export const AvatarRabbit: React.FC<AvatarRabbitProps> = ({ size = 48, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Rabbit avatar"
    >
      {/* Head */}
      <circle cx="24" cy="28" r="12" fill="#F4E4C1" />
      
      {/* Left Ear */}
      <ellipse cx="16" cy="8" rx="4" ry="10" fill="#F4E4C1" />
      <ellipse cx="16" cy="8" rx="2" ry="7" fill="#FFB6D9" />
      
      {/* Right Ear */}
      <ellipse cx="32" cy="8" rx="4" ry="10" fill="#F4E4C1" />
      <ellipse cx="32" cy="8" rx="2" ry="7" fill="#FFB6D9" />
      
      {/* Eyes */}
      <circle cx="20" cy="26" r="2" fill="#000000" />
      <circle cx="28" cy="26" r="2" fill="#000000" />
      
      {/* Nose */}
      <circle cx="24" cy="30" r="1.5" fill="#FFB6D9" />
      
      {/* Mouth */}
      <path
        d="M 24 30 Q 22 32 20 31"
        stroke="#000000"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 24 30 Q 26 32 28 31"
        stroke="#000000"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
