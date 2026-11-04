import AddCircle from '@sanity/icons/AddCircle'
import Sync from '@sanity/icons/Sync'
import Trash from '@sanity/icons/Trash'
import { useToast } from '@sanity/ui/toast'
import type { AcademicEntityType } from '@shared/config/api'
import { apiUrl, getDatabaseAcademicEndpoints } from '@shared/utils/api.utils'

import { useState } from 'react'
import {
  type DocumentActionComponent,
  type DocumentActionDescription,
  type DocumentActionProps,
  type SanityClient,
  useClient,
  useDocumentOperation,
} from 'sanity'
import { AccessCodeForm } from '../components/AccessCodeForm'
import {
  adminFetch,
  hasValidAccessToken,
  STUDIO_API_URL,
} from '../lib/api-access'

export type AcademicDocumentActionProps = {
  id: string
  type: string
  draft: Record<string, unknown> | null
  published: Record<string, unknown> | null
  onComplete: () => void
}

type DialogState =
  | { type: 'none' }
  /** `access` means the action is confirmed but the ten-minute token is missing
   * or spent, so the code is collected before the request goes out. */
  | {
      type: 'confirm' | 'access'
      message: string
      onConfirm: () => void
    }
  | { type: 'error'; message: string }

/** Confirms an action, inserting the access-code step only when a token is
 * missing or spent. */
function confirmAction(
  setDialogState: (state: DialogState) => void,
  message: string,
  onConfirm: () => void
) {
  setDialogState({
    type: hasValidAccessToken() ? 'confirm' : 'access',
    message,
    onConfirm,
  })
}

function refId(value: unknown): string | undefined {
  return value &&
    typeof value === 'object' &&
    '_ref' in (value as Record<string, unknown>)
    ? (value as { _ref: string })._ref
    : undefined
}

function parentFieldFor(entityType: AcademicEntityType): string | undefined {
  switch (entityType) {
    case 'faculty':
      return 'university'
    case 'subject':
      return 'study'
    case 'study':
      return 'faculty'
    case 'professor':
    case 'university':
      return undefined
    default: {
      // biome-ignore lint/style/useNamingConvention: <Might need here>
      const _exhaustive: never = entityType
      throw new Error(`Unhandled entity type: ${_exhaustive}`)
    }
  }
}

function parentColumnFor(parentField: string | undefined): string | undefined {
  switch (parentField) {
    case 'university':
      return 'university_id'
    case 'study':
      return 'study_id'
    case 'faculty':
      return 'faculty_id'
    case undefined:
      return undefined
    default:
      throw new Error(`Unhandled parent field: ${parentField}`)
  }
}

/**
 * Shared helper to build the relational Postgres payload
 */
async function buildDatabasePayload(
  entityType: AcademicEntityType,
  doc: Record<string, unknown> | null,
  sanityId: string,
  client: SanityClient
): Promise<Record<string, unknown>> {
  if (!doc?.name) {
    throw new Error('Set a name before linking to the database.')
  }

  const parentField = parentFieldFor(entityType)
  const parentReference = parentField ? refId(doc?.[parentField]) : undefined

  if (parentField && !parentReference) {
    throw new Error(`Add a ${parentField} before syncing this record.`)
  }

  const body: Record<string, unknown> = {
    name: doc.name,
    sanity_id: sanityId,
  }

  const fetchDbIds = async (refs: unknown) => {
    const references = Array.isArray(refs)
      ? refs.map(refId).filter((id): id is string => Boolean(id))
      : []
    if (!references.length) return []
    return client.fetch<Array<string>>(
      '*[_id in $ids || _id in $draftIds].dbId',
      { ids: references, draftIds: references.map((id) => `drafts.${id}`) }
    )
  }

  const fetchParentDbId = async (refId: string | undefined) => {
    if (!refId) return null
    return client.fetch<string | null>(
      '*[_id == $id || _id == $draftId][0].dbId',
      { id: refId, draftId: `drafts.${refId}` }
    )
  }

  if (entityType === 'professor') {
    body.faculty_ids = (await fetchDbIds(doc.faculties)).filter(Boolean)
    body.study_ids = (await fetchDbIds(doc.studies)).filter(Boolean)
  } else if (entityType === 'faculty') {
    body.university_id = await fetchParentDbId(parentReference)
  } else if (entityType === 'subject') {
    body.study_id = await fetchParentDbId(parentReference)
    body.professor_ids = (await fetchDbIds(doc.professors)).filter(Boolean)
  } else if (entityType === 'study') {
    body.faculty_id = await fetchParentDbId(parentReference)
  } else if (entityType === 'university') {
    if (doc.r2BucketId && typeof doc.r2BucketId === 'string') {
      body.r2_bucket_id = doc.r2BucketId
    }
  }

  const parentCol = parentColumnFor(parentField)
  if (parentCol && !body[parentCol]) {
    throw new Error(`Link the selected ${parentField} to the database first.`)
  }

  return body
}

