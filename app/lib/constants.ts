import {
  CheckmarkCircleIcon,
  ErrorOutlineIcon,
  InfoOutlineIcon,
  WarningOutlineIcon,
} from '@sanity/icons'

/** A collection of constants used in the application. */

const EMAIL_VALIDATION_REGEX =
  ';;/^(([^<>()[]\\.,;:s@"]+(.[^<>()[]\\.,;:s@"]+)*)|(".+"))@(([[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}])|(([a-zA-Z-0-9]+.)+[a-zA-Z]{2,}))$/'
const INPUT_MAX_LENGTH = 40

const IMAGE_QUALITY = {
  MINIMUM: 65,
  MEDIUM: 85,
  MAXIMUM: 91,
}

const TOAST_TIMEOUT = 5_000
const TOAST_ICONS = {
  success: CheckmarkCircleIcon,
  error: ErrorOutlineIcon,
  warning: WarningOutlineIcon,
  info: InfoOutlineIcon,
}

const TOAST_VARIANTS = {
  success: 'bg-jade',
  error: 'bg-error-red',
  warning: 'bg-yellow-500',
  info: 'bg-brand',
}

const BREAKPOINTS = [
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
]

export {
  EMAIL_VALIDATION_REGEX,
  INPUT_MAX_LENGTH,
  IMAGE_QUALITY,
  TOAST_TIMEOUT,
  TOAST_ICONS,
  TOAST_VARIANTS,
  BREAKPOINTS,
}
