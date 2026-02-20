/**
 * Avatar Definitions
 * 
 * This file defines all available avatars for user profiles
 * Supports both custom SVG components and Material Symbols icons
 */

export type AvatarType = 'bear' | 'fox' | 'lion' | 'rabbit' | 'rocket' | 'princess' | 'wizard' | 'dinosaur' | 'unicorn' | 'robot'

export interface AvatarDefinition {
  id: AvatarType
  label: string
  description?: string
  category: 'animal' | 'character' | 'object'
  component: 'svg' | 'material-symbol'
  iconName?: string // For Material Symbols
}

export const AVATAR_DEFINITIONS: Record<AvatarType, AvatarDefinition> = {
  bear: {
    id: 'bear',
    label: 'Bear',
    description: 'A friendly brown bear',
    category: 'animal',
    component: 'svg',
  },
  fox: {
    id: 'fox',
    label: 'Fox',
    description: 'A clever orange fox',
    category: 'animal',
    component: 'svg',
  },
  lion: {
    id: 'lion',
    label: 'Lion',
    description: 'A brave lion with a mane',
    category: 'animal',
    component: 'svg',
  },
  rabbit: {
    id: 'rabbit',
    label: 'Rabbit',
    description: 'A cute rabbit with long ears',
    category: 'animal',
    component: 'svg',
  },
  dinosaur: {
    id: 'dinosaur',
    label: 'Dinosaur',
    description: 'A green dinosaur explorer',
    category: 'animal',
    component: 'svg',
  },
  unicorn: {
    id: 'unicorn',
    label: 'Unicorn',
    description: 'A magical pink unicorn',
    category: 'character',
    component: 'svg',
  },
  rocket: {
    id: 'rocket',
    label: 'Rocket',
    description: 'An adventure rocket',
    category: 'object',
    component: 'material-symbol',
    iconName: 'rocket_launch',
  },
  princess: {
    id: 'princess',
    label: 'Princess',
    description: 'A royal princess character',
    category: 'character',
    component: 'material-symbol',
    iconName: 'crown',
  },
  wizard: {
    id: 'wizard',
    label: 'Wizard',
    description: 'A magical wizard',
    category: 'character',
    component: 'material-symbol',
    iconName: 'wand_sparkles',
  },
  robot: {
    id: 'robot',
    label: 'Robot',
    description: 'A friendly robot',
    category: 'object',
    component: 'material-symbol',
    iconName: 'smart_toy',
  },
}

/**
 * Get all available avatars in order
 */
export const getAllAvatars = (): AvatarType[] => {
  return Object.keys(AVATAR_DEFINITIONS) as AvatarType[]
}

/**
 * Get avatars grouped by category
 */
export const getAvatarsByCategory = (category: 'animal' | 'character' | 'object'): AvatarType[] => {
  return getAllAvatars().filter(id => AVATAR_DEFINITIONS[id].category === category)
}
