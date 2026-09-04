import { ApiResourcePage } from '../../components/api-tester/ApiResourcePage'

export default function ProfessorsPage() {
  return (
    <ApiResourcePage
      description='Fetch professors and their related subjects.'
      endpoint='/api/professors'
      title='Professors'
    />
  )
}
