import { SCRIPT_STRINGS } from '@shared/strings/scripts-strings'
import type { ScriptFile } from '@shared/types/scripts.types'

type NamedFile = Pick<ScriptFile, 'file_name' | 'file_type' | 'position'>

/** The visible name of a file. Stored names are kebab-case without an
 * extension (the type is shown as its own badge), so it is shown as is; files
 * from before names were kept fall back to their position. */
export const getScriptFileLabel = (file: NamedFile) =>
  file.file_name ?? SCRIPT_STRINGS.file.label(file.position + 1)

/** The same name for places that read it out or title a dialog: aria labels,
 * thumbnail alt text and the preview title. */
export const getScriptFileName = (file: NamedFile) =>
  file.file_name ?? SCRIPT_STRINGS.file.name(file.position + 1, file.file_type)
