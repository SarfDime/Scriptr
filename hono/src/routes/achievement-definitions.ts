import type { Context } from 'hono'
import { Hono } from 'hono'
import {
  ACHIEVEMENT_COPY,
  ACHIEVEMENT_METRICS,
  ACHIEVEMENT_RARITIES,
  getAchievementCopy,
  isAchievementMetric,
  isAchievementRarity,
} from '../../../shared/config/achievements'
import { PROFILE_CACHE_TAGS } from '../../../shared/config/cache-tags'
import type {
  AchievementDefinition,
  AchievementDefinitionMutationResponse,
  AchievementDefinitionPatch,
} from '../../../shared/types/achievements.types'
import {
  isValidAchievementId,
  isValidAchievementThreshold,
} from '../../../shared/utils/achievement-definition.utils'
import { isUuid } from '../../../shared/utils/slug.utils'
import { requireAdminAccess } from '../lib/admin-access'
import { revalidateCacheTags } from '../lib/cache-revalidate'
import {
  databaseErrorResponse,
  readJsonBody,
  requiredParam,
} from '../lib/request'
import { requireOwner } from '../lib/require-admin'
import { studyExists } from '../lib/study-access'
import { authMiddleware, createSupabaseClient } from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

/** The column-shaped subset a body describes; `studyId` is the API's name for
 * the scope, `study_id` is what the row stores. */
type DefinitionWrite = {
  metric?: AchievementDefinitionPatch['metric']
  rarity?: AchievementDefinitionPatch['rarity']
  threshold?: number
  study_id?: string | null
}

/**
 * Validates the editable fields present in a body. Absent fields are left out
 * (PATCH sends a subset; POST checks for the required ones afterwards). Title
 * and description are not editable here: they come from `ACHIEVEMENT_COPY`.
 */
function parseDefinitionFields(
  body: Record<string, unknown>
): { fields: DefinitionWrite } | { error: string } {
  const fields: DefinitionWrite = {}

  if ('metric' in body) {
    if (typeof body.metric !== 'string' || !isAchievementMetric(body.metric)) {
      return {
        error: `metric must be one of: ${ACHIEVEMENT_METRICS.join(', ')}`,
      }
    }
    fields.metric = body.metric
  }

  if ('rarity' in body) {
    if (typeof body.rarity !== 'string' || !isAchievementRarity(body.rarity)) {
      return {
        error: `rarity must be one of: ${ACHIEVEMENT_RARITIES.join(', ')}`,
      }
    }
    fields.rarity = body.rarity
  }

  if ('threshold' in body) {
    if (!isValidAchievementThreshold(body.threshold)) {
      return { error: 'threshold must be a whole number greater than 0' }
    }
    fields.threshold = body.threshold
  }

  if ('studyId' in body) {
    if (body.studyId === null) {
      fields.study_id = null
    } else if (typeof body.studyId === 'string' && isUuid(body.studyId)) {
      fields.study_id = body.studyId
    } else {
      return { error: 'studyId must be a study id, or null for platform-wide' }
    }
  }

  return { fields }
}

/** Map a definition write error to a clean HTTP response */
function definitionErrorResponse(
  c: Context<HonoEnv>,
  error: { code?: string; message: string }
) {
  switch (error.code) {
    case '23505':
      return c.json(
        { error: 'An achievement definition with this id already exists' },
        409
      )
    case '23503':
      return c.json(
        {
          error:
            'Cannot delete: users have already earned this achievement, and awards are permanent',
        },
        409
      )
    case '42501':
      return c.json({ error: 'Unauthorized: Admin access required' }, 403)
    case '23514':
      return c.json({ error: 'Invalid achievement definition' }, 400)
    default:
      return databaseErrorResponse(c, error)
  }
}

const achievementDefinitions = new Hono<HonoEnv>()

/* ---------------------------------------------------------------------- */
/* Achievement definitions — public read, admin-managed (is_admin() RLS)  */
/* ---------------------------------------------------------------------- */

/** List achievement definitions, grouped by metric then threshold */
achievementDefinitions.get('/', async (c) => {
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('achievement_definitions')
    .select('*')
    .order('metric', { ascending: true })
    .order('threshold', { ascending: true })
    .order('id', { ascending: true })

  if (error) return databaseErrorResponse(c, error)
  return c.json<Array<AchievementDefinition>>(data)
})

