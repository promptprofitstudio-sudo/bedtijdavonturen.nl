import React from 'react'

interface AvatarDinosaurProps {
  size?: number
  className?: string
}

export const AvatarDinosaur: React.FC<AvatarDinosaurProps> = ({ size = 48, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Dinosaur avatar"
    >
      {/* Body */}
      <ellipse cx="24" cy="28" rx="14" ry="10" fill="#6BA547" />
      
      {/* Head */}
      <ellipse cx="32" cy="24" rx="8" ry="10" fill="#6BA547" />
      
      {/* Horn */}
      <polygon points="32,12 35,8 31,12" fill="#8B7355" />
      
      {/* Eye */}
      <circle cx="35" cy="22" r="2" fill="#000000" />
      
      {/* Nostril */}
      <circle cx="38" cy="24" r="1" fill="#2D5228" />
      
      {/* Back spikes */}
      <polygon points="20,18 19,12 21,18" fill="#8FB651" />
      <polygon points="24,18 23,12 25,18" fill="#8FB651" />
      <polygon points="28,18 27,12 29,18" fill="#8FB651" />
    </svg>
  )
}
