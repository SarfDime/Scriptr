import AddCircle from '@sanity/icons/AddCircle'
import Sync from '@sanity/icons/Sync'
import Trash from '@sanity/icons/Trash'
import { useToast } from '@sanity/ui/toast'
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
    const toast = useToast()
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
      icon: AddCircle,
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

        if (entityType === 'professor') {
          const facultyReferences = Array.isArray(doc.faculties)
            ? doc.faculties
                .map((faculty) => refId(faculty))
                .filter((id): id is string => Boolean(id))
            : []
          const facultyIds = await client.fetch<Array<string>>(
            '*[_id in $ids || _id in $draftIds].dbId',
            {
              ids: facultyReferences,
              draftIds: facultyReferences.map((id) => `drafts.${id}`),
            }
          )
          body.faculty_ids = facultyIds.filter(Boolean)
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
          const professorReferences = Array.isArray(doc.professors)
            ? doc.professors
                .map((professor) => refId(professor))
                .filter((id): id is string => Boolean(id))
            : []
          const professorIds = await client.fetch<Array<string>>(
            '*[_id in $ids || _id in $draftIds].dbId',
            {
              ids: professorReferences,
              draftIds: professorReferences.map((id) => `drafts.${id}`),
            }
          )
          body.professor_ids = professorIds.filter(Boolean)
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
          toast.push({
            status: 'success',
            title: 'Successfully created in the database.',
          })
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

/** Syncs an already-linked academic document with the latest Sanity values. */
export function syncWithDatabaseAction(entityType: AcademicEntityType) {
  return function SyncWithDatabaseAction(props: AcademicDocumentActionProps) {
    const { patch } = useDocumentOperation(props.id, props.type)
    const client = useClient({ apiVersion: '2024-01-01' })
    const toast = useToast()
    const [dialog, setDialog] = useState<string | null>(null)
    const doc = props.draft ?? props.published
    const parentField = entityType === 'faculty' ? 'university' : 'faculty'
    const parentReference =
      entityType === 'faculty' || entityType === 'subject'
        ? refId(doc?.[parentField])
        : undefined

    return {
      label: 'Sync with Database',
      icon: Sync,
      disabled: Boolean(
        !doc?.dbId ||
          !doc?.name ||
          ((entityType === 'faculty' || entityType === 'subject') &&
            !parentReference)
      ),
      onHandle: async () => {
        if (!doc?.dbId) {
          setDialog('Create this record in the database before syncing.')
          return
        }

        if (!doc?.name) {
          setDialog('Set a name before syncing to the database.')
          return
        }

        if (
          (entityType === 'faculty' || entityType === 'subject') &&
          !parentReference
        ) {
          setDialog(`Add a ${parentField} before syncing this record.`)
          return
        }

        const body: Record<string, unknown> = {
          name: doc.name,
          sanity_id: publishedSanityId(props.id),
        }

        if (entityType === 'professor') {
          const facultyReferences = Array.isArray(doc.faculties)
            ? doc.faculties
                .map((faculty) => refId(faculty))
                .filter((id): id is string => Boolean(id))
            : []
          const facultyIds = await client.fetch<Array<string>>(
            '*[_id in $ids || _id in $draftIds].dbId',
            {
              ids: facultyReferences,
              draftIds: facultyReferences.map((id) => `drafts.${id}`),
            }
          )
          body.faculty_ids = facultyIds.filter(Boolean)
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
          const professorReferences = Array.isArray(doc.professors)
            ? doc.professors
                .map((professor) => refId(professor))
                .filter((id): id is string => Boolean(id))
            : []
          const professorIds = await client.fetch<Array<string>>(
            '*[_id in $ids || _id in $draftIds].dbId',
            {
              ids: professorReferences,
              draftIds: professorReferences.map((id) => `drafts.${id}`),
            }
          )
          body.professor_ids = professorIds.filter(Boolean)
        }

        if (
          (entityType === 'faculty' || entityType === 'subject') &&
          !body[parentField === 'university' ? 'university_id' : 'faculty_id']
        ) {
          setDialog(`Link the selected ${parentField} to the database first.`)
          return
        }

        try {
          const targetPath = doc?.dbId
            ? `/api/internal/${ENDPOINTS[entityType]}/${doc.dbId}/sync`
            : `/api/internal/${ENDPOINTS[entityType]}`

          const response = await fetch(apiUrl(targetPath), {
            method: 'POST',
            headers: apiHeaders(),
            body: JSON.stringify(body),
          })
          const result = await response.json()

          if (!response.ok) {
            setDialog(
              result.error ?? 'Failed to sync this document with the database.'
            )
            return
          }

          const record = result[entityType] ?? result
          if (record?.id && !doc?.dbId) {
            patch.execute([{ set: { dbId: record.id } }])
          }
          toast.push({
            status: 'success',
            title: 'Successfully synced with the database.',
          })
          props.onComplete()
        } catch (error) {
          setDialog(
            error instanceof Error
              ? error.message
              : 'Network error while syncing.'
          )
        }
      },
      dialog: dialog
        ? {
            type: 'dialog' as const,
            onClose: () => setDialog(null),
            header: 'Sync with Database',
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
      icon: Trash,
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
