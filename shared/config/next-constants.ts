import { CheckmarkCircleIcon } from '@sanity/icons/CheckmarkCircle'
import { ErrorOutlineIcon } from '@sanity/icons/ErrorOutline'
import { InfoOutlineIcon } from '@sanity/icons/InfoOutline'
import { WarningOutlineIcon } from '@sanity/icons/WarningOutline'

export const DEBOUNCE_TIME = 500
export const INPUT_DEBOUNCE_TIME = 1_350
export const INPUT_MAX_LENGTH = 40
export const BOT_ACTIVITY_THRESHOLD = 0.5
export const IMAGE_QUALITY = {
  MINIMUM: 65,
  MEDIUM: 85,
  MAXIMUM: 91,
} as const
export const IMAGE_COMPRESSION = 9
export const RESIZE_IMAGE_THRESHOLD = 1600
export const RESIZE_IMAGE_SIZES = {
  min: { width: 960, height: 720 },
  max: { width: 1680, height: 1080 },
} as const
export const TOAST_TIMEOUT = 5_000
export const TOAST_ICONS = {
  success: CheckmarkCircleIcon,
  error: ErrorOutlineIcon,
  warning: WarningOutlineIcon,
  info: InfoOutlineIcon,
} as const
export const TOAST_VARIANTS = {
  success: 'bg-jade',
  error: 'bg-error-red',
  warning: 'bg-yellow-500',
  info: 'bg-brand',
} as const
export const BREAKPOINTS = [
  'base',
  'sm',
  'smd',
  'md',
  'xmd',
  'lg',
  'xlg',
  'xl',
  'xml',
  'xxl',
] as const
