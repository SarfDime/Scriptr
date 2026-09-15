import { groq } from 'next-sanity'

const sharedPageDataQuery = groq`
_type,
defined(slug)=>{slug},
defined(title)=>{ "title": pt::full(title) },
defined(subtitle)=>{ "subtitle": pt::full(subtitle) },
defined(stringTitle)=>{stringTitle},
defined(stringSubtitle)=>{stringSubtitle},
defined(icon)=>{ "icon": sanityImage::full(icon) },
`

export { sharedPageDataQuery }
