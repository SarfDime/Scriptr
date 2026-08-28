import { CheckmarkCircleIcon } from '@sanity/icons/CheckmarkCircle'
import { ErrorOutlineIcon } from '@sanity/icons/ErrorOutline'
import { InfoOutlineIcon } from '@sanity/icons/InfoOutline'
import { WarningOutlineIcon } from '@sanity/icons/WarningOutline'
import type { ComponentType } from 'react'
import type { IconProps } from '../types/component.types'
import type { ToastType } from '../types/components/Toast.types'

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
const TOAST_ICONS: Record<ToastType, ComponentType<IconProps>> = {
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
  BREAKPOINTS,
  EMAIL_VALIDATION_REGEX,
  IMAGE_QUALITY,
  INPUT_MAX_LENGTH,
  TOAST_ICONS,
  TOAST_TIMEOUT,
  TOAST_VARIANTS,
}
