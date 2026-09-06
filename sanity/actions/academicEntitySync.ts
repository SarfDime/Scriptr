import AddCircleIcon from '@sanity/icons/AddCircle'
import TrashIcon from '@sanity/icons/Trash'
import { useState } from 'react'
import { useClient, useDocumentOperation } from 'sanity'

export type AcademicEntityType =
  | 'university'
  | 'faculty'
  | 'professor'
  | 'subject'

const ENDPOINTS: Record<AcademicEntityType, string> = {
  university: 'universities',
  faculty: 'faculties',
  professor: 'professors',
  subject: 'subjects',
}

function apiUrl(path: string) {
  const base = process.env.SANITY_STUDIO_API_URL ?? 'http://localhost:8787'
  return `${base.replace(/\/$/, '')}${path}`
}

function apiHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-internal-secret': process.env.SANITY_STUDIO_INTERNAL_SECRET ?? '',
  }
}

function refId(value: unknown) {
  return value &&
    typeof value === 'object' &&
    '_ref' in (value as Record<string, unknown>)
    ? (value as { _ref: string })._ref
    : undefined
}

function publishedSanityId(id: string) {
  return id.startsWith('drafts.') ? id.slice('drafts.'.length) : id
}

export type AcademicDocumentActionProps = {
  id: string
  type: string
  draft: Record<string, unknown> | null
  published: Record<string, unknown> | null
  onComplete: () => void
}

/** Creates the "Create in Database" action shared by all academic entity documents.
 * Calls the internal admin API to create (or find) the matching Postgres row, then
 * patches this document's dbId field, which unblocks publishing.
 */
export function createInDatabaseAction(entityType: AcademicEntityType) {
  return function CreateInDatabaseAction(props: AcademicDocumentActionProps) {
    const { patch } = useDocumentOperation(props.id, props.type)
    const client = useClient({ apiVersion: '2024-01-01' })
    const [dialog, setDialog] = useState<string | null>(null)
    const doc = props.draft ?? props.published
    const parentField = entityType === 'faculty' ? 'university' : 'faculty'
    const parentReference =
      entityType === 'faculty' || entityType === 'subject'
        ? refId(doc?.[parentField])
        : undefined

    if (doc?.dbId) {
      return null
    }

    return {
      label: 'Create in Database',
      icon: AddCircleIcon,
      disabled: Boolean(
        !doc?.name ||
          ((entityType === 'faculty' || entityType === 'subject') &&
            !parentReference)
      ),
      onHandle: async () => {
        if (!doc?.name) {
          setDialog('Set a name before linking to the database.')
          return
        }

        if (
          (entityType === 'faculty' || entityType === 'subject') &&
          !parentReference
        ) {
          setDialog(`Add a ${parentField} before creating this record.`)
          return
        }

        const body: Record<string, unknown> = {
          name: doc.name,
          sanity_id: publishedSanityId(props.id),
        }

        if (entityType === 'faculty') {
          body.university_id = await client.fetch<string | null>(
            '*[_id == $id || _id == $draftId][0].dbId',
            { id: parentReference, draftId: `drafts.${parentReference}` }
          )
        }
        if (entityType === 'subject') {
          body.year = doc.year
          body.exam_session = doc.examSession
          body.faculty_id = await client.fetch<string | null>(
            '*[_id == $id || _id == $draftId][0].dbId',
            { id: parentReference, draftId: `drafts.${parentReference}` }
          )
        }

        if (
          (entityType === 'faculty' || entityType === 'subject') &&
          !body[parentField === 'university' ? 'university_id' : 'faculty_id']
        ) {
          setDialog(`Link the selected ${parentField} to the database first.`)
          return
        }

        try {
          const response = await fetch(
            apiUrl(`/api/internal/${ENDPOINTS[entityType]}`),
            {
              method: 'POST',
              headers: apiHeaders(),
              body: JSON.stringify(body),
            }
          )
          const result = await response.json()

          if (!response.ok) {
            setDialog(
              result.error ?? 'Failed to link this document to the database.'
            )
            return
          }

          const record = result[entityType] ?? result
          patch.execute([{ set: { dbId: record.id } }])
          props.onComplete()
        } catch (error) {
          setDialog(
            error instanceof Error
              ? error.message
              : 'Network error while linking.'
          )
        }
      },
      dialog: dialog
        ? {
            type: 'dialog' as const,
            onClose: () => setDialog(null),
            header: 'Create in Database',
            content: dialog,
          }
        : undefined,
    }
  }
}

/** Creates a "Delete" action override that checks the internal admin API for
 * dependents before allowing deletion, so a linked record can't be removed while
 * other records still reference it.
 */
export function createCheckedDeleteAction(entityType: AcademicEntityType) {
  return function CheckedDeleteAction(props: AcademicDocumentActionProps) {
    const { delete: deleteOp } = useDocumentOperation(props.id, props.type)
    const [dialog, setDialog] = useState<string | null>(null)
    const doc = props.draft ?? props.published
    const dbId = doc?.dbId as string | undefined

    return {
      label: 'Delete',
      icon: TrashIcon,
      disabled: Boolean(deleteOp.disabled),
      onHandle: async () => {
        if (!dbId) {
          deleteOp.execute()
          props.onComplete()
          return
        }

        try {
          const response = await fetch(
            apiUrl(`/api/internal/${ENDPOINTS[entityType]}/${dbId}`),
            { method: 'DELETE', headers: apiHeaders() }
          )

          if (response.status === 409) {
            const result = await response.json()
            setDialog(
              result.error ??
                'This record still has dependents and cannot be deleted.'
            )
            return
          }

          if (!response.ok) {
            const result = await response.json().catch(() => ({}))
            setDialog(result.error ?? 'Failed to delete the database record.')
            return
          }

          deleteOp.execute()
          props.onComplete()
        } catch (error) {
          setDialog(
            error instanceof Error
              ? error.message
              : 'Network error while deleting.'
          )
        }
      },
      dialog: dialog
        ? {
            type: 'dialog' as const,
            onClose: () => setDialog(null),
            header: 'Cannot Delete',
            content: dialog,
          }
        : undefined,
    }
  }
}
