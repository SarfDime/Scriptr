import { ApiResourcePage } from '../../../components/api-tester/ApiResourcePage'

export default function ScriptSearchPage() {
  return (
    <ApiResourcePage
      description='Search scripts by title or description.'
      endpoint='/api/scripts/search'
      search
      title='Search scripts'
    />
  )
}
