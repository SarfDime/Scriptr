export type AvatarFieldProps = {
  /** Seeds the initials fallback shown when there is no photo. */
  name: string
  avatarUrl: string | null
  /** The file picked for upload, if any. */
  file: File | null
  error: string | null
  disabled: boolean
  onSelect: (file: File | null) => void
}
