import type { DefaultDocumentNodeResolver } from 'sanity/structure'
import { referencesView } from 'sanity-plugin-references'
import { iframeBuilder } from './schemas/util-functions/utilFunctions'

// We use the array below to limit the the appearance of previewing button to only pages
const documentsWithPreviewing = ['page']

/**
 * This enables the iFrame plugin in Sanity Studio. It gives us the website preview on an iframe
 */
export const defaultDocumentNode: DefaultDocumentNodeResolver = (
  s,
  { schemaType }
) => {
  if (documentsWithPreviewing.includes(schemaType)) {
    return s
      .document()
      .views([s.view.form(), iframeBuilder(s, 'Preview'), referencesView(s)])
  }
  return s.document().views([s.view.form(), referencesView(s)])
}
