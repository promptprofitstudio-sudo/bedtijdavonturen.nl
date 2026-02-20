'use client'

import React from 'react'
import { AvatarType, AVATAR_DEFINITIONS } from '@/lib/avatars'
import { AvatarBear } from './AvatarBear'
import { AvatarFox } from './AvatarFox'
import { AvatarLion } from './AvatarLion'
import { AvatarRabbit } from './AvatarRabbit'
import { AvatarDinosaur } from './AvatarDinosaur'
import { AvatarUnicorn } from './AvatarUnicorn'
import { MaterialSymbolIcon } from './MaterialSymbolIcon'

interface AvatarDisplayProps {
  avatar: AvatarType
  size?: number
  className?: string
}

/**
 * AvatarDisplay Component
 * 
 * Renders the appropriate avatar component based on type
 * Supports both custom SVG and Material Symbol avatars
 */
export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
  avatar,
  size = 48,
  className = '',
}) => {
  const definition = AVATAR_DEFINITIONS[avatar]

  if (!definition) {
    return (
      <div
        className={`w-[${size}px] h-[${size}px] rounded-full bg-gray-200 flex items-center justify-center ${className}`}
        title="Avatar not found"
      >
        <span className="text-xs text-gray-500">?</span>
      </div>
    )
  }

  if (definition.component === 'material-symbol') {
    return (
      <MaterialSymbolIcon
        name={definition.iconName || avatar}
        size={size > 32 ? 'large' : size > 24 ? 'default' : 'small'}
        ariaLabel={definition.label}
        className={className}
      />
    )
  }

  // SVG avatars
  const svgProps = { size, className, key: avatar }

  switch (avatar) {
    case 'bear':
      return <AvatarBear {...svgProps} />
    case 'fox':
      return <AvatarFox {...svgProps} />
    case 'lion':
      return <AvatarLion {...svgProps} />
    case 'rabbit':
      return <AvatarRabbit {...svgProps} />
    case 'dinosaur':
      return <AvatarDinosaur {...svgProps} />
    case 'unicorn':
      return <AvatarUnicorn {...svgProps} />
    default:
      return null
  }
}
