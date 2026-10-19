import { Hono } from 'hono'
import { profileMutationTags } from '../../../shared/config/cache-tags'
import type { FavoriteScriptRecord } from '../../../shared/types/profile.types'
import { revalidateCacheTags } from '../lib/cache-revalidate'
import { databaseErrorResponse, requiredParam } from '../lib/request'
import {
  authMiddleware,
  createInternalSupabaseClient,
  createSupabaseClient,
} from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

// Mirrors scripts.ts PUBLIC_SCRIPT_COLUMNS — excludes is_flagged (internal moderation state).
const PUBLIC_SCRIPT_COLUMNS =
  'id, title, description, subject_id, professor_id, author_id, exam_session, additional_reading, vote_score, download_count, created_at, updated_at, files:script_files(id, file_url, file_type, file_size_bytes, bucket, position, file_name, created_at)'

const favorites = new Hono<HonoEnv>()

favorites.use('*', authMiddleware)

/** List the current user's favorite scripts */
favorites.get('/', async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)
  const { data, error } = await supabase
    .from('script_favorites')
    .select(`created_at, script:scripts(${PUBLIC_SCRIPT_COLUMNS})`)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return databaseErrorResponse(c, error)
  return c.json<Array<FavoriteScriptRecord>>(data ?? [])
})

/** Get the current user's favorite record for a script, or null */
favorites.get('/:scriptId', async (c) => {
  const user = c.get('user')
  const scriptId = requiredParam(c, 'scriptId')
  const supabase = createSupabaseClient(c)
  const { data, error } = await supabase
    .from('script_favorites')
    .select(`created_at, script:scripts(${PUBLIC_SCRIPT_COLUMNS})`)
    .eq('user_id', user.id)
    .eq('script_id', scriptId)
    .maybeSingle()

  if (error) return databaseErrorResponse(c, error)
  return c.json<FavoriteScriptRecord | null>(data)
})

/** Add a script to the current user's favorites (idempotent) */
favorites.post('/:scriptId', async (c) => {
  const user = c.get('user')
  const scriptId = requiredParam(c, 'scriptId')
  const supabase = createInternalSupabaseClient(c)
  const { data, error } = await supabase
    .from('script_favorites')
    .upsert(
      { user_id: user.id, script_id: scriptId },
      { onConflict: 'user_id,script_id' }
    )
    .select(`created_at, script:scripts(${PUBLIC_SCRIPT_COLUMNS})`)
    .single()

  if (error) return databaseErrorResponse(c, error)
  await revalidateCacheTags(c.env, profileMutationTags(user.id))
  return c.json<FavoriteScriptRecord>(data)
})

/** Remove a script from the current user's favorites */
favorites.delete('/:scriptId', async (c) => {
  const user = c.get('user')
  const scriptId = requiredParam(c, 'scriptId')
  const supabase = createSupabaseClient(c)
  const { error } = await supabase
    .from('script_favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('script_id', scriptId)

  if (error) return databaseErrorResponse(c, error)
  await revalidateCacheTags(c.env, profileMutationTags(user.id))
  return c.json<{ success: true }>({ success: true })
})

export default favorites
