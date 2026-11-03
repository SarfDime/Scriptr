import type { DefaultDocumentNodeResolver } from 'sanity/structure'
import { referencesView } from 'sanity-plugin-references'

export const defaultDocumentNode: DefaultDocumentNodeResolver = (s) =>
  s.document().views([s.view.form(), referencesView(s)])
