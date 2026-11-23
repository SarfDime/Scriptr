'use client'

import type { PortableTextValue } from '@shared/types/portable-text.types'
import type { DetailedHTMLProps, DialogHTMLAttributes, ReactNode } from 'react'
import { useEffect, useEffectEvent, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useBodyScrollLock } from '@/hooks/useBodyScroll'
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect'
import { useMounted } from '@/hooks/useMounted'
import { cn, getPlacementClasses } from '@/lib/common-utils'
import { useLoading } from '@/providers/loading/LoadingProvider'
import { useUIStrings } from '@/providers/locale/use-strings'
import type { ComponentPlacement } from '../../types/component.types'
import { Box, type BoxProps } from '../common/Box'
import { Button, type ButtonProps } from '../common/Button'
import type { TitleProps } from '../typography/Title'
import { Title } from '../typography/Title'
import type { CloseButtonProps } from './CloseButton'
import { CloseButton } from './CloseButton'

/**
 * Default look of a centered dialog. Below `md` it fills the screen: square,
 * borderless, scrolling inside. From `md` up it is a framed, translucent card with
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
  'flex items-center justify-between gap-3 border-b border-[var(--divider-cut)] px-3.5 py-2.5 ui-groove-b'

export type DialogProps = {
  title?: PortableTextValue | ReactNode
  children: ReactNode
  placement?: ComponentPlacement['placement']
  triggerButtonProps?: ButtonProps
  headerProps?: Omit<BoxProps, 'children'>
  titleProps?: TitleProps
  hideCloseButton?: boolean
  /** Extra controls rendered in the header, just before the close button. */
  headerActions?: ReactNode
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
    'as' | 'children' | 'onClick'
  >
  hideTrigger?: boolean
  onClose?: () => void
  onOpen?: () => void
  onToggle?: () => void
  setRef?: (ref: HTMLDialogElement) => void
  closeOnOutsideClick?: boolean
  closeOnEsc?: boolean
} & Omit<BoxProps, 'as' | 'title' | 'className'> &
  Omit<ComponentPlacement, 'placement'>

