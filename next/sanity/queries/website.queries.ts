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
/** The background document the website settings point at. `_type` comes along in
 * the projection, so the frontend can tell a star canvas from a Christmas one. */
export const websiteBackgroundQuery = groq`
*[_id == $WEBSITE][0].background->{...}
`
/** The skybox document the website settings point at: time settings and the color
 * picks per theme. */
export const websiteSkyboxQuery = groq`
*[_id == $WEBSITE][0].skybox->{...}
`
