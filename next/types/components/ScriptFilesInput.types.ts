import type { FieldProps } from '@/components/ui/field/Field'

export type FileWithError = { file: File; error: string | null }

export type ScriptFilesInputProps = {
  files: Array<FileWithError>
  disabled: boolean
  /** Optional hint rendered under the dropzone. */
  note?: string
  onAdd: (files: FileList | null) => void
  onRemove: (index: number) => void
  fieldProps?: Omit<FieldProps, 'valid' | 'invalid'>
}
