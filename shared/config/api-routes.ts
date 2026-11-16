// AUTO-GENERATED FILE - DO NOT EDIT MANUALLY

import type { RatingTargetType } from './api'

export type ApiEndpoint =
  | '/api/auth/register'
  | '/api/auth/login'
  | '/api/auth/logout'
  | '/api/auth/callback'
  | '/api/auth/session'
  | '/api/sanity/access'
  | '/api/sanity/universities'
  | `/api/sanity/universities/by-sanity/${string}`
  | `/api/sanity/universities/${string}`
  | `/api/sanity/universities/${string}/sync`
  | '/api/sanity/faculties'
  | `/api/sanity/faculties/by-sanity/${string}`
  | `/api/sanity/faculties/${string}`
  | `/api/sanity/faculties/${string}/sync`
  | '/api/sanity/studies'
  | `/api/sanity/studies/${string}`
  | `/api/sanity/studies/${string}/sync`
  | '/api/sanity/professors'
  | `/api/sanity/professors/by-sanity/${string}`
  | `/api/sanity/professors/${string}`
  | `/api/sanity/professors/${string}/studies/${string}`
  | `/api/sanity/professors/${string}/sync`
  | `/api/sanity/professors/${string}/faculties/${string}`
  | '/api/sanity/subjects'
  | `/api/sanity/subjects/by-sanity/${string}`
  | `/api/sanity/subjects/${string}`
  | `/api/sanity/subjects/${string}/sync`
  | `/api/sanity/subjects/${string}/professors/${string}`
  | '/api/admin/access'
  | `/api/admin/profiles/${string}/role`
  | '/api/admin/notifications'
  | '/api/admin/studies'
  | `/api/admin/profiles/${string}/study-roles`
  | `/api/admin/profiles/${string}/study-roles/${string}`
  | '/api/sitemap/scripts'
  | '/api/file-ops/upload-urls'
  | '/api/file-ops/finalize'
  | `/api/file-ops/get-file/${string}`
  | '/api/scripts'
  | `/api/scripts/subject/${string}`
  | `/api/scripts/study/${string}`
  | '/api/scripts/top'
  | '/api/scripts/popular'
  | '/api/scripts/search'
  | '/api/scripts/my-scripts'
  | `/api/scripts/${string}/files/${string}`
  | `/api/scripts/${string}`
  | `/api/scripts/${string}/files`
  | `/api/scripts/${string}/download`
  | '/api/scripts/flagged/all'
  | '/api/votes'
  | `/api/votes/script/${string}`
  | `/api/votes/user/${string}`
  | '/api/votes/my-votes'
  | `/api/votes/script/${string}/my-vote`
  | `/api/votes/script/${string}/stats`
  | `/api/votes/${string}`
  | `/api/comments/script/${string}`
  | `/api/comments/professor/${string}`
  | `/api/comments/user/${string}`
  | `/api/comments/${string}/replies`
  | `/api/comments/${string}/reactions`
  | `/api/comments/${string}/like`
  | '/api/comments'
  | `/api/comments/${string}`
  | '/api/comments/flagged/all'
  | '/api/flags'
  | '/api/flags/pending'
  | `/api/flags/status/${string}`
  | '/api/flags/my-flags'
  | `/api/flags/${string}`
  | '/api/favorites'
  | `/api/favorites/${string}`
  | '/api/profiles'
  | '/api/profiles/me'
  | '/api/profiles/me/preferences'
  | '/api/profiles/me/avatar/upload-url'
  | '/api/profiles/me/avatar'
  | `/api/profiles/username/${string}`
  | `/api/profiles/${string}`
  | `/api/profiles/${string}/admin`
  | `/api/profiles/${string}/stats`
  | '/api/calendar-notes'
  | '/api/calendar-notes/sync'
  | '/api/calendar-notes/auto-sync'
  | '/api/profile-subjects'
  | `/api/profile-subjects/${string}`
  | '/api/profile-studies'
  | `/api/profile-studies/${string}`
  | '/api/profile-faculties'
  | `/api/profile-faculties/${string}`
  | '/api/notifications'
  | '/api/notifications/unread-count'
  | '/api/notifications/read-all'
  | `/api/notifications/${string}`
  | '/api/ratings/types'
  | `/api/ratings/types/${string}`
  | `/api/ratings/professor/${string}`
  | `/api/ratings/professor/${string}/stats`
  | `/api/ratings/professor/${string}/my-ratings`
  | `/api/ratings/professor/${string}/${string}`
  | `/api/ratings/subject/${string}`
  | `/api/ratings/subject/${string}/stats`
  | `/api/ratings/subject/${string}/my-ratings`
  | `/api/ratings/subject/${string}/${string}`
  | '/api/achievement-definitions'
  | `/api/achievement-definitions/${string}`
  | '/api/restrictions'
  | '/api/restrictions/lifted'
  | '/api/restrictions/me'
  | '/api/restrictions/lookup'
  | `/api/restrictions/${string}`
  | '/api/download-review/accounts'
  | '/api/download-review/scripts'
  | '/api/download-review/events'
  | '/api'

