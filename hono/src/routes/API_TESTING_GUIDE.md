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
curl -s $BASE/universities/$UNI -H "x-internal-secret: $SECRET" | jq '{id, name, faculties}'
```

```bash
# Faculty
FAC=$(curl -s -X POST $BASE/internal/faculties \
  -H "x-internal-secret: $SECRET" -H "Content-Type: application/json" \
  -d "{\"name\":\"Test Faculty\",\"university_id\":\"$UNI\"}" | jq -r '.faculty.id')

curl -s $BASE/faculties -H "x-internal-secret: $SECRET" | jq '.[] | {id, name, subject_count, professor_count}'
curl -s $BASE/faculties/$FAC -H "x-internal-secret: $SECRET" | jq '{id, name, university, studies, professors}'
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
actually testable later.

```bash
curl -s -c cookies-student.txt -X POST $BASE/auth/register -H "Content-Type: application/json" \
  -d '{"email":"student@test.local","password":"REDACTED_LOCAL_TEST_PASSWORD","username":"localstudent","full_name":"Test Student"}'
curl -s -c cookies-admin.txt -X POST $BASE/auth/register -H "Content-Type: application/json" \
  -d '{"email":"admin@test.local","password":"REDACTED_LOCAL_TEST_PASSWORD","username":"localadmin","full_name":"Test Admin"}'
```

> If local Supabase Auth requires email confirmation, confirm both users
> (dashboard, or disable confirmation for local dev) before logging in.

```bash
curl -s -c cookies-student.txt -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d '{"email":"student@test.local","password":"REDACTED_LOCAL_TEST_PASSWORD"}' | jq '{success, user: {id, email}}'
curl -s -c cookies-admin.txt -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@test.local","password":"REDACTED_LOCAL_TEST_PASSWORD"}' | jq '{success, user: {id, email}}'

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
```

```bash
curl -s $BASE/profiles | jq '.[] | {id, username, role}'
curl -s -b cookies-student.txt $BASE/profiles/me | jq '{id, username, role}'
curl -s $BASE/profiles/username/localstudent | jq '{id, username}'
curl -s $BASE/profiles/$STUDENT/stats | jq .
```

---

## Phase 3 — Academic profile (student)

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
# A file whose extension (md) actually passes isFileType — text/plain isn't accepted despite
# being in the upload MIME allowlist, so don't reach for a .txt file here.
echo "# Test script content" > /tmp/test-script.md

FILE=$(curl -s -b cookies-student.txt -X POST $BASE/file-ops/upload -F "file=@/tmp/test-script.md")
echo $FILE | jq .
FILE_KEY=$(echo $FILE | jq -r '.file.fileKey')
FILE_TYPE=$(echo $FILE | jq -r '.file.fileType')
FILE_SIZE=$(echo $FILE | jq -r '.file.fileSizeBytes')

SCRIPT=$(curl -s -b cookies-student.txt -X POST $BASE/scripts -H "Content-Type: application/json" -d "{
  \"title\": [{\"_type\":\"block\",\"children\":[{\"_type\":\"span\",\"text\":\"Test Script Title\"}]}],
  \"subject_id\": \"$SUBJ\",
  \"professor_id\": \"$PROF1\",
  \"files\": [{\"fileKey\":\"$FILE_KEY\",\"fileType\":\"$FILE_TYPE\",\"fileSizeBytes\":$FILE_SIZE}]
}" | jq -r '.script.id')
```

```bash
curl -s $BASE/scripts | jq 'length'                       # unauthenticated: sees everything
curl -s -b cookies-student.txt $BASE/scripts | jq 'length' # scoped to selected faculties (still 1)
curl -s $BASE/scripts/$SCRIPT | jq '{id, title, files}'
curl -s $BASE/scripts/subject/$SUBJ | jq 'length'
curl -s "$BASE/scripts/top?limit=5" | jq 'length'
curl -s "$BASE/scripts/popular?limit=5" | jq 'length'
curl -s "$BASE/scripts/search?q=Test%20Scrpit" | jq 'length'   # misspelled on purpose — fuzzy match
curl -s -b cookies-student.txt $BASE/scripts/my-scripts | jq '.scripts | length'
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

---

## Phase 7 — Comments

```bash
COMMENT=$(curl -s -b cookies-student.txt -X POST $BASE/comments -H "Content-Type: application/json" -d "{
  \"content\": [{\"_type\":\"block\",\"children\":[{\"_type\":\"span\",\"text\":\"Great script, thanks!\"}]}],
  \"script_id\": \"$SCRIPT\"
}" | jq -r '.comment.id')

curl -s $BASE/comments/script/$SCRIPT | jq '.[] | {id, content, reactions_count, likes_count}'

curl -s -b cookies-student.txt -X POST $BASE/comments/$COMMENT/replies -H "Content-Type: application/json" -d '{
  "content": [{"_type":"block","children":[{"_type":"span","text":"Agreed."}]}],
  "script_id": "'"$SCRIPT"'"
}' | jq -r '.reply.id'

curl -s -b cookies-student.txt -X POST $BASE/comments/$COMMENT/reactions \
  -H "Content-Type: application/json" -d '{"reaction_type":"like"}' | jq .
curl -s $BASE/comments/$COMMENT/reactions | jq .

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
```

## Phase 8b — Achievements & notifications

```bash
# Uploading a script already triggered scripts_uploaded=1 back in Phase 4 —
# check the "first_upload" achievement landed.
curl -s -b cookies-student.txt $BASE/notifications | jq '.[] | {type, title, is_read}'
curl -s -b cookies-student.txt $BASE/notifications/unread-count | jq .

NOTIF=$(curl -s -b cookies-student.txt $BASE/notifications | jq -r '.[0].id')
curl -s -b cookies-student.txt -X PATCH $BASE/notifications/$NOTIF -H "Content-Type: application/json" -d '{"is_read":true}' | jq '.is_read'
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
curl -s -X DELETE $BASE/internal/universities/$UNI -H "x-internal-secret: $SECRET" | jq .
```

```bash
# Confirm a clean slate
curl -s $BASE/universities -H "x-internal-secret: $SECRET" | jq 'length'   # 0
curl -s $BASE/scripts | jq 'length'                                        # 0

rm -f cookies-student.txt cookies-admin.txt /tmp/test-script.md
```

---

## Troubleshooting

| Symptom                                               | Cause                                                                                                              |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `{"error":"Not authenticated"}`                       | Missing `-b cookies-*.txt`, or the ~1h session expired — log in again                                              |
| `{"error":"Forbidden"}` on any catalog/internal route | `x-internal-secret` header missing/wrong, or `INTERNAL_API_SECRET` unset in `hono/.env` (restart after setting it) |
| `invalid input syntax for type uuid`                  | A captured `jq -r` variable came back `null` — check the previous step's response shape                            |
| `Cannot delete: still referenced by ...`              | Teardown ran out of order — delete the named dependent first                                                       |
| Fuzzy search returns nothing                          | Query too far from the title/description text; threshold is intentionally strict                                   |

**Server**: `hono/` via `@hono/node-server`, port `8787`, env file
`hono/.env`. **Auth cookie**: `sb-auth-token` (HttpOnly, `SameSite=Lax`,
`Path=/`). **CORS**: `http://localhost:3000`, `http://localhost:5173`, and a
placeholder Vercel origin — browser clients need `credentials: true`.