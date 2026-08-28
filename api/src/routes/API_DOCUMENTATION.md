# API Endpoints Documentation

Complete REST API endpoints for your script-sharing application.

## Table of Contents
- [Professors](#professors)
- [Subjects](#subjects)
- [Scripts](#scripts)
- [Comments](#comments)
- [Flags](#flags)
- [Profiles](#profiles)
- [Votes](#votes)

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

### Moderator Endpoints

#### `POST /professors`
Create a new professor
- **Auth**: Required (Moderator only)
- **Body**: `{ name, picture_url?, bio? }`
- **Response**: Created professor

#### `PATCH /professors/:id`
Update a professor
- **Auth**: Required (Moderator only)
- **Body**: `{ name?, picture_url?, bio? }`
- **Response**: Updated professor

#### `DELETE /professors/:id`
Delete a professor
- **Auth**: Required (Moderator only)
- **Response**: Success message

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

### Moderator Endpoints

#### `POST /subjects`
Create a new subject
- **Auth**: Required (Moderator only)
- **Body**: `{ name, year, exam_session, description?, professor_ids? }`
- **Response**: Created subject

#### `PATCH /subjects/:id`
Update a subject
- **Auth**: Required (Moderator only)
- **Body**: `{ name?, year?, exam_session?, description? }`
- **Response**: Updated subject

#### `DELETE /subjects/:id`
Delete a subject
- **Auth**: Required (Moderator only)
- **Response**: Success message

#### `POST /subjects/:id/professors/:professorId`
Assign a professor to a subject
- **Auth**: Required (Moderator only)
- **Response**: Success message

#### `DELETE /subjects/:id/professors/:professorId`
Remove a professor from a subject
- **Auth**: Required (Moderator only)
- **Response**: Success message

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
- **Body**: `{ title, description?, fileKey, subjectId, fileType }`
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
- **Body**: `{ target_type: 'user'|'script', target_id, reason }`
- **Response**: Created flag

### Moderator Endpoints

#### `GET /flags`
Get all flags
- **Auth**: Required (Moderator only)
- **Response**: Array of all flags

#### `GET /flags/pending`
Get pending flags
- **Auth**: Required (Moderator only)
- **Response**: Array of pending flags

#### `GET /flags/status/:status`
Get flags by status (pending, reviewed, dismissed)
- **Auth**: Required (Moderator only)
- **Response**: Array of flags with specified status

#### `PATCH /flags/:id`
Update flag status
- **Auth**: Required (Moderator only)
- **Body**: `{ status: 'pending'|'reviewed'|'dismissed' }`
- **Response**: Updated flag

#### `DELETE /flags/:id`
Delete a flag
- **Auth**: Required (Moderator only)
- **Response**: Success message

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
- **Body**: `{ username?, full_name?, subjects_passed? }`
- **Response**: Updated profile

#### `POST /profiles/me/achievements`
Add achievement to current user
- **Auth**: Required
- **Body**: `{ achievement: { name, ...otherFields } }`
- **Response**: Updated profile with new achievement

### Moderator Endpoints

#### `PATCH /profiles/:id/role`
Update user role
- **Auth**: Required (Moderator only)
- **Body**: `{ role: 'student'|'moderator' }`
- **Response**: Updated profile

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

All authenticated endpoints require a valid authentication token. Use the `authMiddleware` which:
- Verifies the token
- Attaches the user object to the request context
- Returns 401 if authentication fails

## Role-Based Access Control

**Moderator-only endpoints** require:
1. Valid authentication
2. User role must be `'moderator'`
3. Returns 403 if user is not a moderator

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
Supported file types for scripts: `pdf`, `doc`, `docx`

### Subjects Passed
The `subjects_passed` field in profiles is an array that tracks which subjects a user has completed.
