# API Testing Guide

A self-contained walkthrough: create every piece of test data from scratch,
exercise every route against it, then tear it all down. No pre-loaded seed
required — every ID used later is captured from an earlier response.

Run each block in order from a shell with `curl` and `jq`. Start the API
first:

```bash
npm run dev:hono
BASE=http://localhost:8787/api
```

`INTERNAL_API_SECRET` must be set in `hono/.env` (restart the server after
adding it) — every catalog route needs it:

```bash
SECRET=<value of INTERNAL_API_SECRET>
```

IDs are UUIDs. Slug-style IDs will 404 or 500 — there's no fallback.

---

## Phase 1 — Build the catalog

Each entity is created, then immediately re-fetched — with nothing else in
the database yet, a bad create or a broken embed is obvious immediately.

```bash
# University
UNI=$(curl -s -X POST $BASE/internal/universities \
  -H "x-internal-secret: $SECRET" -H "Content-Type: application/json" \
  -d '{"name":"Test University"}' | jq -r '.university.id')

curl -s $BASE/universities -H "x-internal-secret: $SECRET" | jq '.[] | {id, name}'
curl -s $BASE/universities/$UNI -H "x-internal-secret: $SECRET" | jq '{id, name, faculties, r2_bucket_id}'
```

```bash
# University update + sync (what the Studio "Sync with Database" action calls)
curl -s -X PATCH $BASE/internal/universities/$UNI \
  -H "x-internal-secret: $SECRET" -H "Content-Type: application/json" \
  -d '{"name":"Test University (renamed)"}' | jq .
curl -s -X POST $BASE/internal/universities/$UNI/sync \
  -H "x-internal-secret: $SECRET" -H "Content-Type: application/json" \
  -d '{"name":"Test University"}' | jq .

# Invalid bucket name is rejected (must match S3/R2 naming rules) — expect 400
curl -s -X PATCH $BASE/internal/universities/$UNI \
  -H "x-internal-secret: $SECRET" -H "Content-Type: application/json" \
  -d '{"r2_bucket_id":"Bad_Bucket"}' | jq .
```

```bash
# Faculty
FAC=$(curl -s -X POST $BASE/internal/faculties \
  -H "x-internal-secret: $SECRET" -H "Content-Type: application/json" \
  -d "{\"name\":\"Test Faculty\",\"university_id\":\"$UNI\"}" | jq -r '.faculty.id')

curl -s $BASE/faculties -H "x-internal-secret: $SECRET" | jq '.[] | {id, name, subject_count, professor_count}'
curl -s $BASE/faculties/$FAC -H "x-internal-secret: $SECRET" | jq '{id, name, university, studies, professors}'

# Dependency check: the university now has a faculty, so deleting it must be blocked (409)
curl -s -i -X DELETE $BASE/internal/universities/$UNI -H "x-internal-secret: $SECRET" | head -n 1
```

```bash
# Study
STUDY=$(curl -s -X POST $BASE/internal/studies \
  -H "x-internal-secret: $SECRET" -H "Content-Type: application/json" \
  -d "{\"name\":\"Test Study\",\"faculty_id\":\"$FAC\"}" | jq -r '.study.id')

curl -s $BASE/studies -H "x-internal-secret: $SECRET" | jq '.[] | {id, name, subject_count}'
curl -s $BASE/studies/$STUDY -H "x-internal-secret: $SECRET" | jq '{id, name, faculty, subjects, professors}'
```

```bash
# Subject
SUBJ=$(curl -s -X POST $BASE/internal/subjects \
  -H "x-internal-secret: $SECRET" -H "Content-Type: application/json" \
  -d "{\"name\":\"Test Subject\",\"study_id\":\"$STUDY\"}" | jq -r '.subject.id')

curl -s $BASE/subjects -H "x-internal-secret: $SECRET" | jq '.[] | {id, name}'
curl -s $BASE/subjects/$SUBJ -H "x-internal-secret: $SECRET" | jq '{id, name, study, professors, scripts}'
```

