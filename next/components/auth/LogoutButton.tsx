import Leave from '@sanity/icons/Leave'
import { UI_STRINGS } from '@shared/config/strings'
import { useSession } from '@/providers/SessionProvider'
import { Button } from '../common/Button'

/** Icon-only, so the label is what a screen reader announces: without it the
 * control is an unnamed button next to the account name. */
export const LogoutButton = () => {
  const { logout } = useSession()

  return (
    <Button
      onClick={logout}
      aria-label={UI_STRINGS.auth.logoutButtonLabel}
      className='button subtle button-sm grow h-full'
    >
      <Leave className='w-7 h-7 overwrite' />
    </Button>
  )
}
