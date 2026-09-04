import { ApiResourcePage } from '../../components/api-tester/ApiResourcePage'

export default function ScriptsPage() {
  return (
    <ApiResourcePage
      description='Fetch scripts with their author and subject information.'
      endpoint='/api/scripts'
      title='Scripts'
    />
  )
}