/**
 * Checks for a dbId to ensure the row exists before allowing publish
 */
export function createCheckedPublishAction(
  originalAction: DocumentActionComponent
): DocumentActionComponent {
  return function CreateCheckedPublishAction(
    props: DocumentActionProps
  ): DocumentActionDescription | null {
    const originalResult = originalAction(props)

    const doc = props.draft ?? props?.published

    if (!originalResult) return null

    return {
      ...originalResult,
      disabled: Boolean(!doc?.dbId || originalResult?.disabled),
      label: 'Publish',
      tone: 'positive',
    }
  }
}

/**
 * Creates a brand new Postgres row for the sanity document
 */
export function createInDatabaseAction(entityType: AcademicEntityType) {
  return function CreateInDatabaseAction(
    props: AcademicDocumentActionProps
  ): DocumentActionDescription | null {
    const { patch } = useDocumentOperation(props.id, props.type)
    const client = useClient({ apiVersion: '2024-01-01' })
    const toast = useToast()
    const [dialogState, setDialogState] = useState<DialogState>({
      type: 'none',
    })
    const doc = props.draft ?? props.published

    if (doc?.dbId) return null

    const endpoints = getDatabaseAcademicEndpoints(entityType)
    const endpoint = apiUrl(endpoints.create, STUDIO_API_URL)

    const handleConfirm = async () => {
      setDialogState({ type: 'none' })
      try {
        const body = await buildDatabasePayload(
          entityType,
          doc,
          props.id,
          client
        )
        const response = await adminFetch(endpoint, {
          method: 'POST',
          body: JSON.stringify(body),
        })
        const result = await response.json()

        if (!response.ok) {
          throw new Error(
            result.error ?? 'Failed to link this document to the database.'
          )
        }

        const record = result[entityType] ?? result
        patch.execute([{ set: { dbId: record.id } }])
        toast.push({
          status: 'success',
          title: 'Successfully created in the database.',
        })
        props.onComplete()
      } catch (error) {
        setDialogState({
          type: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Network error while linking.',
        })
      }
    }

    return {
      label: 'Create in Database',
      icon: AddCircle,
      tone: 'caution',
      disabled: !doc?.name || Boolean(doc?.dbId),
      onHandle: () =>
        confirmAction(
          setDialogState,
          'Are you sure you want to create a new database record for this document?',
          handleConfirm
        ),
      dialog: renderDialog(dialogState, setDialogState, 'Create in Database'),
    }
  }
}

/**
 * Syncs an already-linked academic document with the latest Sanity values
 */
export function syncWithDatabaseAction(entityType: AcademicEntityType) {
  return function SyncWithDatabaseAction(
    props: AcademicDocumentActionProps
  ): DocumentActionDescription | null {
    const client = useClient({ apiVersion: '2024-01-01' })
    const toast = useToast()
    const [dialogState, setDialogState] = useState<DialogState>({
      type: 'none',
    })
    const doc = props.draft ?? props.published
    const dbId = doc?.dbId

    if (!dbId) return null

    const endpoints = getDatabaseAcademicEndpoints(entityType)
    const endpoint = apiUrl(endpoints.sync(String(dbId)), STUDIO_API_URL)

    const handleConfirm = async () => {
      setDialogState({ type: 'none' })
      try {
        const body = await buildDatabasePayload(
          entityType,
          doc as Record<string, unknown>,
          props.id,
          client
        )
        const response = await adminFetch(endpoint, {
          method: 'POST',
          body: JSON.stringify(body),
        })
        const result = await response.json()

        if (!response.ok) {
          throw new Error(
            result.error ?? 'Failed to sync this document with the database.'
          )
        }

        toast.push({
          status: 'success',
          title: 'Successfully synced with the database.',
        })
        props.onComplete()
      } catch (error) {
        setDialogState({
          type: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Network error while syncing.',
        })
      }
    }

    return {
      label: 'Sync with Database',
      icon: Sync,
      tone: 'caution',
      disabled: !doc?.name || !doc?.dbId,
      onHandle: () =>
        confirmAction(
          setDialogState,
          'Are you sure you want to sync your recent changes to the database?',
          handleConfirm
        ),
      dialog: renderDialog(dialogState, setDialogState, 'Sync with Database'),
    }
  }
}

/**
 * Checks dependents before deleting a record from Postgres
 */