/**
 * Modal dialog. Nothing is rendered while it is closed — neither the `<dialog>`
 * nor its children — so a page full of closed dialogs costs no markup and no
 * form state. `isOpen` (with `hideTrigger`) drives it from the caller's state,
 * otherwise the built-in trigger opens it.
 *
 * Opening mounts the element and then calls `showModal()`, which keeps it in
 * the top layer with the browser's focus trap. Closing goes through `close()`,
 * so focus returns to whatever was focused when it opened. The veil behind it is
 * the dialog's own `::backdrop`, and opening waits while the global loading
 * overlay is up — the overlay is a modal too, so stacking the two would show a
 * dialog on top of a screen that says the page is not ready.
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
  headerActions,
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
  const ui = useUIStrings()
  const titleId = useId()
  const isCentered = placement === 'center'
  const mounted = useMounted()
  // Gates the `<dialog>`, its backdrop and its children. It outlives the close
  // request by the turn `close()` takes to fire the `close` event, so the
  // dialog can hand focus back and report `onClose` while still in the DOM.
  const [isRendered, setIsRendered] = useState(false)
  // Set while this dialog waits for the loading overlay to leave (see
  // `requestOpen`); it opens once the overlay is gone.
  const [isWaitingForLoader, setIsWaitingForLoader] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  // `hideTrigger` + `isOpen` means the caller owns the open state; a `setRef`
  // caller drives the element itself.
  const isControlled = Boolean(hideTrigger) && !setRef

  useBodyScrollLock({ skipCheck, isLocked: isRendered })

  const { isOverlayVisible } = useLoading()

  const requestOpen = () => {
    if (isRendered) return
    // The loader owns the screen while it is up: both are top-layer modals, so
    // whichever opens last paints over the other, and an action that just
    // failed under the loader would surface on top of it. Wait it out.
    if (isOverlayVisible) {
      setIsWaitingForLoader(true)
      return
    }
    setIsWaitingForLoader(false)
    triggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    setIsRendered(true)
    onOpen?.()
  }

  const requestClose = () => {
    if (!dialogRef.current?.open) return
    dialogRef.current.close()
  }

  const syncControlledState = useEffectEvent(() => {
    if (!isControlled) return
    if (isOpen) {
      requestOpen()
      return
    }
    // A caller that closes it while it waits cancels the wait too.
    setIsWaitingForLoader(false)
    requestClose()
  })

  const openWhenLoaderLeaves = useEffectEvent(() => {
    if (!isWaitingForLoader || isOverlayVisible) return
    requestOpen()
  })

  // biome-ignore lint/correctness/useExhaustiveDependencies: both values are rerun triggers — the wait clears when the overlay leaves — while the event already reads them.
  useEffect(() => {
    // biome-ignore lint/nursery/useReactCompiler: the loading overlay is the external system here.
    openWhenLoaderLeaves()
  }, [isWaitingForLoader, isOverlayVisible])

  // biome-ignore lint/correctness/useExhaustiveDependencies: `isRendered` is a rerun trigger, so a caller that flips `isOpen` back on while the close event is still in flight reopens the dialog.
  useEffect(() => {
    // biome-ignore lint/nursery/useReactCompiler: the `<dialog>` element is the external system here; the effect mirrors `isOpen` onto it.
    syncControlledState()
  }, [isControlled, isOpen, isRendered])

  // The element only exists once `isRendered` is true, so opening happens after
  // the commit that renders it. The layout effect puts it in the top layer
  // before the frame the backdrop first appears in is painted.
  const showModalOnMount = useEffectEvent(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    setRef?.(dialog)
    if (!dialog.open) dialog.showModal()
  })

  useIsomorphicLayoutEffect(() => {
    if (!isRendered || !mounted) return
    showModalOnMount()
  }, [isRendered, mounted])

  const handleToggle = (e: React.SyntheticEvent<HTMLDialogElement>) => {
    if (e.target !== e.currentTarget) return
    onToggle?.()
  }

  // React re-dispatches `close`, `cancel` and `toggle` up the React tree, which
  // includes any dialog rendered inside this one's children (even though it is
  // portaled elsewhere in the DOM). Ignore events that belong to a nested
  // dialog, or closing it would also close this one.
  const handleNativeClose = (e: React.SyntheticEvent<HTMLDialogElement>) => {
    if (e.target !== e.currentTarget) return
    setIsRendered(false)
    onClose?.()
    triggerRef.current?.focus()
    triggerRef.current = null
  }

  useEffect(() => {
    if (!isRendered) return
    dialogRef.current?.focus()
  }, [isRendered])

  const handleClickOutside = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (!closeOnOutsideClick) return
    if (e.target === dialogRef?.current) requestClose()
  }

  const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement>) => {
    if (e.target !== e.currentTarget) return
    // The dialog 'cancel' event is fired for Escape key; prevent it if closeOnEsc is false
    if (!closeOnEsc) {
      // prevent the dialog from closing
      e.preventDefault()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDialogElement>) => {
    // Key events from a nested dialog bubble through the React tree too; its
    // Esc/Tab handling is its own, not this dialog's.
    if (!dialogRef.current?.contains(e.target as Node)) return

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

  const closeButton = hideCloseButton ? null : (
    <CloseButton
      onClick={requestClose}
      aria-label={ui.general.closeDialog}
      {...closeButtonProps}
      className={cn('button ghost p-1', closeButtonProps?.className)}
    />
  )

  return (
    <>
      {/* Dialog Opener Button (if not hidden) */}
      {!hideTrigger && (
        <Button onClick={requestOpen} {...triggerButtonProps}>
          {triggerButtonProps?.children || ui.general.openDialog}
        </Button>
      )}

      {mounted &&
        isRendered &&
        createPortal(
          <>
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
                // The veil is the dialog's own `::backdrop`, so it shares the
                // top layer with the dialog: a separate element is painted
                // under any dialog that opened earlier.
                !hideBackdrop &&
                  'backdrop:bg-background-150/80 backdrop:backdrop-blur-xs backdrop:starting:opacity-70 backdrop:transition-opacity backdrop:duration-300',
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
                {headerActions ? (
                  <Box className='flex shrink-0 items-center gap-1'>
                    {headerActions}
                    {closeButton}
                  </Box>
                ) : (
                  closeButton
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
