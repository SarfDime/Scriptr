/**
 * Which study the admin pages act on. A preference, not a credential: it is
 * written by the browser so the switcher can set it without a round trip, and
 * the API still authorizes every request on its own.
 *
 * `ADMIN_STUDY_ALL` is only offered to owners, who see every study.
 */
export const ADMIN_STUDY_COOKIE = 'scriptr-admin-study'

export const ADMIN_STUDY_ALL = 'all'