export function withQuery(
  path: ApiEndpoint,
  params?: Record<string, string | number | boolean | undefined>
) {
  if (!params) return path
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(
      ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
    )
    .join('&')
  return query ? (`${path}?${query}` as const) : path
}

export const apiRoutes = {
  auth: {
    register: '/api/auth/register',
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    callback: '/api/auth/callback',
    session: '/api/auth/session',
  },
  sanity: {
    access: '/api/sanity/access',
    universities: '/api/sanity/universities',
    universitiesBySanityBySanityId: (sanityId: string | number) =>
      `/api/sanity/universities/by-sanity/${sanityId}` as const,
    universitiesById: (id: string | number) =>
      `/api/sanity/universities/${id}` as const,
    universitiesSyncById: (id: string | number) =>
      `/api/sanity/universities/${id}/sync` as const,
    faculties: '/api/sanity/faculties',
    facultiesBySanityBySanityId: (sanityId: string | number) =>
      `/api/sanity/faculties/by-sanity/${sanityId}` as const,
    facultiesById: (id: string | number) =>
      `/api/sanity/faculties/${id}` as const,
    facultiesSyncById: (id: string | number) =>
      `/api/sanity/faculties/${id}/sync` as const,
    studies: '/api/sanity/studies',
    studiesById: (id: string | number) => `/api/sanity/studies/${id}` as const,
    studiesSyncById: (id: string | number) =>
      `/api/sanity/studies/${id}/sync` as const,
    professors: '/api/sanity/professors',
    professorsBySanityBySanityId: (sanityId: string | number) =>
      `/api/sanity/professors/by-sanity/${sanityId}` as const,
    professorsById: (id: string | number) =>
      `/api/sanity/professors/${id}` as const,
    professorsStudiesByIdAndStudyId: (
      id: string | number,
      studyId: string | number
    ) => `/api/sanity/professors/${id}/studies/${studyId}` as const,
    professorsSyncById: (id: string | number) =>
      `/api/sanity/professors/${id}/sync` as const,
    professorsFacultiesByIdAndFacultyId: (
      id: string | number,
      facultyId: string | number
    ) => `/api/sanity/professors/${id}/faculties/${facultyId}` as const,
    subjects: '/api/sanity/subjects',
    subjectsBySanityBySanityId: (sanityId: string | number) =>
      `/api/sanity/subjects/by-sanity/${sanityId}` as const,
    subjectsById: (id: string | number) =>
      `/api/sanity/subjects/${id}` as const,
    subjectsSyncById: (id: string | number) =>
      `/api/sanity/subjects/${id}/sync` as const,
    subjectsProfessorsByIdAndProfessorId: (
      id: string | number,
      professorId: string | number
    ) => `/api/sanity/subjects/${id}/professors/${professorId}` as const,
  },
  admin: {
    access: '/api/admin/access',
    profilesRoleById: (id: string | number) =>
      `/api/admin/profiles/${id}/role` as const,
    notifications: '/api/admin/notifications',
    studies: '/api/admin/studies',
    profilesStudyRolesById: (id: string | number) =>
      `/api/admin/profiles/${id}/study-roles` as const,
    profilesStudyRolesByIdAndStudyId: (
      id: string | number,
      studyId: string | number
    ) => `/api/admin/profiles/${id}/study-roles/${studyId}` as const,
  },
  sitemap: {
    scripts: '/api/sitemap/scripts',
  },
  fileOps: {
    uploadUrls: '/api/file-ops/upload-urls',
    finalize: '/api/file-ops/finalize',
    getFileByKey: (key: string | number) =>
      `/api/file-ops/get-file/${key}` as const,
  },
  scripts: {
    index: '/api/scripts',
    subjectBySubjectId: (subjectId: string | number) =>
      `/api/scripts/subject/${subjectId}` as const,
    studyByStudyId: (studyId: string | number) =>
      `/api/scripts/study/${studyId}` as const,
    top: (limit?: number) => withQuery('/api/scripts/top', { limit }),
    popular: (limit?: number) => withQuery('/api/scripts/popular', { limit }),
    search: (query: string, study?: string) =>
      withQuery('/api/scripts/search', { q: query, study }),
    myScripts: '/api/scripts/my-scripts',
    filesByScriptIdAndFileId: (
      scriptId: string | number,
      fileId: string | number
    ) => `/api/scripts/${scriptId}/files/${fileId}` as const,
    byId: (id: string | number) => `/api/scripts/${id}` as const,
    filesById: (id: string | number) => `/api/scripts/${id}/files` as const,
    downloadById: (id: string | number) =>
      `/api/scripts/${id}/download` as const,
    flaggedAll: '/api/scripts/flagged/all',
  },
  votes: {
    index: '/api/votes',
    scriptByScriptId: (scriptId: string | number) =>
      `/api/votes/script/${scriptId}` as const,
    userByUserId: (userId: string | number) =>
      `/api/votes/user/${userId}` as const,
    myVotes: '/api/votes/my-votes',
    scriptMyVoteByScriptId: (scriptId: string | number) =>
      `/api/votes/script/${scriptId}/my-vote` as const,
    scriptStatsByScriptId: (scriptId: string | number) =>
      `/api/votes/script/${scriptId}/stats` as const,
    byScriptId: (scriptId: string | number) =>
      `/api/votes/${scriptId}` as const,
  },
  comments: {
    scriptByScriptId: (scriptId: string | number) =>
      `/api/comments/script/${scriptId}` as const,
    professorByProfessorId: (professorId: string | number) =>
      `/api/comments/professor/${professorId}` as const,
    userByUserId: (userId: string | number) =>
      `/api/comments/user/${userId}` as const,
    repliesByCommentId: (commentId: string | number) =>
      `/api/comments/${commentId}/replies` as const,
    reactionsByCommentId: (commentId: string | number) =>
      `/api/comments/${commentId}/reactions` as const,
    likeByCommentId: (commentId: string | number) =>
      `/api/comments/${commentId}/like` as const,
    index: '/api/comments',
    byId: (id: string | number) => `/api/comments/${id}` as const,
    flaggedAll: '/api/comments/flagged/all',
  },
  flags: {
    index: '/api/flags',
    pending: '/api/flags/pending',
    statusByStatus: (status: string | number) =>
      `/api/flags/status/${status}` as const,
    myFlags: '/api/flags/my-flags',
    byId: (id: string | number) => `/api/flags/${id}` as const,
  },
  favorites: {
    index: '/api/favorites',
    byScriptId: (scriptId: string | number) =>
      `/api/favorites/${scriptId}` as const,
  },
  profiles: {
    index: '/api/profiles',
    me: '/api/profiles/me',
    mePreferences: '/api/profiles/me/preferences',
    meAvatarUploadUrl: '/api/profiles/me/avatar/upload-url',
    meAvatar: '/api/profiles/me/avatar',
    usernameByUsername: (username: string | number) =>
      `/api/profiles/username/${username}` as const,
    byId: (id: string | number) => `/api/profiles/${id}` as const,
    adminById: (id: string | number) => `/api/profiles/${id}/admin` as const,
    statsById: (id: string | number) => `/api/profiles/${id}/stats` as const,
  },
  calendarNotes: {
    index: '/api/calendar-notes',
    sync: '/api/calendar-notes/sync',
    autoSync: '/api/calendar-notes/auto-sync',
  },
  profileSubjects: {
    index: '/api/profile-subjects',
    bySubjectId: (subjectId: string | number) =>
      `/api/profile-subjects/${subjectId}` as const,
  },
  profileStudies: {
    index: '/api/profile-studies',
    byStudyId: (studyId: string | number) =>
      `/api/profile-studies/${studyId}` as const,
  },
  profileFaculties: {
    index: '/api/profile-faculties',
    byFacultyId: (facultyId: string | number) =>
      `/api/profile-faculties/${facultyId}` as const,
  },
  notifications: {
    index: '/api/notifications',
    unreadCount: '/api/notifications/unread-count',
    readAll: '/api/notifications/read-all',
    byId: (id: string | number) => `/api/notifications/${id}` as const,
  },
  ratings: {
    types: (targetType: RatingTargetType) =>
      withQuery('/api/ratings/types', { target_type: targetType }),
    typesById: (id: string | number) => `/api/ratings/types/${id}` as const,
    professorByProfessorId: (professorId: string | number) =>
      `/api/ratings/professor/${professorId}` as const,
    professorStatsByProfessorId: (professorId: string | number) =>
      `/api/ratings/professor/${professorId}/stats` as const,
    professorMyRatingsByProfessorId: (professorId: string | number) =>
      `/api/ratings/professor/${professorId}/my-ratings` as const,
    professorByProfessorIdAndRatingTypeId: (
      professorId: string | number,
      ratingTypeId: string | number
    ) => `/api/ratings/professor/${professorId}/${ratingTypeId}` as const,
    subjectBySubjectId: (subjectId: string | number) =>
      `/api/ratings/subject/${subjectId}` as const,
    subjectStatsBySubjectId: (subjectId: string | number) =>
      `/api/ratings/subject/${subjectId}/stats` as const,
    subjectMyRatingsBySubjectId: (subjectId: string | number) =>
      `/api/ratings/subject/${subjectId}/my-ratings` as const,
    subjectBySubjectIdAndRatingTypeId: (
      subjectId: string | number,
      ratingTypeId: string | number
    ) => `/api/ratings/subject/${subjectId}/${ratingTypeId}` as const,
  },
  achievementDefinitions: {
    index: '/api/achievement-definitions',
    byId: (id: string | number) =>
      `/api/achievement-definitions/${id}` as const,
  },
  restrictions: {
    index: '/api/restrictions',
    lifted: '/api/restrictions/lifted',
    me: '/api/restrictions/me',
    lookup: '/api/restrictions/lookup',
    byProfileId: (profileId: string | number) =>
      `/api/restrictions/${profileId}` as const,
  },
  downloadReview: {
    accounts: '/api/download-review/accounts',
    scripts: '/api/download-review/scripts',
    events: '/api/download-review/events',
  },
} as const

export type ApiRoutes = typeof apiRoutes
