'use client'

import React from 'react'

interface MaterialSymbolIconProps {
  name: string
  size?: 'small' | 'default' | 'large'
  fill?: boolean
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700
  grade?: -25 | 0 | 200
  className?: string
  ariaLabel?: string
  title?: string
}

/**
 * Material Symbols Icon Component
 * 
 * Uses Google's Material Symbols font for consistent icon styling
 * Supports customization of size, weight, and fill
 * 
 * @see https://fonts.google.com/icons
 */
export const MaterialSymbolIcon = React.forwardRef<HTMLSpanElement, MaterialSymbolIconProps>(
  ({
    name,
    size = 'default',
    fill = false,
    weight = 400,
    grade = 0,
    className = '',
    ariaLabel,
    title,
  }, ref) => {
    const sizeClasses = {
      small: '!text-[20px] w-5 h-5',
      default: '!text-[24px] w-6 h-6',
      large: '!text-[32px] w-8 h-8',
    }

    return (
      <span
        ref={ref}
        className={`material-symbols-outlined select-none inline-flex items-center justify-center ${sizeClasses[size]} ${className}`}
        style={{
          fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' 24`,
        }}
        role="img"
        aria-label={ariaLabel}
        title={title}
      >
        {name}
      </span>
    )
  }
)

MaterialSymbolIcon.displayName = 'MaterialSymbolIcon'
