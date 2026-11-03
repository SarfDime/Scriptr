import type { ScriptSummary } from '@shared/types/scripts.types'

/** The fields `PATCH /scripts/:id` accepts. */
export type ScriptEditableFields = Pick<
  ScriptSummary,
  | 'title'
  | 'description'
  | 'additional_reading'
  | 'exam_session'
  | 'exam_year'
  /** Shown read-only in the edit form: the address never changes with the
   * title, which is what the form says next to it. */
  | 'slug'
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
