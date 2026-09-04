import { Box } from '../common/Box'
import { Header } from '../navigation/Navbar'

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Box as='main' className='ui-container'>
      <Header />
      <Box className='ui-stack ui-section gap-12'>{children}</Box>
    </Box>
  )
}
