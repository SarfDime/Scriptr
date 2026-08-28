'use client'

import type { DetailedHTMLProps, DialogHTMLAttributes } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useBodyScrollLock } from '@/hooks/useBodyScroll'
import { Z_INDEX } from '@/styles/style'
import type { PortableTextType } from '@/types/components/PortableText.types'
import { cn, getPlacementClasses } from '../../lib/common-utils'
import type { ComponentPlacement } from '../../types/component.types'
import type { BoxProps } from '../common/Box'
import { Box } from '../common/Box'
import type { ButtonProps } from '../common/Button'
import { Button } from '../common/Button'
import type { TitleProps } from '../typography/Title'
import { Title } from '../typography/Title'
import type { CloseButtonProps } from './CloseButton'
import { CloseButton } from './CloseButton'

export type DialogProps = {
  title?: PortableTextType
  children: React.ReactNode
  placement?: ComponentPlacement['placement']
  triggerButtonProps?: ButtonProps
  headerProps?: Omit<BoxProps, 'children'>
  titleProps?: TitleProps
  hideCloseButton?: boolean
  closeButtonProps?: CloseButtonProps
  isOpen?: boolean
  skipCheck?: boolean
  dialogProps?: Omit<
    BoxProps &
      DetailedHTMLProps<
        DialogHTMLAttributes<HTMLDialogElement>,
        HTMLDialogElement
      >,
    'children' | 'onClick'
  >
  hideTrigger?: boolean
  onClose?: () => void
  onOpen?: () => void
  onToggle?: () => void
  setRef?: (ref: HTMLDialogElement) => void
  closeOnOutsideClick?: boolean
  closeOnEsc?: boolean
} & Omit<BoxProps, 'title'> &
  Omit<ComponentPlacement, 'placement'>

/** `Dialog` - A component that renders a modal dialog with customizable positioning and appearance.
 *
 * This component provides an optional trigger button to open the dialog, and allows for customization
 * of its header, content, and close button through various props. It also handles outside clicks to close
 * the dialog.
 *
 * Props:
 * - `title`: The title displayed in the dialog header.
 * - `children`: The content to be displayed inside the dialog.
 * - `placement`: The positioning of the dialog on the screen. Defaults to 'center'.
 * - `offsetX`: Horizontal offset for dialog positioning.
 * - `offsetY`: Vertical offset for dialog positioning.
 * - `showOpenButton`: Boolean to control the rendering of the dialog opener button.
 * - `triggerButtonProps`: Props for the button that triggers the dialog to open.
 * - `rootProps`: Props for the root dialog element for additional customization.
 * - `headerProps`: Props to customize the header section of the dialog.
 * - `closeButtonProps`: Props for the close button in the dialog header.
 * - `titleProps`: Props for customizing the title element within the dialog header.
 *
 * Utilizes `useRef` to manage the dialog element and handle open/close actions.
 */
export function Dialog({
  title,
  children,
  placement = 'center',
  offsetX,
  offsetY,
  triggerButtonProps,
  dialogProps,
  headerProps,
  hideCloseButton = false,
  closeButtonProps,
  titleProps,
  hideTrigger,
  onClose,
  onOpen,
  onToggle,
  setRef,
  isOpen,
  skipCheck,
  closeOnOutsideClick = true,
  closeOnEsc = true,
}: DialogProps) {
  const [showBackdrop, setShowBackdrop] = useState(false)
  const [mounted, setMounted] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useBodyScrollLock({ skipCheck, isLocked: dialogRef?.current?.open ?? false })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (setRef && dialogRef?.current) {
      setRef(dialogRef?.current)
    }
  }, [setRef])

  const handleOpen = () => {
    dialogRef?.current?.showModal()
    setShowBackdrop(true)
    onOpen?.()
  }

  const handleClose = () => {
    dialogRef?.current?.close()
    onClose?.()
  }

  const handleToggle = () => {
    setShowBackdrop(dialogRef?.current?.open ?? false)
    onToggle?.()
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <No need for those>
  useEffect(() => {
    if (setRef || !hideTrigger) return
    if (isOpen) {
      handleOpen()
    } else {
      handleClose()
    }
  }, [isOpen, setRef])

  const handleClickOutside = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (!closeOnOutsideClick) return
    if (e.target === dialogRef?.current) handleClose()
  }

  const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement>) => {
    // The dialog 'cancel' event is fired for Escape key; prevent it if closeOnEsc is false
    if (!closeOnEsc) {
      // prevent the dialog from closing
      e.preventDefault()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDialogElement>) => {
    if (!closeOnEsc && e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  return (
    <>
      {/* Dialog Opener Button (if not hidden) */}
      {!hideTrigger && (
        <Button onClick={handleOpen} {...triggerButtonProps}>
          {triggerButtonProps?.children || 'Open Dialog'}
        </Button>
      )}

      {mounted && showBackdrop && (
        <div
          className={cn(
            'pointer-events-none fixed inset-0 bg-background-1000/50 backdrop-blur-xs starting:backdrop-blur-[0] transition-[backdrop-filter] duration-350',
            Z_INDEX.DIALOG_BACKDROP
          )}
        />
      )}

      {/* Dialog */}
      {/* TODO: Add onKeyDown improvements for accessibility */}
      <dialog
        ref={dialogRef}
        // make the dialog focusable so we can programmatically focus it and
        // prevent the browser from auto-focusing the first focusable child
        tabIndex={-1}
        aria-labelledby='dialog-title'
        {...dialogProps}
        onClick={handleClickOutside}
        onClose={handleClose}
        onToggle={handleToggle}
        onCancel={handleCancel}
        onKeyDown={handleKeyDown}
        className={cn(
          'dialog',
          'fixed top-[10%] w-full md:w-fit md:min-w-2xl',
          'overflow-y-hidden',
          getPlacementClasses({ placement, offsetX, offsetY }),
          dialogProps?.className
        )}
      >
        {/* Header */}
        <Box {...headerProps}>
          <Title id='dialog-title' as='h2' {...titleProps}>
            {title}
          </Title>
          {!hideCloseButton && (
            <CloseButton
              onClick={handleClose}
              aria-label='Close dialog'
              {...closeButtonProps}
              className={cn(
                'text-gray-500 hover:bg-brand-100 hover:text-gray-800',
                closeButtonProps?.className
              )}
            />
          )}
        </Box>
        {/* Content */}
        {children}
      </dialog>
    </>
  )
}
