import { ApiResourcePage } from '../../components/api-tester/ApiResourcePage'

export default function UniversitiesPage() {
  return (
    <ApiResourcePage
      description='Fetch universities and their faculties from the Hono API.'
      endpoint='/api/universities'
      title='Universities'
    />
  )
}
