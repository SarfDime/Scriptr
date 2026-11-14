import type { LocaleId } from '../config/localization-constants'

/** One message in every supported language. */
export type LocalizedText = Readonly<Record<LocaleId, string>>

/** A translatable message: a `{ en, mk }` pair, or a plain string that has not
 * been translated yet, which reads the same in every language. */
export type LocalizedMessage = string | LocalizedText

/**
 * The shape a string collection takes once it is resolved for one language.
 *
 * `{ en, mk }` entries collapse to the chosen language and functions keep their
 * signature while returning it; everything else passes through untouched. That
 * is what makes adoption gradual: a collection can hold translated and
 * untranslated entries side by side, and the untranslated ones simply read as
 * they always did.
 */
export type ResolvedStrings<T, L extends LocaleId = LocaleId> = T extends string
  ? T
  : T extends LocalizedText
    ? T[L]
    : T extends (...args: infer A) => infer R
      ? R extends LocalizedText
        ? (...args: A) => R[L]
        : (...args: A) => ResolvedStrings<R, L>
      : T extends ReadonlyArray<infer U>
        ? Array<ResolvedStrings<U, L>>
        : T extends object
          ? { readonly [K in keyof T]: ResolvedStrings<T[K], L> }
          : T

/**
 * Every dot path in a collection that ends in a message — a plain string, a
 * `{ en, mk }` entry, or a function that returns one.
 */
export type StringPath<T> = {
  [K in keyof T & string]: T[K] extends string | LocalizedText
    ? K
    : T[K] extends (...args: Array<never>) => unknown
      ? K
      : T[K] extends object
        ? `${K}.${StringPath<T[K]>}`
        : never
}[keyof T & string]

/** The arguments the message at `P` takes; `[]` for a message that takes none. */
export type StringPathArgs<
  T,
  P extends string,
> = P extends `${infer Head}.${infer Rest}`
  ? Head extends keyof T
    ? StringPathArgs<T[Head], Rest>
    : never
  : P extends keyof T
    ? T[P] extends (...args: infer A) => unknown
      ? A
      : []
    : never
