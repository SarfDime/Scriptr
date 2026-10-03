import Leave from '@sanity/icons/Leave'
import { useSession } from '@/providers/SessionProvider'
import { Button } from '../common/Button'

export const LogoutButton = () => {
  const { logout } = useSession()

  return (
    <Button onClick={logout} className='button subtle px-2 grow h-full'>
      <Leave className='w-8 h-8 overwrite' />
    </Button>
  )
}
