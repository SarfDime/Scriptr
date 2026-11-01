'use client'

import type { PortableTextValue } from '@shared/types/portable-text.types'
import type { DetailedHTMLProps, DialogHTMLAttributes, ReactNode } from 'react'
import { useEffect, useEffectEvent, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useBodyScrollLock } from '@/hooks/useBodyScroll'
import { cn, getPlacementClasses } from '@/lib/common-utils'
import { Z_INDEX } from '../../styles/style'
import type { ComponentPlacement } from '../../types/component.types'
import { Box, type BoxProps } from '../common/Box'
import { Button, type ButtonProps } from '../common/Button'
import type { TitleProps } from '../typography/Title'
import { Title } from '../typography/Title'
import type { CloseButtonProps } from './CloseButton'
import { CloseButton } from './CloseButton'

/**
 * Default look of a centered dialog. Below `md` it fills the screen: square,
 * borderless, scrolling inside. From `md` up it is a framed, frosted card with
 * a width of its own content. The padding sits on the header and on the
 * content, not on the dialog, so the header bar runs edge to edge. Override any
 * of it through `dialogProps.className` (later classes win).
 */
const CENTERED_DIALOG_CLASS = cn(
  'dialog fixed top-0 m-0 w-full max-w-full overflow-y-auto p-0 text-fg ui-above gap-0',
  'max-md:h-dvh max-md:max-h-dvh max-md:rounded-none max-md:border-0',
  'md:top-[10%] md:max-h-[85dvh] md:w-fit md:min-w-2xl md:max-w-[calc(100vw-2rem)] md:shadow-lg'
)
const CENTERED_HEADER_CLASS =
  'flex items-center justify-between gap-3 border-b border-grey-400 px-3.5 py-2.5 shadow-above-inside'

export type DialogProps = {
  title?: PortableTextValue | ReactNode
  children: ReactNode
  placement?: ComponentPlacement['placement']
  triggerButtonProps?: ButtonProps
  headerProps?: Omit<BoxProps, 'children'>
  titleProps?: TitleProps
  hideCloseButton?: boolean
  closeButtonProps?: CloseButtonProps
  isOpen?: boolean
  skipCheck?: boolean
  hideBackdrop?: boolean
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
} & Omit<BoxProps, 'title' | 'className'> &
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
  hideBackdrop,
  onClose,
  onOpen,
  onToggle,
  setRef,
  isOpen,
  skipCheck,
  closeOnOutsideClick = true,
  closeOnEsc = true,
}: DialogProps) {
  const titleId = useId()
  const isCentered = placement === 'center'
  const [showBackdrop, setShowBackdrop] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [internalDialogOpen, setInternalDialogOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  useBodyScrollLock({ skipCheck, isLocked: internalDialogOpen ?? false })

  const setMountedEffect = useEffectEvent((isMounted: boolean) => {
    setMounted(isMounted)
  })

  const setRefEffect = useEffectEvent((ref: HTMLDialogElement) => {
    setRef?.(ref)
  })

  useEffect(() => {
    setMountedEffect(true)
  }, [])

  useEffect(() => {
    if (setRef && dialogRef?.current) {
      setRefEffect(dialogRef?.current)
    }
  }, [setRef])

  const handleOpen = () => {
    if (dialogRef.current?.open) return
    triggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    dialogRef.current?.showModal()
    setShowBackdrop(true)
    setInternalDialogOpen(true)
    onOpen?.()
  }

  const handleClose = () => {
    if (!dialogRef.current?.open) return
    dialogRef.current.close()
  }

  const handleToggle = () => {
    const open = dialogRef.current?.open ?? false
    setShowBackdrop(open)
    setInternalDialogOpen(open)
    onToggle?.()
  }

  const handleNativeClose = () => {
    setShowBackdrop(false)
    setInternalDialogOpen(false)
    onClose?.()
    triggerRef.current?.focus()
    triggerRef.current = null
  }

  useEffect(() => {
    if (!internalDialogOpen) return
    dialogRef.current?.focus()
  }, [internalDialogOpen])

  const syncControlledState = useEffectEvent(() => {
    if (setRef || !hideTrigger || !dialogRef.current) return
    if (isOpen) {
      handleOpen()
    } else if (dialogRef.current.open) {
      handleClose()
    }
  })

  // biome-ignore lint/correctness/useExhaustiveDependencies: Controlled state is synchronized when inputs or the portal mount change.
  useEffect(() => {
    syncControlledState()
  }, [hideTrigger, isOpen, mounted, setRef])

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

    if (e.key !== 'Tab' || !dialogRef.current) return

    const focusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      )
    )
    if (focusable.length === 0) {
      e.preventDefault()
      dialogRef.current.focus()
      return
    }

    const first = focusable[0] as HTMLElement
    const last = focusable[focusable.length - 1] as HTMLElement
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
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

      {mounted &&
        createPortal(
          <>
            {!hideBackdrop && showBackdrop && (
              <div
                className={cn(
                  'pointer-events-none fixed inset-0 bg-background-250/50 backdrop-blur-xs starting:backdrop-blur-[0] transition-[backdrop-filter] duration-350',
                  Z_INDEX.DIALOG_BACKDROP
                )}
              />
            )}

            {/* Dialog */}
            <dialog
              ref={dialogRef}
              // make the dialog focusable so we can programmatically focus it and
              // prevent the browser from auto-focusing the first focusable child
              tabIndex={-1}
              {...dialogProps}
              aria-labelledby={titleId}
              onClick={handleClickOutside}
              onClose={handleNativeClose}
              onToggle={handleToggle}
              onCancel={handleCancel}
              onKeyDown={handleKeyDown}
              className={cn(
                isCentered
                  ? CENTERED_DIALOG_CLASS
                  : 'dialog fixed top-[10%] w-full md:w-fit md:min-w-2xl',
                getPlacementClasses({ placement, offsetX, offsetY }),
                dialogProps?.className
              )}
            >
              {/* Header */}
              <Box
                {...headerProps}
                className={cn(
                  isCentered && CENTERED_HEADER_CLASS,
                  headerProps?.className
                )}
              >
                <Title
                  {...titleProps}
                  className={cn(
                    isCentered && 'ui-title min-w-0',
                    titleProps?.className
                  )}
                  id={titleId}
                  as='h2'
                >
                  {title}
                </Title>
                {!hideCloseButton && (
                  <CloseButton
                    onClick={handleClose}
                    aria-label='Close dialog'
                    {...closeButtonProps}
                    className={cn(
                      'button ghost p-1',
                      closeButtonProps?.className
                    )}
                  />
                )}
              </Box>
              {/* Content */}
              {children}
            </dialog>
          </>,
          document.body
        )}
    </>
  )
}