export function createCheckedDeleteAction(entityType: AcademicEntityType) {
  return function CheckedDeleteAction(
    props: AcademicDocumentActionProps
  ): DocumentActionDescription {
    const { delete: deleteOp } = useDocumentOperation(props.id, props.type)
    const toast = useToast()
    const [dialogState, setDialogState] = useState<DialogState>({
      type: 'none',
    })
    const doc = props.draft ?? props.published
    const dbId = doc?.dbId

    const handleConfirm = async () => {
      setDialogState({ type: 'none' })

      if (!dbId) {
        deleteOp.execute()
        props.onComplete()
        return
      }

      const endpoints = getDatabaseAcademicEndpoints(entityType)
      const endpoint = apiUrl(endpoints.byId(String(dbId)), STUDIO_API_URL)

      try {
        const response = await adminFetch(endpoint, { method: 'DELETE' })

        if (response.status === 409) {
          const result = await response.json()
          throw new Error(
            result.error ??
              'This record still has dependents and cannot be deleted.'
          )
        }

        if (!response.ok) {
          const result = await response.json().catch(() => ({}))
          throw new Error(
            result.error ?? 'Failed to delete the database record.'
          )
        }

        deleteOp.execute()
        toast.push({
          status: 'success',
          title: 'Successfully deleted from Sanity and the database.',
        })
        props.onComplete()
      } catch (error) {
        setDialogState({
          type: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Network error while deleting.',
        })
      }
    }

    return {
      label: 'Delete',
      icon: Trash,
      disabled: Boolean(deleteOp.disabled),
      tone: 'critical',
      onHandle: () =>
        // Only a linked document reaches the API, so an unlinked one is deleted
        // without asking for a code.
        dbId
          ? confirmAction(
              setDialogState,
              'Are you sure you want to delete this document? It will also be removed from the linked database.',
              handleConfirm
            )
          : setDialogState({
              type: 'confirm',
              message: 'Are you sure you want to delete this document?',
              onConfirm: handleConfirm,
            }),
      dialog: renderDialog(dialogState, setDialogState, 'Cannot Delete'),
    }
  }
}

/**
 * Deletes the record from the Postgres database but keeps the Sanity document.
 * If successful, removes the `dbId` from the Sanity document.
 */
export function createDeleteInDatabaseAction(
  entityType: AcademicEntityType
): DocumentActionComponent {
  return function DeleteInDatabaseAction(
    props: DocumentActionProps
  ): DocumentActionDescription | null {
    const { patch } = useDocumentOperation(props.id, props.type)
    const toast = useToast()
    const [dialogState, setDialogState] = useState<DialogState>({
      type: 'none',
    })

    const doc = (props.draft ?? props.published) as Record<
      string,
      unknown
    > | null
    const dbId = doc?.dbId

    if (!dbId) return null

    const handleConfirm = async () => {
      setDialogState({ type: 'none' })

      const endpoints = getDatabaseAcademicEndpoints(entityType)
      const endpoint = apiUrl(endpoints.byId(String(dbId)), STUDIO_API_URL)

      try {
        const response = await adminFetch(endpoint, { method: 'DELETE' })

        // Handle dependents conflict
        if (response.status === 409) {
          const result = await response.json()
          throw new Error(
            result.error ??
              'This record still has dependents and cannot be deleted from the database.'
          )
        }

        if (!response.ok) {
          const result = await response.json().catch(() => ({}))
          throw new Error(
            result.error ?? 'Failed to delete the database record.'
          )
        }

        // Unset the dbId from the Sanity document
        patch.execute([{ unset: ['dbId'] }])

        toast.push({
          status: 'success',
          title: 'Successfully deleted from database. Sanity document kept.',
        })
        props.onComplete()
      } catch (error) {
        setDialogState({
          type: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Network error while deleting.',
        })
      }
    }

    return {
      label: 'Delete in Database',
      icon: Trash,
      tone: 'critical',
      onHandle: () =>
        confirmAction(
          setDialogState,
          'Are you sure you want to delete this record from the Postgres database? The Sanity document will NOT be deleted.',
          handleConfirm
        ),
      dialog: renderDialog(
        dialogState,
        setDialogState,
        'Cannot Delete in Database'
      ),
    }
  }
}

/**
 * Shared helper to format Sanity Dialog outputs
 */
function renderDialog(
  state: DialogState,
  setState: (s: DialogState) => void,
  errorHeader: string
) {
  if (state.type === 'confirm') {
    return {
      type: 'confirm' as const,
      message: state.message,
      onConfirm: state.onConfirm,
      onCancel: () => setState({ type: 'none' }),
    }
  }
  if (state.type === 'access') {
    return {
      type: 'dialog' as const,
      header: 'Access code required',
      content: (
        <AccessCodeForm
          message={state.message}
          onCancel={() => setState({ type: 'none' })}
          onAuthorized={() => {
            setState({ type: 'none' })
            state.onConfirm()
          }}
        />
      ),
      onClose: () => setState({ type: 'none' }),
    }
  }
  if (state.type === 'error') {
    return {
      type: 'dialog' as const,
      header: errorHeader,
      content: state.message,
      onClose: () => setState({ type: 'none' }),
    }
  }
  return undefined
}