```bash
# Two professors (need two to exercise many-to-many properly)
PROF1=$(curl -s -X POST $BASE/internal/professors \
  -H "x-internal-secret: $SECRET" -H "Content-Type: application/json" \
  -d '{"name":"Dr. Test One"}' | jq -r '.professor.id')
PROF2=$(curl -s -X POST $BASE/internal/professors \
  -H "x-internal-secret: $SECRET" -H "Content-Type: application/json" \
  -d '{"name":"Dr. Test Two"}' | jq -r '.professor.id')

curl -s $BASE/professors -H "x-internal-secret: $SECRET" | jq '.[] | {id, name}'
```

```bash
# Wire PROF1 into the hierarchy and confirm the joins/counts update
curl -s -X POST $BASE/internal/professors/$PROF1/faculties/$FAC -H "x-internal-secret: $SECRET"
curl -s -X POST $BASE/internal/professors/$PROF1/studies/$STUDY -H "x-internal-secret: $SECRET"
curl -s -X POST $BASE/internal/subjects/$SUBJ/professors/$PROF1 -H "x-internal-secret: $SECRET"

curl -s $BASE/faculties/$FAC -H "x-internal-secret: $SECRET" | jq '.professors'
curl -s $BASE/subjects/$SUBJ -H "x-internal-secret: $SECRET" | jq '.professors'
curl -s $BASE/professors/$PROF1 -H "x-internal-secret: $SECRET" | jq '{faculties, studies, subjects}'
```

---

## Phase 2 — Accounts

One regular account, one promoted to admin, so permission boundaries are
actually testable later. Registration takes only `email`, `password`,
`username`, and `full_name`; academic selections are set separately in
Phase 3.

```bash
curl -s -c cookies-student.txt -X POST $BASE/auth/register -H "Content-Type: application/json" \
  -d '{"email":"student@test.local","password":"REDACTED_LOCAL_TEST_PASSWORD","username":"localstudent","full_name":"Test Student"}'
curl -s -c cookies-admin.txt -X POST $BASE/auth/register -H "Content-Type: application/json" \
  -d '{"email":"admin@test.local","password":"REDACTED_LOCAL_TEST_PASSWORD","username":"localadmin","full_name":"Test Admin"}'

# Missing a required field — expect 400
curl -s -X POST $BASE/auth/register -H "Content-Type: application/json" \
  -d '{"email":"incomplete@test.local","password":"REDACTED_LOCAL_TEST_PASSWORD"}' | jq .
```

> If local Supabase Auth requires email confirmation, confirm both users
> (dashboard, or disable confirmation for local dev) before logging in.
> `POST /auth/callback` (`{ access_token, refresh_token }`) is the endpoint the
> frontend calls with the tokens from a real confirmation link; it can't be
> exercised with curl without a live link, so test it through the browser.

```bash
# Login returns the app-shaped session user (id, email, username, role, subjects, ...)
curl -s -c cookies-student.txt -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d '{"email":"student@test.local","password":"REDACTED_LOCAL_TEST_PASSWORD"}' | jq '{success, user: {id, email, username, role}}'
curl -s -c cookies-admin.txt -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@test.local","password":"REDACTED_LOCAL_TEST_PASSWORD"}' | jq '{success, user: {id, email, username, role}}'

# Bad credentials — expect 401
curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d '{"email":"student@test.local","password":"wrong"}' | jq .

STUDENT=$(curl -s -b cookies-student.txt $BASE/auth/session | jq -r '.user.id')
ADMIN=$(curl -s -b cookies-admin.txt $BASE/auth/session | jq -r '.user.id')
```

```bash
# Promote the admin account (internal-only route)
curl -s -X PATCH $BASE/internal/profiles/$ADMIN/role \
  -H "x-internal-secret: $SECRET" -H "Content-Type: application/json" \
  -d '{"role":"admin"}' | jq '.profile.role'

# Confirm both sessions reflect the correct role
curl -s -b cookies-student.txt $BASE/auth/session | jq '.user.role'   # student
curl -s -b cookies-admin.txt $BASE/auth/session | jq '.user.role'     # admin
curl -s $BASE/auth/session | jq .                                     # no cookie: user is null
```

