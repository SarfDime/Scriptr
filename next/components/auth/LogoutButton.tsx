import Leave from '@sanity/icons/Leave'
import { useSession } from '@/providers/SessionProvider'
import { Button } from '../common/Button'

export const LogoutButton = () => {
  const { logout } = useSession()

  return (
    <Button onClick={logout} className='button subtle button-sm grow h-full'>
      <Leave className='w-7 h-7 overwrite' />
    </Button>
  )
}
