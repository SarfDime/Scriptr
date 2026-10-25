import { groq } from 'next-sanity'

/** All study tips with a title and content, in a stable order so the per-day
 * pick (see `getDailyStudyTip`) lands on the same tip for every request that
 * day. */
export const studyTipsQuery = groq`
*[_type == "studyTip" && length(title) > 0 && length(content) > 0] | order(_createdAt asc, _id asc) {
  _id,
  title,
  content
}
`
