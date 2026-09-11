import { redirect } from 'next/navigation'

export default function FacultiesPage() {
  // Hierarchical main gallery combines Universities and Faculties at /universities
  redirect('/universities')
}
