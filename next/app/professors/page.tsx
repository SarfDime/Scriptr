import { redirect } from 'next/navigation'

export default function ProfessorsPage() {
  // Standalone professor gallery is skipped; redirects to hierarchical academic gallery
  redirect('/universities')
}
