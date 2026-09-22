// AUTO-GENERATED FILE - DO NOT EDIT MANUALLY

import type { RatingTargetType } from './api'

export type ApiEndpoint =
  | '/api/auth/register'
  | '/api/auth/login'
  | '/api/auth/logout'
  | '/api/auth/session'
  | '/api/auth/refresh'
  | '/api/universities'
  | `/api/universities/${string}`
  | `/api/universities/${string}/sync`
  | '/api/faculties'
  | `/api/faculties/${string}`
  | '/api/studies'
  | `/api/studies/${string}`
  | '/api/professors'
  | `/api/professors/${string}`
  | '/api/subjects'
  | `/api/subjects/${string}`
  | '/api/file-ops/upload'
  | `/api/file-ops/get-file/${string}`
  | '/api/scripts'
  | `/api/scripts/subject/${string}`
  | '/api/scripts/top'
  | '/api/scripts/popular'
  | '/api/scripts/search'
  | `/api/scripts/${string}`
  | '/api/scripts/my-scripts'
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
  | `/api/comments/${string}/reactions`
  | `/api/comments/${string}/replies`
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
  | `/api/profiles/username/${string}`
  | `/api/profiles/${string}`
  | `/api/profiles/${string}/stats`
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
  | '/api/restrictions'
  | '/api/restrictions/me'
  | `/api/restrictions/${string}`
  | `/api/internal/profiles/${string}/role`
  | '/api/internal/universities'
  | `/api/internal/universities/by-sanity/${string}`
  | `/api/internal/universities/${string}`
  | `/api/internal/universities/${string}/sync`
  | '/api/internal/faculties'
  | `/api/internal/faculties/by-sanity/${string}`
  | `/api/internal/faculties/${string}`
  | `/api/internal/faculties/${string}/sync`
  | '/api/internal/studies'
  | `/api/internal/studies/${string}`
  | `/api/internal/studies/${string}/sync`
  | '/api/internal/professors'
  | `/api/internal/professors/by-sanity/${string}`
  | `/api/internal/professors/${string}`
  | `/api/internal/professors/${string}/studies/${string}`
  | `/api/internal/professors/${string}/sync`
  | `/api/internal/professors/${string}/faculties/${string}`
  | '/api/internal/subjects'
  | `/api/internal/subjects/by-sanity/${string}`
  | `/api/internal/subjects/${string}`
  | `/api/internal/subjects/${string}/sync`
  | `/api/internal/subjects/${string}/professors/${string}`
  | '/api/internal/comments'
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
    session: '/api/auth/session',
    refresh: '/api/auth/refresh',
  },
  universities: {
    index: '/api/universities',
    byId: (id: string | number) => `/api/universities/${id}` as const,
    syncById: (id: string | number) => `/api/universities/${id}/sync` as const,
  },
  faculties: {
    index: '/api/faculties',
    byId: (id: string | number) => `/api/faculties/${id}` as const,
  },
  studies: {
    index: '/api/studies',
    byId: (id: string | number) => `/api/studies/${id}` as const,
  },
  professors: {
    index: '/api/professors',
    byId: (id: string | number) => `/api/professors/${id}` as const,
  },
  subjects: {
    index: '/api/subjects',
    byId: (id: string | number) => `/api/subjects/${id}` as const,
  },
  fileOps: {
    upload: '/api/file-ops/upload',
    getFileByKey: (key: string | number) =>
      `/api/file-ops/get-file/${key}` as const,
  },
  scripts: {
    index: '/api/scripts',
    subjectBySubjectId: (subjectId: string | number) =>
      `/api/scripts/subject/${subjectId}` as const,
    top: (limit?: number) => withQuery('/api/scripts/top', { limit }),
    popular: (limit?: number) => withQuery('/api/scripts/popular', { limit }),
    search: (query: string) => withQuery('/api/scripts/search', { q: query }),
    byId: (id: string | number) => `/api/scripts/${id}` as const,
    myScripts: '/api/scripts/my-scripts',
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
    reactionsByCommentId: (commentId: string | number) =>
      `/api/comments/${commentId}/reactions` as const,
    repliesByCommentId: (commentId: string | number) =>
      `/api/comments/${commentId}/replies` as const,
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
    usernameByUsername: (username: string | number) =>
      `/api/profiles/username/${username}` as const,
    byId: (id: string | number) => `/api/profiles/${id}` as const,
    statsById: (id: string | number) => `/api/profiles/${id}/stats` as const,
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
  restrictions: {
    index: '/api/restrictions',
    me: '/api/restrictions/me',
    byProfileId: (profileId: string | number) =>
      `/api/restrictions/${profileId}` as const,
  },
  internal: {
    profilesRoleById: (id: string | number) =>
      `/api/internal/profiles/${id}/role` as const,
    universities: '/api/internal/universities',
    universitiesBySanityBySanityId: (sanityId: string | number) =>
      `/api/internal/universities/by-sanity/${sanityId}` as const,
    universitiesById: (id: string | number) =>
      `/api/internal/universities/${id}` as const,
    universitiesSyncById: (id: string | number) =>
      `/api/internal/universities/${id}/sync` as const,
    faculties: '/api/internal/faculties',
    facultiesBySanityBySanityId: (sanityId: string | number) =>
      `/api/internal/faculties/by-sanity/${sanityId}` as const,
    facultiesById: (id: string | number) =>
      `/api/internal/faculties/${id}` as const,
    facultiesSyncById: (id: string | number) =>
      `/api/internal/faculties/${id}/sync` as const,
    studies: '/api/internal/studies',
    studiesById: (id: string | number) =>
      `/api/internal/studies/${id}` as const,
    studiesSyncById: (id: string | number) =>
      `/api/internal/studies/${id}/sync` as const,
    professors: '/api/internal/professors',
    professorsBySanityBySanityId: (sanityId: string | number) =>
      `/api/internal/professors/by-sanity/${sanityId}` as const,
    professorsById: (id: string | number) =>
      `/api/internal/professors/${id}` as const,
    professorsStudiesByIdAndStudyId: (
      id: string | number,
      studyId: string | number
    ) => `/api/internal/professors/${id}/studies/${studyId}` as const,
    professorsSyncById: (id: string | number) =>
      `/api/internal/professors/${id}/sync` as const,
    professorsFacultiesByIdAndFacultyId: (
      id: string | number,
      facultyId: string | number
    ) => `/api/internal/professors/${id}/faculties/${facultyId}` as const,
    subjects: '/api/internal/subjects',
    subjectsBySanityBySanityId: (sanityId: string | number) =>
      `/api/internal/subjects/by-sanity/${sanityId}` as const,
    subjectsById: (id: string | number) =>
      `/api/internal/subjects/${id}` as const,
    subjectsSyncById: (id: string | number) =>
      `/api/internal/subjects/${id}/sync` as const,
    subjectsProfessorsByIdAndProfessorId: (
      id: string | number,
      professorId: string | number
    ) => `/api/internal/subjects/${id}/professors/${professorId}` as const,
    comments: '/api/internal/comments',
  },
} as const

export type ApiRoutes = typeof apiRoutes
