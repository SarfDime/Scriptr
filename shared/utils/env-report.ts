/**
 * Startup environment reports.
 *
 * Each app declares the variables it reads, this module says which are present,
 * and nothing here ever prints a value: only names, presence and what breaks
 * without them. That keeps the startup log useful in a terminal and safe to
 * paste into an issue.
 */

export type EnvVarRequirement = {
  name: string
  /** `false` means the app still starts; the feature that reads it degrades. */
  required: boolean
  /** One line shown only when the variable is missing. Say what breaks. */
  purpose: string
}

export type EnvVarStatus = EnvVarRequirement & { isSet: boolean }

export type EnvReport = {
  entries: Array<EnvVarStatus>
  set: Array<EnvVarStatus>
  missingRequired: Array<EnvVarStatus>
  missingOptional: Array<EnvVarStatus>
  isReady: boolean
}

export type EnvReportSummary = {
  isReady: boolean
  /** One line to log, followed by `details` indented beneath it. */
  headline: string
  details: Array<string>
}

/** A variable counts as set only when it has a non-blank value: `.env` files
 * routinely keep `NAME=` placeholders, which configure nothing. */
const isSet = (
  env: Record<string, string | undefined>,
  name: string
): boolean => (env[name] ?? '').trim().length > 0

export const buildEnvReport = (
  requirements: ReadonlyArray<EnvVarRequirement>,
  env: Record<string, string | undefined> = process.env
): EnvReport => {
  const entries = requirements.map((requirement) => ({
    ...requirement,
    isSet: isSet(env, requirement.name),
  }))

  const missingRequired = entries.filter(
    (entry) => entry.required && !entry.isSet
  )
  const missingOptional = entries.filter(
    (entry) => !entry.required && !entry.isSet
  )

  return {
    entries,
    set: entries.filter((entry) => entry.isSet),
    missingRequired,
    missingOptional,
    isReady: missingRequired.length === 0,
  }
}

const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? '' : 's'}`

/** A group heading plus one indented line per variable. Names are padded to the
 * longest in the group so the descriptions start on the same column; without
 * that, a wall of differently-sized names is much harder to scan. */
const group = (
  label: string,
  entries: ReadonlyArray<EnvVarStatus>,
  { withPurpose = true }: { withPurpose?: boolean } = {}
): Array<string> => {
  if (entries.length === 0) return []

  const width = Math.max(...entries.map((entry) => entry.name.length))
  const lines = entries.map((entry) =>
    withPurpose
      ? `  ${entry.name.padEnd(width)}  ${entry.purpose}`
      : `  ${entry.name}`
  )

  return [`${label} (${entries.length}):`, ...lines]
}

/**
 * The startup log for a report. `extraLines` carries anything the generic
 * checklist cannot know, such as a deprecated variable that is still set or a
 * malformed secret.
 */
export const summarizeEnvReport = (
  report: EnvReport,
  extraLines: ReadonlyArray<string> = []
): EnvReportSummary => {
  const setNames = report.set.map((entry) => entry.name)
  const details: Array<string> = [
    ...group('missing, required', report.missingRequired),
    ...group('not set, optional', report.missingOptional),
    ...(extraLines.length > 0
      ? ['notes:', ...extraLines.map((line) => `  ${line}`)]
      : []),
    ...group('set', report.set, { withPurpose: false }),
  ]

  const headline = (): string => {
    if (!report.isReady) {
      return `Environment incomplete — ${plural(report.missingRequired.length, 'required variable')} missing.`
    }

    if (setNames.length === 0) {
      return `Environment ready — nothing is set; all ${plural(report.entries.length, 'variable')} are optional.`
    }

    return `Environment ready — ${plural(setNames.length, 'variable')} set, ${plural(report.missingOptional.length, 'optional variable')} not set.`
  }

  return { isReady: report.isReady, headline: headline(), details }
}
