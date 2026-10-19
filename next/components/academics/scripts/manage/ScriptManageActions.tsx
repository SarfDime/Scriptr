'use client'

import { SCRIPT_STRINGS } from '@shared/strings/scripts-strings'
import { useRouter } from 'next/navigation'
import { Box } from '@/components/common/Box'
import { Button } from '@/components/common/Button'
import { ConfirmAction } from '@/components/ui/ConfirmAction'
import { deleteScript } from '@/lib/api/scripts-api'
import { useToast } from '@/providers/toaster/ToasterProvider'
import type { ScriptManageActionsProps } from '@/types/components/ScriptManage.types'
import { EditScriptModal } from './EditScriptModal'

/** Edit and delete for the script's author or an admin. Only rendered when
 * the page's `canManage` is true. Delete is never restriction-checked, so it
 * deliberately doesn't use `useProtectedAction`. */
export function ScriptManageActions({
  scriptId,
  subjectId,
  script,
  subjectHref,
}: ScriptManageActionsProps) {
  const router = useRouter()
  const { addToast } = useToast()

  const remove = async () => {
    try {
      await deleteScript(scriptId)
      addToast({ type: 'success', title: SCRIPT_STRINGS.manage.deleted })
      router.replace(subjectHref ?? '/')
      // The Hono webhook only expires the server cache. This is queued after
      // the navigation and drops the client Router Cache entry, so the
      // destination can't render from a copy that still lists this script.
      router.refresh()
    } catch {
      addToast({
        type: 'error',
        title: SCRIPT_STRINGS.manage.deleteFailed,
        description: SCRIPT_STRINGS.manage.tryAgain,
      })
    }
  }

  return (
    <Box
      role='group'
      aria-label={SCRIPT_STRINGS.manage.ariaLabel}
      className='ui-cluster gap-2'
    >
      <EditScriptModal
        scriptId={scriptId}
        subjectId={subjectId}
        script={script}
      />
      <ConfirmAction
        title={SCRIPT_STRINGS.manage.deleteTitle}
        description={SCRIPT_STRINGS.manage.deleteDescription}
        confirmLabel={SCRIPT_STRINGS.manage.deleteConfirm}
        cancelLabel={SCRIPT_STRINGS.manage.cancel}
        onConfirm={remove}
        trigger={(open) => (
          <Button onClick={open} className='button button-sm danger grow'>
            {SCRIPT_STRINGS.manage.delete}
          </Button>
        )}
      />
    </Box>
  )
}
