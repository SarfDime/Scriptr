import { ApiResourcePage } from '../../components/api-tester/ApiResourcePage'

export default function SubjectsPage() {
  return (
    <ApiResourcePage
      description='Fetch subjects with faculty and professor metadata.'
      endpoint='/api/subjects'
      title='Subjects'
    />
  )
}
