import type { SanityDocument } from '@sanity/client'
import { API_VERSION } from '@shared/config/sanity-constants'
import type {
  CombinedFilterSchemaArrayType,
  CombinedFilterSchemasType,
  Doc,
  FilterParams,
  Page,
  Parent,
  ReferenceValue,
} from '../../types/schema-prop.types'

/**
 * Filters page sections based on the selected page,
 * including fetching footer sections.
 *
 * This function performs two Sanity queries:
 * 1. Fetches footer sections.
 * 2. Fetches sections from the selected page if one is referenced.
 *
 * It combines the section references from both the selected page and the footer,
 * returning a filter query to be used in Sanity Studio to only display the relevant sections.
 */
export async function filterPageSections({
  document,
  getClient,
}: FilterParams) {
  const client = getClient({ apiVersion: API_VERSION })
  const { allPages } = document

  // Fetch the footer sections
  const footers = await client.fetch<Array<{ _id: string }>>(
    `*[_type == 'footer']{_id}`
  )
  // If a page is selected, fetch its sections
  if (allPages) {
    const page: SanityDocument<Page> | undefined = await client.fetch(
      '*[_id == $pageId][0]{pageSections}',
      { pageId: allPages?._ref }
    )
    // Collect the section references from both the page and the footer
    const sectionsRefs = [
      ...(page?.pageSections?.map((section) => section?._ref) ?? []),
      ...footers.map((footer) => footer?._id),
    ]
    // Return the filter and parameters for the sections
    return {
      filter: '_id in $sectionsRefs',
      params: { sectionsRefs },
    }
  }
  return {}
}

/**
 * Filters existing references based on the provided parent object.
 */
export const filterExistingReferences = ({
  parent,
  arraysToMap,
}: {
  parent?: Parent
  arraysToMap?: Array<string>
}) => {
  if (!parent && !arraysToMap?.length) {
    return {
      filter: '!(_id in path("drafts.**"))',
    }
  }

  const existingEntries = arraysToMap
    ? arraysToMap
        ?.map((fieldName) => {
          return parent?.[
            fieldName as unknown as number
          ] as unknown as ReferenceValue
        })
        ?.map((entry) => entry?._ref)
        ?.filter(Boolean)
    : parent?.map((entry) => entry?._ref)?.filter(Boolean)

  return {
    filter: '!(_id in $existingEntries) && !(_id in path("drafts.**"))',
    params: {
      existingEntries,
    },
  }
}

/** Generates a filter for excluding specific schema documents in Sanity Studio.
 *
 * This function returns a filter for documents of a specific type defined by
 * `inputFilename`, excluding documents that have references in a specified
 * field `otherFieldName`. If there are no references in the specified field,
 * the filter will only include documents of the specified type.
 *
 * If `singleFieldName` is provided, the filter will only exclude the single
 * document with the matching `_ref` value in the specified field.
 */
export const filterExcludeSchemas = ({
  inputFieldName,
  otherFieldNames,
  singleFieldName,
}: {
  inputFieldName: keyof Doc
  otherFieldNames?: Array<keyof CombinedFilterSchemaArrayType>
  singleFieldName?: keyof CombinedFilterSchemasType
}) => {
  return ({
    document,
  }: {
    document: CombinedFilterSchemasType & CombinedFilterSchemaArrayType
  }) => {
    if (singleFieldName) {
      const singleFieldId = document?.[singleFieldName]?._ref
      if (!singleFieldId) {
        return {
          filter: `_type == "${inputFieldName}"`,
        }
      }

      return {
        filter: `_type == "${inputFieldName}" && _id != $singleFieldId`,
        params: {
          singleFieldId,
        },
      }
    }

    const otherFieldIds = otherFieldNames?.reduce(
      (acc, fieldName) => {
        const ids = (document?.[fieldName] ?? [])?.map((ref) => ref?._ref)
        return acc.concat(ids)
      },
      [] as Array<string>
    )

    if (!otherFieldIds || otherFieldIds?.length === 0) {
      return {
        filter: `_type == "${inputFieldName}"`,
      }
    }
    return {
      filter: `_type == "${inputFieldName}" && !(_id in $otherFieldIds)`,
      params: {
        otherFieldIds,
      },
    }
  }
}

/**
 * Creates a filter function for excluding certain schema entries in Sanity Studio.
 *
 * This function combines the filters for existing entries, drafts, and entries referenced in the `document` under the
 * specified `otherFieldNames`, while including only those documents matching the specified `inputFilename`.
 */
export const createExcludeSchemaFilter = ({
  inputFieldName,
  otherFieldNames,
  singleFieldName,
}: {
  inputFieldName: keyof Doc
  otherFieldNames?: Array<keyof CombinedFilterSchemaArrayType>
  singleFieldName?: keyof CombinedFilterSchemasType
}) => {
  return ({
    document,
    parent,
  }: {
    document: CombinedFilterSchemaArrayType & CombinedFilterSchemasType
    parent: Parent
  }) => {
    const existingEntriesFilter = filterExistingReferences({
      parent,
      arraysToMap: otherFieldNames,
    })

    const excludeSchemasFilter = filterExcludeSchemas({
      inputFieldName,
      singleFieldName,
      otherFieldNames,
    })({ document })

    const combinedFilter = `${existingEntriesFilter?.filter} ${excludeSchemasFilter?.filter?.replace(/^_type == "[^"]*"/, '')}`

    return {
      filter: combinedFilter,
      params: {
        ...existingEntriesFilter?.params,
        ...excludeSchemasFilter?.params,
      },
    }
  }
}
