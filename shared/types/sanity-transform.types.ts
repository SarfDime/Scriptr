import type { Json } from './database.types'

type SanityImageType = {
  _type: 'image'
  alt?: string
  _ref?: string
  asset?: {
    _ref?: string
    _type?: string
  }
  cornerRadius?: number
  rounded?: number
  crop?: {
    _ref?: string
    _type?: string
    bottom?: number
    left?: number
    right?: number
    top?: number
  }
  hotspot?: {
    _ref?: string
    _type?: string
    height?: number
    width?: number
    x?: number
    y?: number
  }
}

type Primitive = string | number | boolean | null | undefined

/**
 * Recursively walks a Sanity TypeGen result and applies three structural fixes
 * at any depth, inside objects or arrays:
 *
 * 1. Pictures: Replaces fields matching `TPictureKey` (`picture` and `logo`, the
 *    two keys `sanityImage::full` projections use) with a non-nullable
 *    `SanityImageType`.
 * 2. Media: Replaces `media: unknown` inside PortableText image blocks with `Record<string, unknown>`.
 * 3. Rich Text: Forces fields matching `TRichTextKey` to be strictly `NonNullable`.
 *
 * Note: this only changes the *type*. The `defined(picture)=>{...}` guard in
 * GROQ means a missing picture is omitted from the response rather than sent
 * as `null`, but TypeGen still widens the field to nullable. Casting through
 * this type is safe *only* at query call sites that actually use `defined()` guards
 * for pictures, and where Rich Text is reliably handled.
 */
type WithResolvedSanityData<
  T,
  TPictureKey extends string = 'picture' | 'logo',
  TRichTextKey extends string = 'description' | 'bio',
> = T extends Primitive
  ? T
  : T extends Array<infer U>
    ? Array<WithResolvedSanityData<U, TPictureKey, TRichTextKey>>
    : T extends object
      ? {
          [K in keyof T]: K extends TPictureKey
            ? SanityImageType
            : K extends 'media'
              ? Json | undefined
              : K extends TRichTextKey
                ? NonNullable<
                    WithResolvedSanityData<T[K], TPictureKey, TRichTextKey>
                  >
                : WithResolvedSanityData<T[K], TPictureKey, TRichTextKey>
        }
      : T

export type { SanityImageType, WithResolvedSanityData }