```bash
curl -s $BASE/profiles | jq '.[] | {id, username, role}'
curl -s -b cookies-student.txt $BASE/profiles/me | jq '{id, username, role}'
curl -s $BASE/profiles/username/localstudent | jq '{id, username}'
curl -s $BASE/profiles/$STUDENT/stats | jq .
```

---

## Phase 3 — Academic profile (student)

This is what first-visit onboarding persists once the user has an account.

```bash
curl -s -b cookies-student.txt -X POST $BASE/profile-faculties/$FAC | jq .
curl -s -b cookies-student.txt $BASE/profile-faculties | jq .

curl -s -b cookies-student.txt -X POST $BASE/profile-studies/$STUDY | jq .
curl -s -b cookies-student.txt $BASE/profile-studies | jq .

curl -s -b cookies-student.txt -X PUT $BASE/profile-subjects/$SUBJ \
  -H "Content-Type: application/json" -d '{"status":"currently_taking"}' | jq .
curl -s -b cookies-student.txt $BASE/profile-subjects | jq .

curl -s -b cookies-student.txt $BASE/auth/session | jq '{selected_faculty_ids, selected_study_ids, subjects}'
```

---

## Phase 4 — Scripts

```bash
# Files whose extension (md) actually passes isFileType — text/plain isn't accepted despite
# being in the upload MIME allowlist, so don't reach for a .txt file here.
echo "# Test script content" > /tmp/test-script.md
echo "# Second file" > /tmp/test-script-2.md

# Multi-file upload in one call. subjectId scopes the R2 bucket and key prefix.
UPLOAD=$(curl -s -b cookies-student.txt -X POST $BASE/file-ops/upload \
  -F "files=@/tmp/test-script.md" -F "files=@/tmp/test-script-2.md" -F "subjectId=$SUBJ")
echo $UPLOAD | jq .                                  # { success, files: [{ fileKey, fileType, fileSizeBytes, bucket }, ...] }
echo $UPLOAD | jq '.files | length'                  # 2
echo $UPLOAD | jq -r '.files[0].fileKey'             # {facultyId}/{studyId}/{subjectId}/{userId}/{uuid}.md

# A single file is still accepted and normalized to an array
curl -s -b cookies-student.txt -X POST $BASE/file-ops/upload -F "files=@/tmp/test-script.md" | jq '.files | length'   # 1

# files array is passed to POST /scripts exactly as returned (fileKey, fileType, fileSizeBytes, bucket)
FILES=$(echo $UPLOAD | jq -c '.files')

SCRIPT=$(curl -s -b cookies-student.txt -X POST $BASE/scripts -H "Content-Type: application/json" -d "{
  \"title\": [{\"_type\":\"block\",\"style\":\"normal\",\"markDefs\":[],\"children\":[{\"_type\":\"span\",\"text\":\"Test Script Title\",\"marks\":[]}]}],
  \"subject_id\": \"$SUBJ\",
  \"professor_id\": \"$PROF1\",
  \"files\": $FILES
}" | jq -r '.script.id')

# Unsupported Portable Text block type — expect 400 and no script created
curl -s -b cookies-student.txt -X POST $BASE/scripts -H "Content-Type: application/json" -d "{
  \"title\": [{\"_type\":\"image\"}],
  \"subject_id\": \"$SUBJ\",
  \"professor_id\": \"$PROF1\",
  \"files\": $FILES
}" | jq .
```

```bash
curl -s $BASE/scripts | jq 'length'                       # unauthenticated: sees everything
curl -s -b cookies-student.txt $BASE/scripts | jq 'length' # scoped to selected faculties (still 1)
curl -s $BASE/scripts/$SCRIPT | jq '{id, title, files}'    # each file includes bucket, ordered by position
curl -s $BASE/scripts/subject/$SUBJ | jq 'length'
curl -s "$BASE/scripts/top?limit=5" | jq 'length'
curl -s "$BASE/scripts/popular?limit=5" | jq 'length'
curl -s "$BASE/scripts/search?q=Test%20Scrpit" | jq 'length'   # misspelled on purpose — fuzzy match
curl -s -b cookies-student.txt $BASE/scripts/my-scripts | jq '.scripts | length'
```

