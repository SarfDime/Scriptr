import type { SCRIPT_STRINGS_PACK } from '@shared/strings/scripts-strings'
import type { ResolvedStrings } from '@shared/types/localization.types'
import type { ScriptFile } from '@shared/types/scripts.types'

type NamedFile = Pick<ScriptFile, 'file_name' | 'file_type' | 'position'>

type ScriptStrings = ResolvedStrings<typeof SCRIPT_STRINGS_PACK>

/** The visible name of a file. Stored names are kebab-case without an
 * extension (the type is shown as its own badge), so it is shown as is; files
 * from before names were kept fall back to their position. */
export const getScriptFileLabel = (file: NamedFile, strings: ScriptStrings) =>
  file.file_name ?? strings.file.label(file.position + 1)

/** The same name for places that read it out or title a dialog: aria labels,
 * thumbnail alt text and the preview title. */
export const getScriptFileName = (file: NamedFile, strings: ScriptStrings) =>
  file.file_name ?? strings.file.name(file.position + 1, file.file_type)
