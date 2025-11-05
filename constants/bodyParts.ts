import { CustomBodyPart } from '@/types';

/**
 * Body Part Configuration
 * Centralized configuration for all body parts used in training
 */

export interface BodyPartColors {
  bg: string;
  bgActive: string;
  border: string;
  hex: string;
}

export interface BodyPartConfig {
  label: string;
  icon: string;
  color: BodyPartColors;
}

export const BODY_PART_CONFIG: Record<CustomBodyPart, BodyPartConfig> = {
  'left-hand': {
    label: '왼손',
    icon: '✋',
    color: {
      bg: 'bg-blue-500',
      bgActive: 'bg-blue-300',
      border: 'border-blue-600',
      hex: '#3B82F6',
    },
  },
  'right-hand': {
    label: '오른손',
    icon: '🤚',
    color: {
      bg: 'bg-red-500',
      bgActive: 'bg-red-300',
      border: 'border-red-600',
      hex: '#EF4444',
    },
  },
  'left-foot': {
    label: '왼발',
    icon: '🦶',
    color: {
      bg: 'bg-green-500',
      bgActive: 'bg-green-300',
      border: 'border-green-600',
      hex: '#22C55E',
    },
  },
  'right-foot': {
    label: '오른발',
    icon: '🦶',
    color: {
      bg: 'bg-yellow-500',
      bgActive: 'bg-yellow-300',
      border: 'border-yellow-600',
      hex: '#EAB308',
    },
  },
};

/**
 * Get body part label in Korean
 */
export function getBodyPartLabel(part: CustomBodyPart): string {
  return BODY_PART_CONFIG[part].label;
}

/**
 * Get body part Tailwind color class
 */
export function getBodyPartColor(part: CustomBodyPart): string {
  return BODY_PART_CONFIG[part].color.bg;
}

/**
 * Get body part icon emoji
 */
export function getBodyPartIcon(part: CustomBodyPart): string {
  return BODY_PART_CONFIG[part].icon;
}

/**
 * Get full body part configuration
 */
export function getBodyPartConfig(part: CustomBodyPart): BodyPartConfig {
  return BODY_PART_CONFIG[part];
}