```bash
# Pre-signed download URL; pass the stored bucket back as ?bucket=
KEY=$(curl -s $BASE/scripts/$SCRIPT | jq -r '.files[0].file_url')
BUCKET=$(curl -s $BASE/scripts/$SCRIPT | jq -r '.files[0].bucket')
curl -s "$BASE/file-ops/get-file/$KEY?bucket=$BUCKET" | jq .
```

```bash
# Download dedupe: unauthenticated + device id (no real IP locally, so device id drives it)
curl -s -X POST $BASE/scripts/$SCRIPT/download -H "x-device-id: test-device-1" | jq .   # counted: true
curl -s -X POST $BASE/scripts/$SCRIPT/download -H "x-device-id: test-device-1" | jq .   # counted: false

# Download dedupe: authenticated (dedupes by account instead)
curl -s -b cookies-student.txt -X POST $BASE/scripts/$SCRIPT/download | jq .            # counted: true
curl -s -b cookies-student.txt -X POST $BASE/scripts/$SCRIPT/download | jq .            # counted: false
```

```bash
curl -s -b cookies-student.txt -X PATCH $BASE/scripts/$SCRIPT -H "Content-Type: application/json" \
  -d '{"additional_reading":["https://example.com/notes"]}' | jq '.script.additional_reading'
```

---

## Phase 5 — Votes

```bash
curl -s -b cookies-student.txt -X POST $BASE/votes/$SCRIPT | jq .   # voted: true, vote_score: 1
curl -s $BASE/votes/script/$SCRIPT/stats | jq .
curl -s -b cookies-student.txt $BASE/votes/script/$SCRIPT/my-vote | jq .
curl -s -b cookies-student.txt $BASE/votes/my-votes | jq .
curl -s -X POST -b cookies-student.txt $BASE/votes/$SCRIPT | jq .   # voted: false, vote_score: 0 (toggle off)
```

---

## Phase 6 — Favorites

```bash
curl -s -b cookies-student.txt -X POST $BASE/favorites/$SCRIPT | jq .
curl -s -b cookies-student.txt $BASE/favorites | jq .
curl -s -b cookies-student.txt -X DELETE $BASE/favorites/$SCRIPT | jq .
```

Each mutation should also invalidate the signed-in user's public-profile
cache tags so their favorite-script list refreshes.

---

## Phase 7 — Comments

```bash
COMMENT=$(curl -s -b cookies-student.txt -X POST $BASE/comments -H "Content-Type: application/json" -d "{
  \"content\": [{\"_type\":\"block\",\"children\":[{\"_type\":\"span\",\"text\":\"Great script, thanks!\"}]}],
  \"script_id\": \"$SCRIPT\"
}" | jq -r '.comment.id')

# Comments need at least 3 characters and only allow normal text blocks — expect 400
curl -s -b cookies-student.txt -X POST $BASE/comments -H "Content-Type: application/json" -d "{
  \"content\": [{\"_type\":\"block\",\"style\":\"h1\",\"children\":[{\"_type\":\"span\",\"text\":\"No\"}]}],
  \"script_id\": \"$SCRIPT\"
}" | jq .

curl -s $BASE/comments/script/$SCRIPT | jq '.[] | {id, content, reactions_count, likes_count}'

curl -s -b cookies-student.txt -X POST $BASE/comments/$COMMENT/replies -H "Content-Type: application/json" -d '{
  "content": [{"_type":"block","children":[{"_type":"span","text":"Agreed."}]}],
  "script_id": "'"$SCRIPT"'"
}' | jq -r '.reply.id'

curl -s -b cookies-student.txt -X POST $BASE/comments/$COMMENT/reactions \
  -H "Content-Type: application/json" -d '{"reaction_type":"like"}' | jq .
curl -s -b cookies-student.txt -X POST $BASE/comments/$COMMENT/reactions \
  -H "Content-Type: application/json" -d '{"reaction_type":"funny"}' | jq .
curl -s $BASE/comments/$COMMENT/reactions | jq .

# Invalid reaction type — expect 400
curl -s -b cookies-student.txt -X POST $BASE/comments/$COMMENT/reactions \
  -H "Content-Type: application/json" -d '{"reaction_type":"👍"}' | jq .

curl -s -b cookies-student.txt -X POST $BASE/comments/$COMMENT/like | jq .   # liked: true
```

