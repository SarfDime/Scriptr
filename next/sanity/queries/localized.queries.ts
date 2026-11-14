/**
 * GROQ projections for the localized text fields: a query keeps the field name
 * it always had (`name`, `title`, …) and resolves the value in the reader's
 * language, so no component ever sees a localized object.
 *
 * Two constraints shape how these are written:
 *
 * - `sanity typegen` statically evaluates every query and only understands
 *   literals, template strings, identifiers and direct calls, so these are
 *   expression-bodied arrows over plain template strings. A helper that mapped
 *   over `SUPPORTED_LANGUAGES`, used a conditional, or had a block body made
 *   typegen drop its query from the generated types — silently. The language
 *   chain is spelled out instead: the reader's language, then the default one,
 *   then the other.
 * - The fields are read by name (`localizedName.en`) rather than by index
 *   (`localizedName[$locale]`), because typegen cannot type a computed key and
 *   widens the result to the whole localized object.
 *
 * `coalesce` alone would not do: it only skips `null`, and a language can be
 * present but empty — `""` for a string, `[]` for rich text — which would then
 * shadow a filled one. So each language is admitted only when it holds
 * something, and the outer `coalesce` picks the first language that did. A query
 * run without `$locale` (a `generateStaticParams` read) resolves to the default
 * language. The localized object is the only source there is: the legacy
 * single-language fields were deleted once both read paths were verified.
 *
 * There are two flavours because the empty value has to match the field's type.
 * `localizedProjection`/`localizedValue` end in `""`, which keeps a text field
 * typed `string` (typegen unions `null` into a `select`, and the schema already
 * requires one language) — the reader renders nothing rather than a null.
 * `localizedBlocksProjection`/`localizedBlocksValue` leave the union alone for
 * rich text and string lists, where "no language is filled" is `null` and an
 * empty string would be the wrong value to hand a renderer.
 */

/** `"alias": <value>`, for a projection entry. */
const localizedProjection = (alias: string, source: string): string =>
  `"${alias}": coalesce(select($locale == "en" && length(${source}.en) > 0 => ${source}.en, $locale == "mk" && length(${source}.mk) > 0 => ${source}.mk), select(length(${source}.en) > 0 => ${source}.en, length(${source}.mk) > 0 => ${source}.mk), "")`

/** The same resolution where the value is used rather than projected: a
 *  `match` filter, an `order()` clause, or a hand-written alias. */
const localizedValue = (source: string): string =>
  `coalesce(select($locale == "en" && length(${source}.en) > 0 => ${source}.en, $locale == "mk" && length(${source}.mk) > 0 => ${source}.mk), select(length(${source}.en) > 0 => ${source}.en, length(${source}.mk) > 0 => ${source}.mk), "")`

/** Rich text and string lists, where `""` is the wrong type: no filled language
 *  means "nothing to show", which stays `null`. */
const localizedBlocksProjection = (alias: string, source: string): string =>
  `"${alias}": coalesce(select($locale == "en" && length(${source}.en) > 0 => ${source}.en, $locale == "mk" && length(${source}.mk) > 0 => ${source}.mk), select(length(${source}.en) > 0 => ${source}.en, length(${source}.mk) > 0 => ${source}.mk))`

const localizedBlocksValue = (source: string): string =>
  `coalesce(select($locale == "en" && length(${source}.en) > 0 => ${source}.en, $locale == "mk" && length(${source}.mk) > 0 => ${source}.mk), select(length(${source}.en) > 0 => ${source}.en, length(${source}.mk) > 0 => ${source}.mk))`

export {
  localizedBlocksProjection,
  localizedBlocksValue,
  localizedProjection,
  localizedValue,
}
