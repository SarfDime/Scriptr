/** User-facing copy for the professor and subject ratings UI. Entries that
 * depend on a value (labels, counts, scores) are small functions so wording
 * and pluralisation stay here instead of leaking into components. The
 * restricted-account message is shared: `UI_STRINGS.general.restrictedAction`. */
export const RATING_STRINGS = {
  title: 'Ratings',
  loading: 'Loading ratings…',
  loadError: 'Could not load ratings.',
  retry: 'Try again',
  empty: 'There is nothing to rate here yet.',
  noRatingsYet: 'No ratings yet',
  summary: (average: number, count: number) =>
    `${average.toFixed(1)} · ${count === 1 ? '1 rating' : `${count} ratings`}`,
  groupLabel: (criterion: string) => `Your rating for ${criterion}`,
  scoreOption: (score: number) => `${score} out of 5`,
  signInPrompt: 'Sign in to rate.',
  signIn: 'Sign in',
  checkingAccess: 'Checking your account…',
  loadMineError: 'Could not load your ratings.',
  saving: 'Saving…',
  removing: 'Removing…',
  remove: 'Clear',
  removeAria: (criterion: string) => `Remove my ${criterion} rating`,
  saved: (criterion: string) => `${criterion} rating saved`,
  removed: (criterion: string) => `${criterion} rating removed`,
  saveFailed: (criterion: string) =>
    `Couldn’t save your ${criterion} rating. Please try again.`,
  removeFailed: (criterion: string) =>
    `Couldn’t remove your ${criterion} rating. Please try again.`,
} as const
