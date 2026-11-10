import type { PortableTextBlock } from '@portabletext/types'

export const ref = (id: string) => ({ _type: 'reference' as const, _ref: id })

export const refs = (ids: Array<string>) =>
  ids.map((id) => ({ ...ref(id), _key: id }))

export const toPortableText = (
  text?: string
): Array<PortableTextBlock> | undefined => {
  if (!text) return undefined
  return [
    {
      _type: 'block',
      _key: crypto.randomUUID(),
      style: 'normal',
      children: [{ _type: 'span', _key: crypto.randomUUID(), text, marks: [] }],
      markDefs: [],
    },
  ]
}

/** Structural shape only — avoids importing the SanityClient class type, which
 *  can resolve to a different nominal declaration than context.client's actual
 *  type in a monorepo with more than one @sanity/client instance installed. */
export type AssetUploadClient = {
  assets: {
    upload: (
      type: 'image' | 'file',
      body: Buffer | Blob | NodeJS.ReadableStream,
      options?: Record<string, unknown>
    ) => Promise<{ _id: string }>
  }
}

/** Uploads a remote image and returns a Sanity image value. Skips quietly on failure. */
export const uploadImage = async <Client extends AssetUploadClient>(
  client: Client,
  url?: string
) => {
  if (!url) return undefined
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`)
    const buffer = Buffer.from(await response.arrayBuffer())
    const asset = await client.assets.upload('image', buffer, {
      filename: url.split('/').pop(),
    })
    return { _type: 'image' as const, asset: ref(asset._id) }
  } catch (_err) {
    return undefined
  }
}

type LocalizedStringValue = { en?: string; mk?: string }

/** Builds the localized string object used by the duplicated text fields. */
export const localizedString = (value?: LocalizedStringValue) => {
  if (!value?.en && !value?.mk) return undefined
  return {
    _type: 'localizedString' as const,
    ...(value.en ? { en: value.en } : {}),
    ...(value.mk ? { mk: value.mk } : {}),
  }
}

/** Builds the localized lite rich-text object used by description fields. */
export const localizedPortableText = (value?: LocalizedStringValue) => {
  const en = toPortableText(value?.en)
  const mk = toPortableText(value?.mk)
  if (!en && !mk) return undefined
  return {
    _type: 'localizedRichTextLite' as const,
    ...(en ? { en } : {}),
    ...(mk ? { mk } : {}),
  }
}

/** Builds the localized string-list object used by keyword fields. */
export const localizedStringList = (value?: {
  en?: Array<string>
  mk?: Array<string>
}) => {
  const en = value?.en?.length ? value.en : undefined
  const mk = value?.mk?.length ? value.mk : undefined
  if (!en && !mk) return undefined
  return {
    _type: 'localizedStringArray' as const,
    ...(en ? { en } : {}),
    ...(mk ? { mk } : {}),
  }
}
