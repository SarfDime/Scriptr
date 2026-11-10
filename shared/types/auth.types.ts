import type {
  ProfileSubjectStatus,
  StudyRoleAssignment,
  UserRole,
} from './profile.types'

// ── Requests ────────────────────────────────────────────────────────────

export type RegisterRequest = {
  email: string
  password: string
  username: string
  full_name: string
  academicProfile?: RegistrationAcademicProfile
}

export type RegistrationAcademicProfile = {
  facultyId: string
  studyId: string | null
  completedSubjectIds: Array<string>
}

export type LoginRequest = {
  email: string
  password: string
}

// ── POST /api/auth/register ────────────────────────────────────────────

export type RegisterUser = {
  id: string | undefined
  email: string | undefined
  username: string
}

export type RegisterResponse = {
  success: true
  message: string
  user: RegisterUser
  /**
   * Supabase's raw signUp session — `null` when email confirmation is
   * required before the account is active, otherwise an active session.
   * The Next client never reads its fields (auth is cookie-based, see
   * next-api.ts), only whether it's `null`, so it's left untyped rather
   * than modeling @supabase/supabase-js's internal Session shape.
   */
  session: unknown
}

/** Which unique field a register `409` is about. */
export type RegisterConflictField = 'username' | 'email'

/** Body of `POST /api/auth/register`'s `409`, so the client can flag the right field. */
export type RegisterConflictResponse = {
  error: string
  field: RegisterConflictField
}

// ── POST /api/auth/login ───────────────────────────────────────────────

export type LoginResponse = {
  success: true
  user: SessionUser
  /** See RegisterResponse.session — unused by the Next client. */
  session: unknown
}

// ── POST /api/auth/logout ──────────────────────────────────────────────

export type LogoutResponse = {
  success: true
  message: string
}

// ── GET /api/auth/session ──────────────────────────────────────────────

export type SessionUserSubject = {
  subject_id: string
  status: ProfileSubjectStatus
}

export type SessionUser = {
  id: string
  email: string | undefined
  username: string | undefined
  role: UserRole
  /** Roles held per study. Empty for a student with no moderation duties. */
  study_roles: Array<StudyRoleAssignment>
  subjects: Array<SessionUserSubject>
  selected_faculty_ids: Array<string>
  selected_study_ids: Array<string>
}

/**
 * Matches both branches of `GET /session`: the success path returns only
 * `{ user }`, the no-session/error path returns `{ user: null, session:
 * null }`. `session` is optional here to cover both without a
 * discriminated union the caller has to narrow through.
 */
export type SessionResponse = {
  user: SessionUser | null
  session?: null
}

// ── POST /api/auth/callback ────────────────────────────────────────────

export type CallbackRequest = {
  access_token: string
  refresh_token: string
}

/** Identical shape to /login's response — establishing a session from
 * tokens handed off by Supabase's hosted /verify redirect (email
 * confirmation, magic link, invite, ...) ends up in the same "here's
 * your session user" state as a password login. */
export type CallbackResponse = LoginResponse
