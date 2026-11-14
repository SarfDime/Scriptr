'use client'

import Trash from '@sanity/icons/Trash'
import { SCRIPT_STRINGS_PACK } from '@shared/strings/scripts-strings'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/common/Button'
import { ConfirmAction } from '@/components/ui/ConfirmAction'
import { removeScriptFile } from '@/lib/api/scripts-api'
import { useStrings } from '@/providers/locale/use-strings'
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
  const strings = useStrings(SCRIPT_STRINGS_PACK)

  const remove = async () => {
    try {
      await removeScriptFile(scriptId, fileId)
      addToast({ type: 'success', title: strings.manage.fileRemoved })
      router.refresh()
    } catch {
      addToast({
        type: 'error',
        title: strings.manage.removeFileFailed,
        description: strings.manage.tryAgain,
      })
    }
  }

  return (
    <ConfirmAction
      title={strings.manage.removeFileTitle(fileName)}
      description={strings.manage.removeFileDescription}
      confirmLabel={strings.manage.removeFileConfirm}
      cancelLabel={strings.manage.cancel}
      onConfirm={remove}
      trigger={(open) => (
        <Button
          onClick={open}
          className={className}
          aria-label={strings.manage.removeFileAriaLabel(fileName)}
        >
          <Trash className='overwrite size-5' />
          {strings.manage.removeFile}
        </Button>
      )}
    />
  )
}
