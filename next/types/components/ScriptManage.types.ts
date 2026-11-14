import type {
  LocalizedScriptText,
  ScriptSummary,
} from '@shared/types/scripts.types'

/** The fields `PATCH /scripts/:id` accepts — what the edit form starts from: the *stored* values, per language — not the
 *  ones resolved for the reader, since the author edits every language. */
export type ScriptEditableFields = Pick<
  ScriptSummary,
  'additional_reading' | 'exam_session' | 'exam_year' | 'slug'
> & {
  title: LocalizedScriptText
  description: LocalizedScriptText | null
}

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
