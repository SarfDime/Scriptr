import type { Context } from 'hono'
import { Hono } from 'hono'
import {
  revalidateScriptTags,
  scriptMutationTags,
} from '../lib/cache-revalidate'
import { requiredParam } from '../lib/request'
import {
  authMiddleware,
  createInternalSupabaseClient,
  createSupabaseClient,
} from '../lib/supabase'
import type { HonoEnv } from '../types/env.types'

const scripts = new Hono<HonoEnv>()

// Excludes is_flagged, which is internal moderation state and not for public consumption.
const PUBLIC_SCRIPT_COLUMNS =
  'id, title, description, file_url, file_type, subject_id, professor_id, faculty_id, author_id, vote_score, download_count, created_at, updated_at'

/** Resolve the requester's dedupe identity for downloads: account, then IP, then device. */
async function resolveDownloadIdentity(c: Context<HonoEnv>) {
  const supabase = createSupabaseClient(c)
  const { data: sessionData } = await supabase.auth.getUser()
  const ipAddress =
    c.req.header('cf-connecting-ip') ??
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    c.req.header('x-real-ip') ??
    null
  const deviceId = c.req.header('x-device-id') ?? null

  let identityKey: string | null = null
  if (sessionData.user) {
    identityKey = `account:${sessionData.user.id}`
  } else if (ipAddress) {
    identityKey = `ip:${ipAddress}`
  } else if (deviceId) {
    identityKey = `device:${deviceId}`
  }

  return {
    userId: sessionData.user?.id ?? null,
    ipAddress,
    deviceId,
    identityKey,
  }
}

async function getSelectedFacultyScope(
  supabase: ReturnType<typeof createSupabaseClient>
) {
  const { data: sessionData } = await supabase.auth.getUser()

  if (!sessionData.user) {
    return null
  }

  const { data } = await supabase
    .from('profile_faculties')
    .select('faculty_id')
    .eq('profile_id', sessionData.user.id)

  return data?.map(({ faculty_id }) => faculty_id) ?? []
}

function fuzzyScore(query: string, value: string) {
  const normalizedQuery = query.toLowerCase().trim()
  const normalizedValue = value.toLowerCase()

  if (normalizedValue.includes(normalizedQuery)) return 1

  const queryWords = normalizedQuery.split(/\s+/)
  const valueWords = normalizedValue.split(/[^a-z0-9]+/).filter(Boolean)
  const wordScores = queryWords.map((queryWord) => {
    const bestDistance = Math.min(
      ...valueWords.map((valueWord) =>
        levenshteinDistance(queryWord, valueWord)
      )
    )
    const length = Math.max(queryWord.length, 1)
    return 1 - bestDistance / length
  })

  return (
    wordScores.reduce((total, score) => total + score, 0) / wordScores.length
  )
}

function levenshteinDistance(left: string, right: string) {
  const previousRow = Array.from(
    { length: right.length + 1 },
    (_, index) => index
  )

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const currentRow = [leftIndex]

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      currentRow[rightIndex] = Math.min(
        (currentRow[rightIndex - 1] ?? leftIndex) + 1,
        (previousRow[rightIndex] ?? rightIndex) + 1,
        (previousRow[rightIndex - 1] ?? rightIndex - 1) +
          (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1)
      )
    }

    previousRow.splice(0, previousRow.length, ...currentRow)
  }

  return previousRow[right.length] ?? right.length
}

