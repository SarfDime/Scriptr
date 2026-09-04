import { ApiResourcePage } from '../../components/api-tester/ApiResourcePage'

export default function FacultiesPage() {
  return (
    <ApiResourcePage
      description='Fetch faculties with their university metadata.'
      endpoint='/api/faculties'
      title='Faculties'
    />
  )
}
