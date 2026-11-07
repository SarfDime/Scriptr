import 'server-only'
import { cookies } from 'next/headers'
import { isAdminUnlocked } from './api/admin-access-api'

/**
 * The unlock check for an admin page: the cookie header to forward to the API,
 * or `null` when the operator has to enter a code first.
 *
 * `app/admin/layout.tsx` checks the same thing, but a **layout is not
 * re-rendered on a client-side navigation** between admin pages — only the page
 * segment is refetched. An unlock that lapses while the tab is open therefore
 * slips past the layout: the page renders, its loaders answer `401`, and the
 * operator sees "couldn't load" instead of the code form. A page is re-rendered
 * on every navigation, so each admin page calls this before it loads anything
 * and renders `AdminAccessGate` when it returns `null`.
 */
export const requireAdminUnlock = async (): Promise<string | null> => {
  const cookieHeader = (await cookies()).toString()
  return (await isAdminUnlocked(cookieHeader)) ? cookieHeader : null
}
