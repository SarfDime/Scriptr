import type { ComponentType, CSSProperties } from 'react'
import type {
  ReferenceFilterResolverContext,
  ReferenceValue,
  SanityClient,
  SanityDocument,
  SlugValue,
} from 'sanity'
import type { StructureToolIconColorsType } from '../structure-tool/icon-helpers'

type Asset = {
  _key: string
  _id: string
} & ReferenceValue

type CombinedFilterSchemaArrayType = {
  pagesOnWebsite: Array<ReferenceValue>
}

type CombinedFilterSchemasType = {
  homepage: ReferenceValue
}

type DocumentListItems = 'featuredPost' | 'postsArray' | 'webschemasOnWebsite'

type DocumentLists = Partial<Record<DocumentListItems, Array<ReferenceValue>>>

type FilterParams = {
  document: Doc
  getClient: ({ apiVersion }: { apiVersion: string }) => SanityClient
} & ReferenceFilterResolverContext

/** Represents a type typically used in deskStructure to associate an icon with schemas. */
type ChildSchemaType = {
  title: string
  schemaType: string
  icon: ComponentType<{ style?: CSSProperties; className?: string }>
  category?: StructureToolIconColorsType
  type?: string
}

type Doc = {
  linkType?: string
  websiteId?: string
  slug?: SlugValue
  title?: string
  pageSlug?: SlugValue
  allPages?: ReferenceValue
  allPageSections?: ReferenceValue
  dropdown?: string
} & SanityDocument &
  Asset &
  Page &
  DocumentLists

type Parent = Array<ReferenceValue>

type SchemaUtilProps = {
  parent: Parent
  document: Doc
}

type Page = {
  _id: string
  pageSlug?: SlugValue
  pageSections?: Array<ReferenceValue>
  // Add other relevant fields if necessary
}

export type {
  Asset,
  ChildSchemaType,
  CombinedFilterSchemaArrayType,
  CombinedFilterSchemasType,
  Doc,
  DocumentListItems,
  DocumentLists,
  FilterParams,
  Page,
  Parent,
  ReferenceValue,
  SchemaUtilProps,
}
