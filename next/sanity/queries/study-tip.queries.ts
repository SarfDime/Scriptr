import { groq } from 'next-sanity'
import { localizedBlocksValue } from './localized.queries'

/** All study tips with a title and content, in a stable order so the per-day
 * pick (see `NavStudyTip`) lands on the same tip for every reader that day. */
export const studyTipsQuery = groq`
*[_type == "studyTip" && length(${localizedBlocksValue('localizedTitle')}) > 0 && length(${localizedBlocksValue('localizedContent')}) > 0] | order(_createdAt asc, _id asc) {
  _id,
  "title": ${localizedBlocksValue('localizedTitle')},
  "content": ${localizedBlocksValue('localizedContent')}
}
`
