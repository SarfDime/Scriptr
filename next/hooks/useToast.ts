import { useToast } from '@/providers/toaster/ToasterProvider'

export const useToastHook = () => {
  const { addToast } = useToast()
  return { showToast: addToast }
}
