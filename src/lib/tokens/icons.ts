/**
 * Icon System Design Tokens
 * Unified Material Symbols configuration and sizing standards
 * 
 * This is the single source of truth for icon styling across the application.
 */

export const iconTokens = {
  // Icon Sizes (24px Material Symbols grid)
  size: {
    xs: '16px',    // Small, inline text
    sm: '20px',    // Small-medium, form labels
    md: '24px',    // Default, buttons & nav
    lg: '32px',    // Large, audio controls
    xl: '48px',    // Extra large, toddler mode
  },

  // Spacing around icons (gap to adjacent content)
  spacing: {
    compact: '4px',     // Icon only, no gap
    tight: '8px',       // Icon + button
    normal: '12px',     // Icon + label
    relaxed: '16px',    // Icon in grid
    spacious: '24px',   // Icon standalone
  },

  // Color palette (inherit from brand)
  color: {
    primary: 'currentColor',        // Default: inherit text color
    navy: '#102A43',                // Primary text
    teal: '#199473',                // Action/teal
    gray: '#748899',                // Neutral
    danger: '#E63946',              // Error
    warning: '#F59E0B',             // Warning
    success: '#10B981',             // Success
    white: '#FFFFFF',               // On dark backgrounds
  },

  // Material Symbols icon collection
  // Organized by category for easy reference
  symbols: {
    // Playback Controls
    playback: {
      play: 'play_arrow',
      pause: 'pause',
      skip_back: 'replay_10',      // Changed from skip_previous for better UX
      skip_forward: 'forward_10',   // Changed from skip_next for better UX
      stop: 'stop',
      volume_off: 'volume_off',
      volume_on: 'volume_up',
      replay: 'restart_alt',
    },

    // Navigation
    navigation: {
      home: 'home',
      explore: 'explore',
      library: 'library_books',
      settings: 'settings',
      back: 'arrow_back',
      forward: 'arrow_forward',
      menu: 'menu',
      close: 'close',
    },

    // Status & Feedback
    status: {
      success: 'check_circle',
      error: 'cancel',
      warning: 'warning',
      info: 'info',
      pending: 'pending',
      verified: 'verified',
    },

    // Actions
    actions: {
      share: 'share',
      link: 'link',
      download: 'download',
      upload: 'upload',
      delete: 'delete',
      edit: 'edit',
      add: 'add',
      bookmark: 'bookmark',
      favorite: 'favorite',
      more_vert: 'more_vert',
      more_horiz: 'more_horiz',
      search: 'search',
    },

    // Media
    media: {
      music: 'music_note',
      microphone: 'mic',
      microphone_off: 'mic_off',
      video: 'videocam',
      photo: 'image',
      camera: 'camera_alt',
      gallery: 'collections',
    },

    // Trust & Security Signals
    trust: {
      family: 'family_restroom',
      stories: 'auto_stories',
      lock: 'lock',
      shield: 'shield',
      verified_user: 'verified_user',
      security: 'security',
      child_care: 'child_care',
      credit_card: 'credit_card',
    },

    // Other common icons
    common: {
      send: 'send',
      refresh: 'refresh',
      loading: 'hourglass_bottom',
      notifications: 'notifications',
      calendar: 'calendar_today',
      clock: 'schedule',
      person: 'person',
      group: 'group',
    },
  },

  // CSS class patterns for Material Symbols
  cssClass: {
    outlined: 'material-symbols-outlined',
    filled: 'material-symbols-filled',
    rounded: 'material-symbols-rounded',
  },

  // State modifiers
  state: {
    hover: 'opacity-80 hover:opacity-100',
    active: 'opacity-100',
    disabled: 'opacity-50 cursor-not-allowed',
    loading: 'animate-spin',
    focus: 'outline-none ring-2 ring-offset-2 ring-teal-500',
  },
} as const

/**
 * Utility function to get icon size class
 */
export function getIconSizeClass(size: keyof typeof iconTokens.size): string {
  return `icon-${size}`
}

/**
 * Utility function to get Material Symbol with proper spacing
 */
export function getMaterialSymbol(iconName: string, size: keyof typeof iconTokens.size = 'md'): { icon: string; className: string } {
  return {
    icon: iconName,
    className: `material-symbols-outlined text-[${iconTokens.size[size]}]`,
  }
}

/**
 * Type-safe Material Symbols reference
 */
export type MaterialSymbolName = 
  | 'play_arrow' | 'pause' | 'replay_10' | 'forward_10' | 'stop' | 'volume_off' | 'volume_up' | 'restart_alt'
  | 'home' | 'explore' | 'library_books' | 'settings' | 'arrow_back' | 'arrow_forward' | 'menu' | 'close'
  | 'check_circle' | 'cancel' | 'warning' | 'info' | 'pending' | 'verified'
  | 'share' | 'link' | 'download' | 'upload' | 'delete' | 'edit' | 'add' | 'bookmark' | 'favorite' | 'more_vert' | 'more_horiz' | 'search'
  | 'music_note' | 'mic' | 'mic_off' | 'videocam' | 'image' | 'camera_alt' | 'collections'
  | 'family_restroom' | 'auto_stories' | 'lock' | 'shield' | 'verified_user' | 'security' | 'child_care' | 'credit_card'
  | 'send' | 'refresh' | 'hourglass_bottom' | 'notifications' | 'calendar_today' | 'schedule' | 'person' | 'group'

/**
 * Icon component props interface
 */
export interface IconProps {
  name: MaterialSymbolName
  size?: keyof typeof iconTokens.size
  color?: string
  className?: string
  ariaLabel?: string
}

/**
 * Get Material Symbols CSS variable for dynamic sizing
 */
export function getIconStyle(size: keyof typeof iconTokens.size = 'md') {
  return {
    fontSize: iconTokens.size[size],
  }
}
