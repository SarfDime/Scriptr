import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

export async function getSelectedFacultyIds(
  supabase: SupabaseClient<Database>,
  userId?: string | null
): Promise<Array<string>> {
  let resolvedUserId: string | null = userId || null

  if (!resolvedUserId) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return []
    }

    resolvedUserId = user.id
  }

  const { data, error } = await supabase
    .from('profile_faculties')
    .select('faculty_id')
    .eq('profile_id', resolvedUserId)

  if (error) {
    throw error
  }

  return data?.map(({ faculty_id }) => faculty_id) ?? []
}
