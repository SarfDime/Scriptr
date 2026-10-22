/**
 * The catalog entry whose Postgres id is `dbId`. Catalog entries are keyed
 * by Sanity `_id`; profiles and the API speak Postgres ids, so lookups from
 * account data go through `dbId`. Undefined for a missing id, so an entry
 * that was never synced to the database (no `dbId`) can't match by accident.
 */
export const findByDbId = <T extends { dbId?: string }>(
  items: ReadonlyArray<T>,
  dbId: string | undefined
) => (dbId ? items.find((item) => item.dbId === dbId) : undefined)
