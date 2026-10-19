'use client'

import Trash from '@sanity/icons/Trash'
import { SCRIPT_STRINGS } from '@shared/strings/scripts-strings'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/common/Button'
import { ConfirmAction } from '@/components/ui/ConfirmAction'
import { removeScriptFile } from '@/lib/api/scripts-api'
import { useToast } from '@/providers/toaster/ToasterProvider'
import type { ScriptFileRemoveButtonProps } from '@/types/components/ScriptManage.types'

/** Removes one file from a script (author or admin). File removal is never
 * restriction-checked, so it deliberately doesn't use `useProtectedAction`. */
export function ScriptFileRemoveButton({
  scriptId,
  fileId,
  fileName,
  className,
}: ScriptFileRemoveButtonProps) {
  const router = useRouter()
  const { addToast } = useToast()

  const remove = async () => {
    try {
      await removeScriptFile(scriptId, fileId)
      addToast({ type: 'success', title: SCRIPT_STRINGS.manage.fileRemoved })
      router.refresh()
    } catch {
      addToast({
        type: 'error',
        title: SCRIPT_STRINGS.manage.removeFileFailed,
        description: SCRIPT_STRINGS.manage.tryAgain,
      })
    }
  }

  return (
    <ConfirmAction
      title={SCRIPT_STRINGS.manage.removeFileTitle(fileName)}
      description={SCRIPT_STRINGS.manage.removeFileDescription}
      confirmLabel={SCRIPT_STRINGS.manage.removeFileConfirm}
      cancelLabel={SCRIPT_STRINGS.manage.cancel}
      onConfirm={remove}
      trigger={(open) => (
        <Button
          onClick={open}
          className={className}
          aria-label={SCRIPT_STRINGS.manage.removeFileAriaLabel(fileName)}
        >
          <Trash className='overwrite size-5' />
          {SCRIPT_STRINGS.manage.removeFile}
        </Button>
      )}
    />
  )
}
