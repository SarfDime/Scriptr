import { groq } from 'next-sanity'

export const websiteSeoQuery = groq`
*[_id == $WEBSITE][0]{
  "siteName": coalesce(siteName, websiteTitle, "Scriptr"),
  "siteUrl": coalesce(siteUrl, ""),
  "defaultSeoTitle": coalesce(defaultSeoTitle, websiteTitle, "Scriptr"),
  "defaultSeoDescription": coalesce(defaultSeoDescription, ""),
  "defaultKeywords": defaultKeywords[]
}
`
export const starCanvasQuery = groq`
*[_id == $WEBSITE][0]{
  dtBackground->{...}
}.dtBackground
`