---

## Phase 8 — Ratings

Rating types are created fresh here rather than assumed pre-seeded, so this
phase doesn't depend on migration state.

```bash
curl -s -b cookies-admin.txt -X POST $BASE/ratings/types -H "Content-Type: application/json" \
  -d '{"id":"test_teaching","target_type":"professor","label":"Test Teaching"}' | jq .
curl -s -b cookies-admin.txt -X POST $BASE/ratings/types -H "Content-Type: application/json" \
  -d '{"id":"test_difficulty","target_type":"subject","label":"Test Difficulty"}' | jq .

curl -s $BASE/ratings/types | jq '.[] | {id, target_type, label}'
```

```bash
curl -s -b cookies-student.txt -X POST $BASE/ratings/professor/$PROF1 -H "Content-Type: application/json" \
  -d '{"rating_type_id":"test_teaching","score":5}' | jq .
curl -s $BASE/ratings/professor/$PROF1/stats | jq .
curl -s -b cookies-student.txt $BASE/ratings/professor/$PROF1/my-ratings | jq .

curl -s -b cookies-student.txt -X POST $BASE/ratings/subject/$SUBJ -H "Content-Type: application/json" \
  -d '{"rating_type_id":"test_difficulty","score":3}' | jq .
curl -s $BASE/ratings/subject/$SUBJ/stats | jq .

# Rating type / target mismatch — expect 400
curl -s -b cookies-student.txt -X POST $BASE/ratings/subject/$SUBJ -H "Content-Type: application/json" \
  -d '{"rating_type_id":"test_teaching","score":3}' | jq .
```

## Phase 8b — Achievements & notifications

```bash
# The student's list should contain the system-generated notifications:
# onboarding / account creation, plus the first_upload achievement from the
# Phase 4 upload (scripts_uploaded = 1).
curl -s -b cookies-student.txt $BASE/notifications | jq '.[] | {type, title, is_read}'
curl -s -b cookies-student.txt "$BASE/notifications?is_read=false" | jq 'length'
curl -s -b cookies-student.txt $BASE/notifications/unread-count | jq .

NOTIF=$(curl -s -b cookies-student.txt $BASE/notifications | jq -r '.[0].id')
curl -s -b cookies-student.txt -X PATCH $BASE/notifications/$NOTIF -H "Content-Type: application/json" -d '{"is_read":true}' | jq '.is_read'
curl -s -b cookies-student.txt -X PATCH $BASE/notifications/$NOTIF -H "Content-Type: application/json" -d '{"is_read":"yes"}' | jq .   # 400: must be boolean
curl -s -b cookies-student.txt -X PATCH $BASE/notifications/read-all | jq .
curl -s -b cookies-student.txt $BASE/notifications/unread-count | jq .   # 0
```

---

## Phase 9 — Flags & moderation

This is the permission-sensitive part of the API — worth confirming the
admin-vs-reporter boundary actually holds.

```bash
FLAG=$(curl -s -b cookies-student.txt -X POST $BASE/flags -H "Content-Type: application/json" -d "{
  \"target_type\": \"comment\",
  \"target_id\": \"$COMMENT\",
  \"reason\": \"Testing the flag pipeline end to end\"
}" | jq -r '.flag.id')

curl -s -b cookies-student.txt $BASE/flags/my-flags | jq .
curl -s $BASE/comments/script/$SCRIPT | jq '.[] | select(.id=="'"$COMMENT"'") | .id'  # note is_flagged isn't in the public payload

# Admin: list + resolve
curl -s -b cookies-admin.txt $BASE/flags | jq '.[] | {id, status, target_comment_id}'
curl -s -b cookies-admin.txt $BASE/flags/pending | jq 'length'
curl -s -b cookies-admin.txt $BASE/comments/flagged/all | jq 'length'   # should include $COMMENT

curl -s -b cookies-admin.txt -X PATCH $BASE/flags/$FLAG -H "Content-Type: application/json" \
  -d '{"status":"dismissed"}' | jq '.flag.status'

curl -s -b cookies-admin.txt $BASE/comments/flagged/all | jq 'length'   # back to not including it
```

