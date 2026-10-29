import type { StagedUpload } from './file-upload.types'

/** Body of `POST /profiles/me/avatar/upload-url`. */
export type AvatarUploadUrlRequest = {
  name: string
  size: number
}

export type AvatarUploadUrlResponse = {
  success: true
  upload: StagedUpload
}

/** Body of `POST /profiles/me/avatar`, once the file has been PUT to `upload`. */
export type AvatarUploadRequest = {
  stagingKey: string
}

/** `avatarUrl` is the stable public URL now stored on the profile. */
export type AvatarUploadResponse = {
  success: true
  avatarUrl: string
}