/** Create an achievement definition (admin only). `entity_type` is always 'profile'. */
achievementDefinitions.post(
  '/',
  authMiddleware,
  requireAdminAccess,
  async (c) => {
    const user = c.get('user')
    const supabase = createSupabaseClient(c)

    if (!(await requireOwner(supabase, user.id))) {
      return c.json({ error: 'Unauthorized: Admin access required' }, 403)
    }

    const body = await readJsonBody(c)

    if (!isValidAchievementId(body.id)) {
      return c.json(
        { error: 'id must be lowercase snake_case, 2-60 characters' },
        400
      )
    }

    if (!(body.id in ACHIEVEMENT_COPY)) {
      return c.json(
        {
          error:
            'Add this achievement to ACHIEVEMENT_COPY in shared/config/achievements.ts first: titles and descriptions are maintained in code',
        },
        400
      )
    }

    const parsed = parseDefinitionFields(body)
    if ('error' in parsed) return c.json({ error: parsed.error }, 400)

    const { metric, rarity, threshold, study_id: studyId } = parsed.fields
    if (!metric || !rarity || threshold === undefined) {
      return c.json(
        { error: 'id, metric, threshold and rarity are required' },
        400
      )
    }
    if (studyId && !(await studyExists(supabase, studyId))) {
      return c.json({ error: 'That study was not found' }, 400)
    }

    const { title, description } = getAchievementCopy(body.id)

    const { data, error } = await supabase
      .from('achievement_definitions')
      .insert({
        id: body.id,
        entity_type: 'profile',
        metric,
        threshold,
        title,
        description: description ?? null,
        rarity,
        study_id: studyId ?? null,
      })
      .select()
      .single()

    if (error) return definitionErrorResponse(c, error)

    return c.json<AchievementDefinitionMutationResponse>({
      success: true,
      achievement_definition: data,
    })
  }
)

/**
 * Update an achievement definition (admin only). Any of metric, threshold and
 * rarity; the id is immutable. Title and description are not patchable — they
 * come from the code catalogue, which is re-synced onto the row so the DB
 * fallback never lags behind it. Awards are permanent, so existing holders keep
 * theirs and users who newly qualify receive it on their next qualifying action.
 */
achievementDefinitions.patch(
  '/:id',
  authMiddleware,
  requireAdminAccess,
  async (c) => {
    const user = c.get('user')
    const id = requiredParam(c, 'id')
    const supabase = createSupabaseClient(c)

    if (!(await requireOwner(supabase, user.id))) {
      return c.json({ error: 'Unauthorized: Admin access required' }, 403)
    }

    const parsed = parseDefinitionFields(await readJsonBody(c))
    if ('error' in parsed) return c.json({ error: parsed.error }, 400)
    if (Object.keys(parsed.fields).length === 0) {
      return c.json(
        { error: 'Send at least one of metric, threshold, rarity or studyId' },
        400
      )
    }
    if (
      parsed.fields.study_id &&
      !(await studyExists(supabase, parsed.fields.study_id))
    ) {
      return c.json({ error: 'That study was not found' }, 400)
    }

    const copy = ACHIEVEMENT_COPY[id]
    const update = copy ? { ...parsed.fields, ...copy } : parsed.fields

    const { data, error } = await supabase
      .from('achievement_definitions')
      .update(update)
      .eq('id', id)
      .select()
      .maybeSingle()

    if (error) return definitionErrorResponse(c, error)
    if (!data) return c.json({ error: 'Achievement definition not found' }, 404)

    // Cached public profiles embed the title, description and rarity.
    await revalidateCacheTags(c.env, [PROFILE_CACHE_TAGS.public()])

    return c.json<AchievementDefinitionMutationResponse>({
      success: true,
      achievement_definition: data,
    })
  }
)

/** Delete an achievement definition (admin only) — blocked by the FK once anyone has earned it */
achievementDefinitions.delete(
  '/:id',
  authMiddleware,
  requireAdminAccess,
  async (c) => {
    const user = c.get('user')
    const id = requiredParam(c, 'id')
    const supabase = createSupabaseClient(c)

    if (!(await requireOwner(supabase, user.id))) {
      return c.json({ error: 'Unauthorized: Admin access required' }, 403)
    }

    const { data, error } = await supabase
      .from('achievement_definitions')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle()

    if (error) return definitionErrorResponse(c, error)
    if (!data) return c.json({ error: 'Achievement definition not found' }, 404)

    await revalidateCacheTags(c.env, [PROFILE_CACHE_TAGS.public()])

    return c.json({
      success: true,
      message: 'Achievement definition deleted successfully',
    })
  }
)

export default achievementDefinitions