```bash
# A second flag, deleted by admin rather than the reporter — exercises the admin-delete branch
FLAG2=$(curl -s -b cookies-student.txt -X POST $BASE/flags -H "Content-Type: application/json" -d "{
  \"target_type\": \"script\",
  \"target_id\": \"$SCRIPT\",
  \"reason\": \"Second test flag for admin deletion\"
}" | jq -r '.flag.id')

curl -s -b cookies-admin.txt -X DELETE $BASE/flags/$FLAG2 | jq .
```

---

## Phase 10 — Admin content actions

```bash
curl -s -b cookies-admin.txt -X PATCH $BASE/comments/$COMMENT -H "Content-Type: application/json" \
  -d '{"content":[{"_type":"block","children":[{"_type":"span","text":"Edited by admin."}]}]}' | jq '.comment.edited'

curl -s -b cookies-admin.txt -X PATCH $BASE/profiles/$STUDENT -H "Content-Type: application/json" \
  -d '{"full_name":"Renamed By Admin"}' | jq '.profile.full_name'
```

## Phase 10b — Restrictions

Restricted users can't create or update content, but can still remove their
own and keep favoriting. Always lift the restriction before teardown.

```bash
# Student cannot manage restrictions — expect 403
curl -s -b cookies-student.txt -X PUT $BASE/restrictions/$STUDENT -H "Content-Type: application/json" \
  -d '{"reason":"self restrict attempt"}' | jq .

# Admin restricts the student (reason is 3–500 chars)
curl -s -b cookies-admin.txt -X PUT $BASE/restrictions/$STUDENT -H "Content-Type: application/json" \
  -d '{"reason":"Testing the restriction flow"}' | jq .
curl -s -b cookies-admin.txt $BASE/restrictions | jq 'length'          # includes the student
curl -s -b cookies-student.txt $BASE/restrictions/me | jq .             # own status, non-null

# Blocked while restricted — each expect 403
curl -s -b cookies-student.txt -X POST $BASE/comments -H "Content-Type: application/json" -d "{
  \"content\": [{\"_type\":\"block\",\"children\":[{\"_type\":\"span\",\"text\":\"Should be blocked\"}]}],
  \"script_id\": \"$SCRIPT\"
}" | jq .
curl -s -b cookies-student.txt -X POST $BASE/votes/$SCRIPT | jq .

# Still allowed while restricted: favoriting, and removing own content
curl -s -b cookies-student.txt -X POST $BASE/favorites/$SCRIPT | jq .
curl -s -b cookies-student.txt -X DELETE $BASE/favorites/$SCRIPT | jq .

# Lift it
curl -s -b cookies-admin.txt -X DELETE $BASE/restrictions/$STUDENT | jq .
curl -s -b cookies-admin.txt -X DELETE $BASE/restrictions/$STUDENT | jq .   # 404: not restricted
curl -s -b cookies-student.txt $BASE/restrictions/me | jq .                  # null
```

---

## Teardown

Delete in reverse dependency order — children before parents — so nothing
409s on a leftover reference. Re-run the Phase 1 list endpoints afterward to
confirm counts are back to zero.

