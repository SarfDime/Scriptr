'use client'

import { createContext, type ReactNode, useContext, useState } from 'react'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { NextLink } from '@/components/common/NextLink'
import { Text } from '@/components/typography/Text'
import { Dialog } from '@/components/ui/Dialog'
import { useCurrentStudySiteSlug } from '@/hooks/useCurrentStudySiteSlug'
import { getStudySetupUrl } from '@/lib/academic-routes'
import { useLocale } from '@/providers/locale/LocaleProvider'
import { useUIStrings } from '@/providers/locale/use-strings'

// Narrower than the dialog default: `md:min-w-0` cancels its minimum width,
// which is wider than a message needs.
const SETUP_DIALOG_CLASS = 'md:w-[min(28rem,calc(100vw-2rem))] md:min-w-0'

type StudySetupModalContextValue = {
  /** Opens the prompt for a study with no academic profile yet. The study's
   * site handle comes from the caller when it knows one, else from the page. */
  openStudySetupModal: (siteSlug?: string | null) => void
}

const StudySetupModalContext =
  createContext<StudySetupModalContextValue | null>(null)

/**
 * App-wide "set up this study first" prompt. Writing inside a study requires a
 * profile for it — the API refuses with `study_join_required` — so the surfaces
 * that offer such an action open this instead of sending the reader into a form
 * the server will reject.
 */
export function StudySetupModalProvider({ children }: { children: ReactNode }) {
  const ui = useUIStrings()
  const { locale } = useLocale()
  const currentSiteSlug = useCurrentStudySiteSlug()
  const [requestedSiteSlug, setRequestedSiteSlug] = useState<string | null>(
    null
  )
  const [isOpen, setIsOpen] = useState(false)

  const openStudySetupModal = (siteSlug?: string | null) => {
    setRequestedSiteSlug(siteSlug ?? null)
    setIsOpen(true)
  }

  const close = () => setIsOpen(false)

  // Without a handle the catalog's study picker is still a way forward, and it
  // is what `getStudySetupUrl` returns for a missing slug.
  const setupPath = getStudySetupUrl(
    requestedSiteSlug ?? currentSiteSlug,
    locale
  )

  return (
    <StudySetupModalContext.Provider value={{ openStudySetupModal }}>
      {children}
      <Dialog
        title={ui.general.studySetupRequiredTitle}
        hideTrigger
        isOpen={isOpen}
        onClose={close}
        dialogProps={{ className: SETUP_DIALOG_CLASS }}
      >
        <Box className='ui-stack gap-4 p-5'>
          <Text className='ui-body'>{ui.general.studySetupRequiredBody}</Text>
          <Box className='ui-cluster justify-stretch gap-2 ui-groove-t pt-4'>
            <Button onClick={close} className='button subtle grow'>
              {ui.general.studySetupRequiredDismiss}
            </Button>
            <NextLink
              href={setupPath}
              onClick={close}
              className='button solid grow'
            >
              {ui.general.studySetupRequiredAction}
            </NextLink>
          </Box>
        </Box>
      </Dialog>
    </StudySetupModalContext.Provider>
  )
}

export const useStudySetupModal = () => {
  const context = useContext(StudySetupModalContext)
  if (!context) {
    throw new Error(
      'useStudySetupModal must be used within StudySetupModalProvider'
    )
  }
  return context
}
