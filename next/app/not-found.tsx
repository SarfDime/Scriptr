import { UI_STRINGS } from '@shared/config/strings'
import Link from 'next/link'
import { ErrorState } from '@/components/ui/ErrorState'

/** Root 404. Rendered inside the layout, so the header, nav and footer stay
 * available — the action that matters here is a way back. */
export default function NotFound() {
  return (
    <ErrorState
      title={UI_STRINGS.general.errors.notFoundTitle}
      description={UI_STRINGS.general.errors.notFoundDescription}
      action={
        <Link href='/' className='button solid'>
          {UI_STRINGS.general.errors.backHome}
        </Link>
      }
    />
  )
}