/** Get all scripts (public) */
scripts.get('/', async (c) => {
  const supabase = createSupabaseClient(c)
  const selectedFacultyIds = await getSelectedFacultyScope(supabase)

  let query = supabase
    .from('scripts')
    .select(`
      ${PUBLIC_SCRIPT_COLUMNS},
      author:profiles(username, full_name),
      subject:subjects(name, year, exam_session, faculty:faculties(id, name, university:universities(id, name))),
      faculty:faculties(id, name, university:universities(id, name))
    `)
    .order('created_at', { ascending: false })

  if (selectedFacultyIds && selectedFacultyIds.length > 0) {
    query = query.in('faculty_id', selectedFacultyIds)
  }

  const { data, error } = await query

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

/** Get scripts by subject */
scripts.get('/subject/:subjectId', async (c) => {
  const subjectId = requiredParam(c, 'subjectId')
  const supabase = createSupabaseClient(c)
  const selectedFacultyIds = await getSelectedFacultyScope(supabase)

  let query = supabase
    .from('scripts')
    .select(`
      ${PUBLIC_SCRIPT_COLUMNS},
      author:profiles(username, full_name),
      subject:subjects(name, year, exam_session, faculty:faculties(id, name, university:universities(id, name))),
      faculty:faculties(id, name, university:universities(id, name))
    `)
    .eq('subject_id', subjectId)
    .order('vote_score', { ascending: false })

  if (selectedFacultyIds && selectedFacultyIds.length > 0) {
    query = query.in('faculty_id', selectedFacultyIds)
  }

  const { data, error } = await query

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

/** Get top scripts (by vote score) */
scripts.get('/top', async (c) => {
  const limit = parseInt(c.req.query('limit') || '10', 10)
  const supabase = createSupabaseClient(c)
  const selectedFacultyIds = await getSelectedFacultyScope(supabase)

  let query = supabase
    .from('scripts')
    .select(`
      ${PUBLIC_SCRIPT_COLUMNS},
      author:profiles(username, full_name),
      subject:subjects(name, year, faculty:faculties(id, name, university:universities(id, name))),
      faculty:faculties(id, name, university:universities(id, name))
    `)
    .order('vote_score', { ascending: false })
    .limit(limit)

  if (selectedFacultyIds && selectedFacultyIds.length > 0) {
    query = query.in('faculty_id', selectedFacultyIds)
  }

  const { data, error } = await query

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

/** Get most downloaded scripts */
scripts.get('/popular', async (c) => {
  const limit = parseInt(c.req.query('limit') || '10', 10)
  const supabase = createSupabaseClient(c)
  const selectedFacultyIds = await getSelectedFacultyScope(supabase)

  let query = supabase
    .from('scripts')
    .select(`
      ${PUBLIC_SCRIPT_COLUMNS},
      author:profiles(username, full_name),
      subject:subjects(name, year, faculty:faculties(id, name, university:universities(id, name))),
      faculty:faculties(id, name, university:universities(id, name))
    `)
    .order('download_count', { ascending: false })
    .limit(limit)

  if (selectedFacultyIds && selectedFacultyIds.length > 0) {
    query = query.in('faculty_id', selectedFacultyIds)
  }

  const { data, error } = await query

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

/** Search scripts */
scripts.get('/search', async (c) => {
  const queryParam = c.req.query('q')
  const supabase = createSupabaseClient(c)

  if (!queryParam) {
    return c.json({ error: 'Search query is required' }, 400)
  }

  let query = supabase.from('scripts').select(`
      ${PUBLIC_SCRIPT_COLUMNS},
      author:profiles(username, full_name),
      subject:subjects(name, year, faculty:faculties(id, name, university:universities(id, name))),
      faculty:faculties(id, name, university:universities(id, name))
    `)
  const selectedFacultyIds = await getSelectedFacultyScope(supabase)

  if (selectedFacultyIds && selectedFacultyIds.length > 0) {
    query = query.in('faculty_id', selectedFacultyIds)
  }

  const { data, error } = await query

  if (error) return c.json({ error: error.message }, 500)

  const results = data
    .map((script) => ({
      script,
      score: Math.max(
        fuzzyScore(queryParam, script.title),
        fuzzyScore(queryParam, script.description ?? '')
      ),
    }))
    .filter(({ score }) => score >= 0.45)
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.script.vote_score - left.script.vote_score
    )
    .map(({ script }) => script)

  return c.json(results)
})

/** Get a single script by ID */
scripts.get('/:id', async (c) => {
  const scriptId = requiredParam(c, 'id')
  const supabase = createSupabaseClient(c)

  const selectedFacultyIds = await getSelectedFacultyScope(supabase)

  const { data, error } = await supabase
    .from('scripts')
    .select(`
      ${PUBLIC_SCRIPT_COLUMNS},
      author:profiles(username, full_name),
      subject:subjects(name, year, exam_session, faculty:faculties(id, name, university:universities(id, name))),
      faculty:faculties(id, name, university:universities(id, name))
    `)
    .eq('id', scriptId)
    .single()

  if (error) return c.json({ error: error.message }, 404)

  if (
    selectedFacultyIds &&
    selectedFacultyIds.length > 0 &&
    data.faculty_id &&
    !selectedFacultyIds.includes(data.faculty_id)
  ) {
    return c.json(
      { error: 'Script not available in your selected faculties' },
      404
    )
  }

  return c.json(data)
})

/** Insert a new script */
scripts.post('/', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)

  const body = await c.req.json()
  const title = body.title
  const description = body.description ?? ''
  const fileKey = body.fileKey ?? body.file_url
  const subjectId = body.subject_id ?? body.subjectId
  const professorId = body.professor_id ?? body.professorId
  const facultyId = body.faculty_id ?? body.facultyId
  const fileType = body.fileType ?? body.file_type

  if (
    !title ||
    !subjectId ||
    !professorId ||
    !fileKey ||
    !fileType ||
    !facultyId
  ) {
    return c.json(
      {
        error:
          'title, subjectId, professorId, facultyId, fileKey, and fileType are required',
      },
      400
    )
  }

  if (!['pdf', 'jpg', 'jpeg', 'png', 'webp'].includes(fileType)) {
    return c.json({ error: 'Unsupported file type' }, 400)
  }

  const { data, error } = await supabase
    .from('scripts')
    .insert({
      title,
      description,
      file_url: fileKey,
      file_type: fileType || 'pdf',
      subject_id: subjectId,
      professor_id: professorId,
      faculty_id: facultyId,
      author_id: user.id,
      vote_score: 0,
      download_count: 0,
    })
    .select(`
      *,
      author:profiles(username, full_name),
      subject:subjects(name, year, faculty:faculties(id, name, university:universities(id, name))),
      faculty:faculties(id, name, university:universities(id, name))
    `)
    .single()

  if (error) {
    return c.json({ error: 'Failed to save script record' }, 500)
  }

  await revalidateScriptTags(c.env, scriptMutationTags(data))

  return c.json({
    success: true,
    script: data,
    message: 'Script uploaded successfully',
  })
})

/** Update a script (only by author or moderator) */
scripts.patch('/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const scriptId = requiredParam(c, 'id')
  const supabase = createSupabaseClient(c)

  const { title, description } = await c.req.json()

  // Get the script and user's role
  const [{ data: script }, { data: profile }] = await Promise.all([
    supabase.from('scripts').select('author_id').eq('id', scriptId).single(),
    supabase.from('profiles').select('role').eq('id', user.id).single(),
  ])

  // Check if user is author or moderator
  if (script?.author_id !== user.id && profile?.role !== 'moderator') {
    return c.json(
      { error: 'Unauthorized: You can only edit your own scripts' },
      403
    )
  }

  const { data, error } = await supabase
    .from('scripts')
    .update({
      title,
      description,
      updated_at: new Date().toISOString(),
    })
    .eq('id', scriptId)
    .select(`
      *,
      author:profiles(username, full_name),
      subject:subjects(name, year)
    `)
    .single()

  if (error) return c.json({ error: error.message }, 500)

  await revalidateScriptTags(c.env, scriptMutationTags(data))

  return c.json({ success: true, script: data })
})

/** Delete a script (only by author or moderator) */
scripts.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const scriptId = requiredParam(c, 'id')
  const supabase = createSupabaseClient(c)

  // Get the script and user's role
  const [{ data: script }, { data: profile }] = await Promise.all([
    supabase
      .from('scripts')
      .select('author_id, file_url, subject_id')
      .eq('id', scriptId)
      .single(),
    supabase.from('profiles').select('role').eq('id', user.id).single(),
  ])

  // Check if user is author or moderator
  if (script?.author_id !== user.id && profile?.role !== 'moderator') {
    return c.json(
      { error: 'Unauthorized: You can only delete your own scripts' },
      403
    )
  }

  const { error } = await supabase.from('scripts').delete().eq('id', scriptId)

  if (error) return c.json({ error: error.message }, 500)

  if (script?.subject_id) {
    await revalidateScriptTags(
      c.env,
      scriptMutationTags({ id: scriptId, subject_id: script.subject_id })
    )
  }

  // Note: You might want to also delete the actual file from storage here
  // Example: await supabase.storage.from('scripts').remove([script.file_url])

  return c.json({ success: true, message: 'Script deleted successfully' })
})

/** Get all scripts for a user */
scripts.get('/my-scripts', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('scripts')
    .select(`
      *,
      subject:subjects(name, year)
    `)
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ scripts: data })
})

