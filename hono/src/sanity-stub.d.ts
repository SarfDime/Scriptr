// This satisfies the Sanity TypeGen module augmentation from the Next.js workspace
// so we don't have to install @sanity/client in the Hono API workspace.
declare module '@sanity/client' {
  export interface SanityQueries {
    [key: string]: unknown
  }
}
