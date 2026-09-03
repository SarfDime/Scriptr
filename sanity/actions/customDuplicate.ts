import { CopyIcon } from '@sanity/icons/Copy'
import { uuid } from '@sanity/uuid'
import { useDocumentOperation } from 'sanity'

/** Returns an action that creates an independent copy of a document.
 * The copy will have a new ID and will not be linked to the original document.
 */
export function CustomDuplicateAction(props: { id: string; type: string }) {
  const { duplicate } = useDocumentOperation(props.id, props.type)

  return {
    label: 'Create Independent Copy',
    icon: CopyIcon,
    onHandle: () => {
      const newId = uuid()

      duplicate.execute(newId, {
        mapDocument: (document) => {
          const { _id, ...rest } = document

          return {
            _id: newId,
            ...rest,
          }
        },
      })
    },
  }
}
