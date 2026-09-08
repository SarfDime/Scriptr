import { groq } from 'next-sanity'

const sharedPageDataQuery = groq`
_type,
defined(slug)=>{slug},
defined(title)=>{ "title": portableText::full(title) },
defined(subtitle)=>{ "subtitle": portableText::full(subtitle) },
defined(stringTitle)=>{stringTitle},
defined(stringSubtitle)=>{stringSubtitle},
defined(icon)=>{ "icon": sanityImage::full(icon) },
`

export { sharedPageDataQuery }
