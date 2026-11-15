import { groq } from 'next-sanity'
import { localizedBlocksValue } from './localized.queries'

/** All study tips with a title and content. The order is stable so the cached
 * body is stable; the navbar picks one per render (`NavStudyTip`). */
export const studyTipsQuery = groq`
*[_type == "studyTip" && length(${localizedBlocksValue('localizedTitle')}) > 0 && length(${localizedBlocksValue('localizedContent')}) > 0] | order(_createdAt asc, _id asc) {
  _id,
  "title": ${localizedBlocksValue('localizedTitle')},
  "content": ${localizedBlocksValue('localizedContent')}
}
`
