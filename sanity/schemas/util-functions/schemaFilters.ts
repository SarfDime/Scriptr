import type { Parent, ReferenceValue } from '../../types/schema-prop.types'

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
