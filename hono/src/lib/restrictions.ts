export const computeRestrictionExpiry = (
  priorCount: number,
  now: Date
): string | null => {
  if (!Number.isSafeInteger(priorCount) || priorCount < 0) {
    throw new RangeError('priorCount must be a non-negative integer')
  }

  if (priorCount >= 2) return null

  const expiresAt = new Date(now.getTime())
  if (priorCount === 0) {
    expiresAt.setUTCDate(expiresAt.getUTCDate() + 14)
    return expiresAt.toISOString()
  }

  const day = expiresAt.getUTCDate()
  const nextMonth = expiresAt.getUTCMonth() + 1
  const year = expiresAt.getUTCFullYear() + Math.floor(nextMonth / 12)
  const month = nextMonth % 12
  const lastDayOfNextMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()

  expiresAt.setUTCDate(1)
  expiresAt.setUTCFullYear(year)
  expiresAt.setUTCMonth(month)
  expiresAt.setUTCDate(Math.min(day, lastDayOfNextMonth))
  return expiresAt.toISOString()
}
