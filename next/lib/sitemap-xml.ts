/** One address in a sitemap section. */
export type SitemapEntry = {
  url: string
  lastModified?: string | Date
}

const escapeXml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')

const toEntryXml = (entry: SitemapEntry): string => {
  const lastModified = entry.lastModified
    ? `<lastmod>${new Date(entry.lastModified).toISOString()}</lastmod>`
    : ''

  return `  <url><loc>${escapeXml(entry.url)}</loc>${lastModified}</url>`
}

/** A `<urlset>`: the addresses of one sitemap section. */
export const toSitemapUrlsetXml = (entries: Array<SitemapEntry>): string =>
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(toEntryXml).join('\n')}
</urlset>
`

/** A `<sitemapindex>`: the sections a crawler should read, one entry point per
 * host. */
export const toSitemapIndexXml = (sitemapUrls: Array<string>): string =>
  `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls
  .map((url) => `  <sitemap><loc>${escapeXml(url)}</loc></sitemap>`)
  .join('\n')}
</sitemapindex>
`

export const SITEMAP_CONTENT_TYPE = 'application/xml'
