import { redirect } from 'next/navigation'

export default function SubjectsPage() {
  // Academic entities are explored hierarchically starting at /universities
  redirect('/universities')
}
