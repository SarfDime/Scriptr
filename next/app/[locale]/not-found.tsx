import { UI_STRINGS_PACK } from '@shared/config/strings'
import { localizedPath } from '@shared/utils/localized-path'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/PageLayout'
import { ErrorState } from '@/components/ui/ErrorState'
import { getServerLocale, getServerStrings } from '@/lib/server-strings'

/**
 * The 404 for any address under a language that no page matched, and for every
 * `notFound()` in the tree — an unknown study, a deleted script, a private
 * profile.
 *
 * It renders inside the `[locale]` layout, so it carries the catalog chrome and
 * comes out in the reader's language: the action that matters here is a way
 * back, and that needs the header and nav. Next 16.4 delivers it in the flight
 * payload only; the initial HTML is the framework's error shell (see
 * `[...notFound]/page.tsx`).
 */
export default async function NotFound() {
  const [UI_STRINGS, locale] = await Promise.all([
    getServerStrings(UI_STRINGS_PACK),
    getServerLocale(),
  ])

  return (
    <MainLayout>
      <ErrorState
        title={UI_STRINGS.general.errors.notFoundTitle}
        description={UI_STRINGS.general.errors.notFoundDescription}
        action={
          <Link href={localizedPath('/', locale)} className='button solid'>
            {UI_STRINGS.general.errors.backHome}
          </Link>
        }
      />
    </MainLayout>
  )
}