```bash
# Interaction data
curl -s -b cookies-student.txt -X DELETE $BASE/ratings/professor/$PROF1/test_teaching | jq .
curl -s -b cookies-student.txt -X DELETE $BASE/ratings/subject/$SUBJ/test_difficulty | jq .
curl -s -b cookies-admin.txt -X DELETE $BASE/ratings/types/test_teaching | jq .
curl -s -b cookies-admin.txt -X DELETE $BASE/ratings/types/test_difficulty | jq .

curl -s -b cookies-student.txt -X DELETE $BASE/comments/$COMMENT | jq .   # cascades the reply/reactions/likes
curl -s -b cookies-student.txt -X DELETE $BASE/scripts/$SCRIPT | jq .

# Student's own academic profile
curl -s -b cookies-student.txt -X DELETE $BASE/profile-subjects/$SUBJ | jq .
curl -s -b cookies-student.txt -X DELETE $BASE/profile-studies/$STUDY | jq .
curl -s -b cookies-student.txt -X DELETE $BASE/profile-faculties/$FAC | jq .

# Accounts (note: this removes the profiles row, not the underlying Supabase
# Auth user — delete those separately via the Auth dashboard/admin API if
# you also want the login itself gone)
curl -s -b cookies-student.txt -X DELETE $BASE/profiles/me | jq .
curl -s -b cookies-admin.txt -X DELETE $BASE/profiles/me | jq .

# Catalog, narrowest to widest
curl -s -X DELETE $BASE/internal/professors/$PROF1/faculties/$FAC -H "x-internal-secret: $SECRET"
curl -s -X DELETE $BASE/internal/professors/$PROF1/studies/$STUDY -H "x-internal-secret: $SECRET"
curl -s -X DELETE $BASE/internal/subjects/$SUBJ/professors/$PROF1 -H "x-internal-secret: $SECRET"
curl -s -X DELETE $BASE/internal/professors/$PROF1 -H "x-internal-secret: $SECRET" | jq .
curl -s -X DELETE $BASE/internal/professors/$PROF2 -H "x-internal-secret: $SECRET" | jq .
curl -s -X DELETE $BASE/internal/subjects/$SUBJ -H "x-internal-secret: $SECRET" | jq .
curl -s -X DELETE $BASE/internal/studies/$STUDY -H "x-internal-secret: $SECRET" | jq .
curl -s -X DELETE $BASE/internal/faculties/$FAC -H "x-internal-secret: $SECRET" | jq .
curl -s -X DELETE $BASE/internal/universities/$UNI -H "x-internal-secret: $SECRET" | jq .   # now succeeds: no faculties left
```

```bash
# Confirm a clean slate
curl -s $BASE/universities -H "x-internal-secret: $SECRET" | jq 'length'   # 0
curl -s $BASE/scripts | jq 'length'                                        # 0

rm -f cookies-student.txt cookies-admin.txt /tmp/test-script.md /tmp/test-script-2.md
```

> Uploaded R2 objects are not deleted when a script is deleted (open decision
> in `PROGRESS.md`); remove test objects from the bucket manually if needed.

---

## Troubleshooting

| Symptom                                               | Cause                                                                                                              |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `{"error":"Not authenticated"}`                       | Missing `-b cookies-*.txt`, or the ~1h session expired — log in again                                              |
| `{"error":"Forbidden"}` on any catalog/internal route | `x-internal-secret` header missing/wrong, or `INTERNAL_API_SECRET` unset in `hono/.env` (restart after setting it) |
| `403` on a create/update that should work             | The account is still restricted from Phase 10b — lift it with `DELETE /restrictions/:profileId`                    |
| `404 Route not found` on a documented endpoint        | The route file isn't mounted in `hono/src/index.ts`                                                                |
| `invalid input syntax for type uuid`                  | A captured `jq -r` variable came back `null` — check the previous step's response shape                            |
| `Cannot delete: still referenced by ...` / `409`      | Teardown ran out of order — delete the named dependent first                                                       |
| Upload returns `.file` is `null`                      | The response is now `.files[]`; use `.files[0].fileKey` and send the form field as `files`, not `file`             |
| Fuzzy search returns nothing                          | Query too far from the title/description text; threshold is intentionally strict                                   |

**Server**: `hono/` via `@hono/node-server`, port `8787`, env file
`hono/.env`. **Auth cookie**: `sb-auth-token` (HttpOnly, `SameSite=Lax`,
`Path=/`). **CORS**: `http://localhost:3000`, `http://localhost:5173`,
`http://localhost:3333`, and a placeholder Vercel origin — browser clients
need `credentials: true`.