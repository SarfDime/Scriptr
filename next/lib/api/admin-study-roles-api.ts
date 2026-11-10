import { apiRoutes } from '@shared/config/api-routes'
import type {
  AdminStudiesResponse,
  AdminStudyRoleResponse,
} from '@shared/types/admin.types'
import type { StudyRole } from '@shared/types/profile.types'
import { apiFetch } from './next-api'

/** The studies the signed-in operator may manage, for the admin surfaces. */
export const getAdminStudyOptions = () =>
  apiFetch<AdminStudiesResponse>(apiRoutes.admin.studies)

export const grantStudyRole = (
  profileId: string,
  studyId: string,
  role: StudyRole
) =>
  apiFetch<AdminStudyRoleResponse>(
    apiRoutes.admin.profilesStudyRolesById(profileId),
    { method: 'PUT', body: { study_id: studyId, role } }
  )

export const revokeStudyRole = (profileId: string, studyId: string) =>
  apiFetch<{ success: true }>(
    apiRoutes.admin.profilesStudyRolesByIdAndStudyId(profileId, studyId),
    { method: 'DELETE' }
  )
