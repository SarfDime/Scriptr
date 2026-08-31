# API Endpoints Documentation

Complete REST API endpoints for the Scriptr application.

All endpoints in this document are relative to the API base path `/api`. For
local development, the full URL is `http://localhost:8787/api`.

## Table of Contents
- [Catalog](#catalog)
- [Professors](#professors)
- [Subjects](#subjects)
- [Scripts](#scripts)
- [Comments](#comments)
- [Flags](#flags)
- [Profiles](#profiles)
- [Votes](#votes)
- [Internal Admin](#internal-admin)

---

## Catalog

### Public read-only endpoints

#### `GET /universities`
Get all universities with faculties.
- **Auth**: Not required
- **Response**: Array of universities

#### `GET /universities/:id`
Get a single university by ID.
- **Auth**: Not required
- **Response**: University with faculties

#### `GET /faculties`
Get all faculties with university metadata.
- **Auth**: Not required
- **Response**: Array of faculties

#### `GET /faculties/:id`
Get a single faculty by ID.
- **Auth**: Not required
- **Response**: Faculty details

#### `GET /professors`
Get all professors with their subjects and faculty metadata.
- **Auth**: Not required
- **Response**: Array of professors

#### `GET /professors/:id`
Get a single professor by ID.
- **Auth**: Not required
- **Response**: Professor object with related records

#### `GET /subjects`
Get all subjects with faculty and professor metadata.
- **Auth**: Not required
- **Response**: Array of subjects

#### `GET /subjects/year/:year`
Get subjects by year.
- **Auth**: Not required
- **Response**: Array of subjects

#### `GET /subjects/:id`
Get a single subject by ID.
- **Auth**: Not required
- **Response**: Subject details

> Catalog mutation routes are intentionally not exposed under `/api/universities`, `/api/faculties`, `/api/professors`, or `/api/subjects`. Internal-only writes must use `/api/internal` with the `x-internal-secret` header.

---

## Professors

### Public Endpoints

#### `GET /professors`
Get all professors with their subjects
- **Auth**: Not required
- **Response**: Array of professors with related subjects

#### `GET /professors/:id`
Get a single professor by ID with subjects and comments
- **Auth**: Not required
- **Response**: Professor object with subjects and comments

### Internal mutation endpoints (secret-protected)

These routes are not public. They require the `x-internal-secret` header to match `INTERNAL_API_SECRET`.

#### `GET /internal/professors`
List professors via the internal API.

#### `POST /internal/professors`
Create a new professor.
- **Body**: `{ name, picture_url?, bio?, faculty_ids? }`

#### `PATCH /internal/professors/:id`
Update a professor.
- **Body**: `{ name?, picture_url?, bio? }`

#### `DELETE /internal/professors/:id`
Delete a professor.

#### `POST /internal/professors/:id/faculties/:facultyId`
Assign a professor to a faculty.

#### `DELETE /internal/professors/:id/faculties/:facultyId`
Remove a professor from a faculty.

---

## Subjects

### Public Endpoints

#### `GET /subjects`
Get all subjects with professors and script counts
- **Auth**: Not required
- **Response**: Array of subjects

#### `GET /subjects/year/:year`
Get subjects by year
- **Auth**: Not required
- **Response**: Array of subjects for the specified year

#### `GET /subjects/:id`
Get a single subject with professors and scripts
- **Auth**: Not required
- **Response**: Subject object with related data

### Internal mutation endpoints (secret-protected)

These routes are not public. They require the `x-internal-secret` header to match `INTERNAL_API_SECRET`.

#### `GET /internal/subjects`
List subjects via the internal API.

#### `POST /internal/subjects`
Create a new subject.
- **Body**: `{ name, year, exam_session, faculty_id, description?, professor_ids? }`

#### `PATCH /internal/subjects/:id`
Update a subject.
- **Body**: `{ name?, year?, exam_session?, faculty_id?, description? }`

#### `DELETE /internal/subjects/:id`
Delete a subject.

#### `POST /internal/subjects/:id/professors/:professorId`
Assign a professor to a subject.

#### `DELETE /internal/subjects/:id/professors/:professorId`
Remove a professor from a subject.

---

## Scripts

### Public Endpoints

#### `GET /scripts`
Get all scripts with author and subject info
- **Auth**: Not required
- **Response**: Array of scripts

#### `GET /scripts/:id`
Get a single script by ID
- **Auth**: Not required
- **Response**: Script object with author and subject

#### `GET /scripts/subject/:subjectId`
Get all scripts for a specific subject
- **Auth**: Not required
- **Response**: Array of scripts

#### `GET /scripts/top?limit=10`
Get top scripts by vote score
- **Auth**: Not required
- **Query**: `limit` (default: 10)
- **Response**: Array of top-rated scripts

#### `GET /scripts/popular?limit=10`
Get most downloaded scripts
- **Auth**: Not required
- **Query**: `limit` (default: 10)
- **Response**: Array of popular scripts

#### `GET /scripts/search?q=query`
Search scripts by title or description
- **Auth**: Not required
- **Query**: `q` (required)
- **Response**: Array of matching scripts

#### `POST /scripts/:id/download`
Increment download count for a script
- **Auth**: Not required
- **Response**: Success message

### Authenticated Endpoints

#### `POST /scripts`
Upload a new script
- **Auth**: Required
- **Body**: `{ title, description?, fileKey, subjectId, professorId, fileType }`
- **Response**: Created script

#### `GET /scripts/my-scripts`
Get current user's scripts
- **Auth**: Required
- **Response**: Array of user's scripts

#### `PATCH /scripts/:id`
Update a script (author or moderator only)
- **Auth**: Required
- **Body**: `{ title?, description? }`
- **Response**: Updated script

#### `DELETE /scripts/:id`
Delete a script (author or moderator only)
- **Auth**: Required
- **Response**: Success message

#### `GET /scripts/flagged/all`
Get all flagged scripts (moderator only)
- **Auth**: Required (Moderator only)
- **Response**: Array of flagged scripts with flag details

---

## Comments

### Public Endpoints

#### `GET /comments`
Get all comments
- **Auth**: Not required
- **Response**: Array of comments with author and professor info

#### `GET /comments/professor/:professorId`
Get comments for a specific professor
- **Auth**: Not required
- **Response**: Array of comments

#### `GET /comments/user/:userId`
Get comments by a specific user
- **Auth**: Not required
- **Response**: Array of comments

### Authenticated Endpoints

#### `POST /comments`
Create a new comment
- **Auth**: Required
- **Body**: `{ content, professor_id }`
- **Response**: Created comment

#### `PATCH /comments/:id`
Update a comment (author only)
- **Auth**: Required
- **Body**: `{ content }`
- **Response**: Updated comment

#### `DELETE /comments/:id`
Delete a comment (author or moderator)
- **Auth**: Required
- **Response**: Success message

---

## Flags

### Authenticated Endpoints

#### `GET /flags/my-flags`
Get current user's submitted flags
- **Auth**: Required
- **Response**: Array of user's flags

#### `POST /flags`
Create a new flag (report)
- **Auth**: Required
- **Body**: `{ target_type: 'user'|'script', target_id, reason }` (stored as `target_user_id` or `target_script_id`)
- **Response**: Created flag

### Moderator read endpoints

These are moderator-only reads:

#### `GET /flags`
Get all flags.
- **Auth**: Required (Moderator only)
- **Response**: Array of all flags

#### `GET /flags/pending`
Get pending flags.
- **Auth**: Required (Moderator only)
- **Response**: Array of pending flags

#### `GET /flags/status/:status`
Get flags by status (`pending`, `reviewed`, `dismissed`).
- **Auth**: Required (Moderator only)
- **Response**: Array of matching flags

### Authenticated user mutation endpoints

#### `PATCH /flags/:id`
Update your own flag.
- **Auth**: Required
- **Body**: `{ status: 'pending'|'reviewed'|'dismissed' }`
- **Restriction**: Only the flag reporter can update their own flag. Moderators cannot update another moderator's flag.

#### `DELETE /flags/:id`
Delete your own flag.
- **Auth**: Required
- **Restriction**: Only the flag reporter can delete their own flag.

---

## Profiles

### Public Endpoints

#### `GET /profiles`
Get all user profiles
- **Auth**: Not required
- **Response**: Array of public profile data

#### `GET /profiles/username/:username`
Get a user profile by username
- **Auth**: Not required
- **Response**: Profile with user's scripts

#### `GET /profiles/:id`
Get a user profile by ID
- **Auth**: Not required
- **Response**: Profile with user's scripts

#### `GET /profiles/:id/stats`
Get user statistics
- **Auth**: Not required
- **Response**: User stats (scripts count, votes, downloads, comments)

### Authenticated Endpoints

#### `GET /profiles/me`
Get current user's profile
- **Auth**: Required
- **Response**: Full profile data

#### `PATCH /profiles/me`
Update current user's profile
- **Auth**: Required
- **Body**: `{ username?, full_name?, completed_subject_ids? }`
- **Response**: Updated profile

### Internal-only role mutation

#### `PATCH /internal/profiles/:id/role`
Update a user's role.
- **Auth**: Not a public auth route; requires `x-internal-secret` header matching `INTERNAL_API_SECRET`
- **Body**: `{ role: 'student'|'moderator' }`
- **Response**: Updated profile

> Public role mutation is intentionally not exposed on `/api/profiles`.

---

## Votes

### Public Endpoints

#### `GET /votes`
Get all votes
- **Auth**: Not required
- **Response**: Array of votes with user and script info

#### `GET /votes/script/:scriptId`
Get votes for a specific script
- **Auth**: Not required
- **Response**: Array of votes

#### `GET /votes/user/:userId`
Get votes by a specific user
- **Auth**: Not required
- **Response**: Array of votes

#### `GET /votes/script/:scriptId/stats`
Get vote statistics for a script
- **Auth**: Not required
- **Response**: `{ upvotes, downvotes, total, score }`

### Authenticated Endpoints

#### `GET /votes/my-votes`
Get current user's votes
- **Auth**: Required
- **Response**: Array of user's votes

#### `GET /votes/script/:scriptId/my-vote`
Get current user's vote for a specific script
- **Auth**: Required
- **Response**: Vote object or null

#### `POST /votes/:id/vote`
Vote on a script (upvote/downvote/remove)
- **Auth**: Required
- **Body**: `{ value: 1 | -1 }`
- **Note**: Clicking same vote removes it, clicking opposite changes vote
- **Response**: Success message

#### `DELETE /votes/:scriptId`
Remove vote from a script
- **Auth**: Required
- **Response**: Success message

---

## Authentication

All authenticated endpoints require the Supabase session cookie created by the
authentication routes. The `authMiddleware` verifies the session, attaches the
user to the request context, and returns `401` when authentication fails.

## Role-Based Access Control

The backend now uses a clear separation of responsibilities:
1. Public catalog routes are read-only and do not require authentication.
2. Authenticated user routes require a valid Supabase session.
3. Moderator-only routes are read-only views of flags and require the user role to be `'moderator'`.
4. Internal catalog writes and role changes are only exposed under `/api/internal` and require the `x-internal-secret` header.
5. A moderator may only update/delete their own flags; they cannot mutate flags from other moderators or other users.

Any violation returns `403` with an error payload.

## Error Responses

All endpoints return errors in the format:
```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Notes

### Vote System
The vote system supports:
- Upvote (+1)
- Downvote (-1)
- Toggle (clicking same vote removes it)
- Change (clicking opposite vote changes it)
- Automatic vote_score calculation

### Flag System
When a script is flagged:
- The `is_flagged` field is set to `true`
- When all flags are dismissed, `is_flagged` returns to `false`

### File Types
Supported file types for scripts: `pdf`, `jpg`, `jpeg`, `png`, `webp`

### Internal writes
Catalog writes and role changes are intentionally not available on the public API. Use `/api/internal` with the `x-internal-secret` header to mutate internal catalog records or update a profile role.

### Subjects Passed
Completed subjects are stored in `profile_completed_subjects` and managed through `completed_subject_ids`.
