import type { ToastData } from '../../../types/components/Toast.types'
import { Box } from '../../common/Box'
import { Text } from '../../typography/Text'
import { Title } from '../../typography/Title'
import { ToastIcon } from './ToastIcon'

/** A component that renders the main content of a single toast notification. */
export const ToastContent = ({
  toast,
  children,
}: {
  toast: ToastData
  children?: React.ReactNode
}) => (
  <>
    <Box className='flex w-full items-center gap-1'>
      <ToastIcon type={toast.type} />
      <Title as='h3' title={toast.title} className='font-semibold text-lg' />
      {children}
    </Box>

    {toast?.description && (
      <Text className='max-w-[95%] px-1 text-left opacity-90'>
        {toast?.description}
      </Text>
    )}
  </>
)