/** Record a download, deduplicated per identity (account, then IP, then device) */
scripts.post('/:id/download', async (c) => {
  const scriptId = requiredParam(c, 'id')
  const supabase = createInternalSupabaseClient(c)

  const { data: script } = await supabase
    .from('scripts')
    .select('download_count')
    .eq('id', scriptId)
    .single()

  if (!script) {
    return c.json({ error: 'Script not found' }, 404)
  }

  const { userId, ipAddress, deviceId, identityKey } =
    await resolveDownloadIdentity(c)

  // Without any identity signal we can't dedupe, so just count every request.
  if (!identityKey) {
    const { error } = await supabase
      .from('scripts')
      .update({ download_count: (script.download_count || 0) + 1 })
      .eq('id', scriptId)

    if (error) return c.json({ error: error.message }, 500)
    return c.json({ success: true, counted: true })
  }

  const { error: insertError } = await supabase.from('download_events').insert({
    script_id: scriptId,
    user_id: userId,
    ip_address: ipAddress,
    device_id: deviceId,
    identity_key: identityKey,
  })

  // A unique violation means this identity already downloaded the script.
  if (insertError) {
    if (insertError.code === '23505') {
      return c.json({ success: true, counted: false })
    }
    return c.json({ error: insertError.message }, 500)
  }

  const { error: updateError } = await supabase
    .from('scripts')
    .update({ download_count: (script.download_count || 0) + 1 })
    .eq('id', scriptId)

  if (updateError) return c.json({ error: updateError.message }, 500)
  return c.json({ success: true, counted: true })
})

/** Get flagged scripts (moderator only) */
scripts.get('/flagged/all', authMiddleware, async (c) => {
  const user = c.get('user')
  const supabase = createSupabaseClient(c)

  // Check if user is moderator
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'moderator') {
    return c.json({ error: 'Unauthorized: Moderator access required' }, 403)
  }

  const { data, error } = await supabase
    .from('scripts')
    .select(`
      *,
      author:profiles(username, full_name),
      subject:subjects(name, year),
      flags:flags(
        *,
        reporter:profiles!reporter_id(username)
      )
    `)
    .eq('is_flagged', true)
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

export default scripts
