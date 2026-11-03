export const TIME_AGO_STRINGS = {
  justNow: 'Just now',
  oneMinuteAgo: '1 minute ago',
  minutesAgo: (count: number) => `${count} minutes ago` as const,
  anHourAgo: 'An hour ago',
  hoursAgo: (count: number) => `${count} hours ago` as const,
  yesterday: 'Yesterday',
  daysAgo: (count: number) => `${count} days ago` as const,
  invalidDate: 'Invalid date',
} as const
