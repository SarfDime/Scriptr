/** Whether an R2 (S3) error means "that object doesn't exist". */
export const isMissingObjectError = (error: unknown): boolean =>
  error instanceof Error &&
  (error.name === 'NotFound' || error.name === 'NoSuchKey')
