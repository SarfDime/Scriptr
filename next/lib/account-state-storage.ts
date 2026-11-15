'use client'

import { isProfilePreferences } from '@shared/config/profile-preferences'
import type { ProfilePreferences } from '@shared/types/profile-preferences.types'
import type { MyRestriction } from '@shared/types/restrictions.types'

const PREFIX = 'scriptr:account-state'

const preferencesKey = (userId: string) => `${PREFIX}:preferences:${userId}`
const restrictionKey = (userId: string) => `${PREFIX}:restriction:${userId}`

/** The caller's restriction as last read from the API (`null` = none), plus
 * the newest restriction notification that was known at that moment. A
 * different newest id later means the restriction changed server-side. */
export type CachedRestriction = {
  restriction: MyRestriction
  moderationId: string | null
}

const read = (key: string): unknown => {
  if (typeof window === 'undefined') return undefined
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : undefined
  } catch {
    return undefined
  }
}

const write = (key: string, value: unknown) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage may be full or blocked; the next load simply refetches.
  }
}

/** `null` when nothing valid is cached, so the caller knows to fetch once. */
export const readCachedPreferences = (
  userId: string
): ProfilePreferences | null => {
  const value = read(preferencesKey(userId))
  return isProfilePreferences(value) ? value : null
}

export const writeCachedPreferences = (
  userId: string,
  preferences: ProfilePreferences
) => write(preferencesKey(userId), preferences)

/** `null` when nothing valid is cached. */
export const readCachedRestriction = (
  userId: string
): CachedRestriction | null => {
  const value = read(restrictionKey(userId))
  if (typeof value !== 'object' || value === null || !('restriction' in value))
    return null
  const { restriction, moderationId } = value as {
    restriction: MyRestriction
    moderationId?: string | null
  }
  return { restriction, moderationId: moderationId ?? null }
}

export const writeCachedRestriction = (
  userId: string,
  cached: CachedRestriction
) => write(restrictionKey(userId), cached)

/** Drops every cached account state, e.g. on logout. */
export const clearAccountState = () => {
  if (typeof window === 'undefined') return
  try {
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith(`${PREFIX}:`)) window.localStorage.removeItem(key)
    }
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}
