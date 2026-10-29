// Same as hono/src/sanity-stub.d.ts: satisfies the Sanity TypeGen module
// augmentation pulled in through @shared, so @sanity/client doesn't have to be
// installed in this workspace either.
declare module '@sanity/client' {
  export interface SanityQueries {
    [key: string]: unknown
  }
}
