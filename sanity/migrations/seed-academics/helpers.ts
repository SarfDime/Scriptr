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
