import 'server-only'
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { cacheLife } from 'next/cache'

const FETCH_TIMEOUT_MS = 3000
const MAX_REDIRECTS = 3
/** The title normally sits in `<head>`, but a page can inline a lot before it
 * (YouTube's is ~850 KB in), so the cap is generous; it still stops a huge
 * document from being downloaded for one line. */
const MAX_HTML_BYTES = 1024 * 1024

const TITLE_PATTERN = /<title[^>]*>([\s\S]*?)<\/title>/i
const TAG_PATTERN = /<[^>]+>/g
const ENTITY_PATTERN = /&(#x?[0-9a-f]+|[a-z]+);/gi

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  nbsp: ' ',
  quot: '"',
}

const decodeEntities = (value: string) =>
  value.replace(ENTITY_PATTERN, (entity, code: string) => {
    if (!code.startsWith('#'))
      return NAMED_ENTITIES[code.toLowerCase()] ?? entity

    const hex = code[1]?.toLowerCase() === 'x'
    const point = Number.parseInt(
      hex ? code.slice(2) : code.slice(1),
      hex ? 16 : 10
    )
    if (!Number.isFinite(point) || point < 0 || point > 0x10ffff) return entity

    try {
      return String.fromCodePoint(point)
    } catch {
      return entity
    }
  })

/** The document title, whitespace-collapsed and stripped of inline markup. */
const readTitle = (html: string): string | null => {
  const match = TITLE_PATTERN.exec(html)
  if (!match?.[1]) return null

  const title = decodeEntities(match[1].replace(TAG_PATTERN, ' '))
    .replace(/\s+/g, ' ')
    .trim()

  return title.length > 0 ? title.slice(0, 200) : null
}

const isPrivateIpv4 = (address: string) => {
  const octets = address.split('.').map(Number)
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet))) {
    return true
  }

  const [a = 0, b = 0] = octets
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 0 || b === 168)) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  )
}

const isPrivateIpv6 = (address: string) => {
  const value = address.toLowerCase()
  if (value === '::' || value === '::1') return true
  if (value.startsWith('::ffff:')) return isPrivateIpv4(value.slice(7))

  return (
    value.startsWith('fc') ||
    value.startsWith('fd') ||
    value.startsWith('fe8') ||
    value.startsWith('fe9') ||
    value.startsWith('fea') ||
    value.startsWith('feb')
  )
}

const isPrivateAddress = (address: string) => {
  const version = isIP(address)
  if (version === 4) return isPrivateIpv4(address)
  if (version === 6) return isPrivateIpv6(address)
  return true
}

/** Reading links are user-supplied, so the server only fetches public hosts. */
const isPublicHost = async (hostname: string) => {
  const host = hostname.replace(/^\[|\]$/g, '').toLowerCase()
  if (
    !host.includes('.') ||
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.endsWith('.home.arpa')
  ) {
    return false
  }

  if (isIP(host) !== 0) return !isPrivateAddress(host)

  try {
    const addresses = await lookup(host, { all: true, verbatim: true })
    return (
      addresses.length > 0 &&
      addresses.every((record) => !isPrivateAddress(record.address))
    )
  } catch {
    return false
  }
}

const toHttpUrl = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null
  } catch {
    return null
  }
}

/** Reads at most `MAX_HTML_BYTES`, stopping at the title's closing tag. */
const readHtml = async (response: Response) => {
  const reader = response.body?.getReader()
  if (!reader) return ''

  const decoder = new TextDecoder()
  let html = ''
  let bytes = 0

  try {
    while (bytes < MAX_HTML_BYTES) {
      const { done, value } = await reader.read()
      if (done) break

      bytes += value.byteLength
      html += decoder.decode(value, { stream: true })
      if (TITLE_PATTERN.test(html)) break
    }

    return html + decoder.decode()
  } finally {
    await reader.cancel().catch(() => undefined)
  }
}

const fetchTitle = async (start: URL): Promise<string | null> => {
  let url = start

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    if (!(await isPublicHost(url.hostname))) return null

    const response = await fetch(url, {
      redirect: 'manual',
      credentials: 'omit',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'accept-language': 'en',
        'user-agent': 'Mozilla/5.0 (compatible; ScriptrLinkTitle/1.0)',
      },
    })

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location) return null

      const next = toHttpUrl(new URL(location, url).toString())
      if (!next) return null
      url = next
      continue
    }

    if (!response.ok) return null

    const contentType = response.headers.get('content-type')
    if (contentType && !contentType.includes('html')) return null

    return readTitle(await readHtml(response))
  }

  return null
}

/** The page title behind an additional-reading link, or `null` when the link
 * is not a public page or has no title. Cached per link; a title rarely
 * changes, and a failed lookup is cached too so a dead link is not retried on
 * every render. */
export async function getLinkTitle(link: string): Promise<string | null> {
  'use cache'
  cacheLife('weeks')

  const url = toHttpUrl(link)
  if (!url) return null

  try {
    return await fetchTitle(url)
  } catch {
    return null
  }
}
