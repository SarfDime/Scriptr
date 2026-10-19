import type { ScriptSummary } from '@shared/types/scripts.types'

/** The fields `PATCH /scripts/:id` accepts. */
export type ScriptEditableFields = Pick<
  ScriptSummary,
  'title' | 'description' | 'additional_reading'
>

export type ScriptManageActionsProps = {
  scriptId: string
  /** The script's subject, which decides where new files are stored. */
  subjectId: string
  script: ScriptEditableFields
  /** Where to go after a delete; `null` falls back to the homepage. */
  subjectHref: string | null
}

export type EditScriptModalProps = {
  scriptId: string
  /** The script's subject, which decides where new files are stored. */
  subjectId: string
  script: ScriptEditableFields
}

export type ScriptFileRemoveButtonProps = {
  scriptId: string
  fileId: string
  fileName: string
  className?: string
}
