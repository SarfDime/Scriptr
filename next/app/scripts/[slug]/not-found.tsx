import { UI_STRINGS } from '@shared/config/strings'
import Link from 'next/link'
import { ErrorState } from '@/components/ui/ErrorState'

export default function NotFound() {
  return (
    <ErrorState
      title={UI_STRINGS.scripts.detail.notFoundTitle}
      description={UI_STRINGS.scripts.detail.notFoundDescription}
      // There is no `/scripts` index page — search is the way back to the
      // catalogue.
      action={
        <Link href='/search' className='button subtle'>
          {UI_STRINGS.scripts.search.pageTitle}
        </Link>
      }
    />
  )
}
