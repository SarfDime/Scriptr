# API Testing Guide

A self-contained walkthrough: create every piece of test data from scratch,
exercise every route against it, then tear it all down. No pre-loaded seed
required — every ID used later is captured from an earlier response.

Run each block in order from a shell with `curl` and `jq`. Start the API
first:

```bash
corepack pnpm dev:hono
BASE=http://localhost:8787/api
```

Catalog routes are admin-only and need a ten-minute access token. `ADMIN_TOTP_SECRET`
must be set in `hono/.env` (restart the server after adding it) and enrolled in
an authenticator app (`corepack pnpm --filter @scriptr/api admin:totp` prints a
fresh secret and its `otpauth` URI). Trade the current code for a token:

```bash
CODE=<current six-digit code>
TOKEN=$(curl -s -X POST $BASE/sanity/access \
  -H "Content-Type: application/json" \
  -d "{\"code\":\"$CODE\"}" | jq -r '.token')
```

Re-run that when a catalog call answers `401` — the token lasts ten minutes.

Confirming the Phase 2 accounts by hand and deleting them at teardown use
Supabase's admin API, which needs the service key:

```bash
SUPABASE_URL=<value of SUPABASE_URL>
SERVICE_KEY=<value of SUPABASE_SECRET_KEY>
```

IDs are UUIDs. Slug-style IDs will 404 or 500 — there's no fallback.

---

## Phase 1 — Build the catalog

Each entity is created, then immediately re-fetched — with nothing else in
the database yet, a bad create or a broken embed is obvious immediately.

```bash
# University
UNI=$(curl -s -X POST $BASE/sanity/universities \
  -H "x-admin-token: $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Test University"}' | jq -r '.university.id')

curl -s $BASE/sanity/universities -H "x-admin-token: $TOKEN" | jq '.[] | {id, name}'
curl -s $BASE/sanity/universities/$UNI -H "x-admin-token: $TOKEN" | jq '{id, name, faculties, r2_bucket_id}'
```

```bash
# University update + sync (what the Studio "Sync with Database" action calls)
curl -s -X PATCH $BASE/sanity/universities/$UNI \
  -H "x-admin-token: $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Test University (renamed)"}' | jq .
curl -s -X POST $BASE/sanity/universities/$UNI/sync \
  -H "x-admin-token: $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Test University"}' | jq .

# Invalid bucket name is rejected (must match S3/R2 naming rules) — expect 400.
# Invalid bucket names are rejected by the admin write path.
curl -s -X PATCH $BASE/sanity/universities/$UNI \
  -H "x-admin-token: $TOKEN" -H "Content-Type: application/json" \
  -d '{"r2_bucket_id":"Bad_Bucket"}' | jq .
```

```bash
# Faculty
FAC=$(curl -s -X POST $BASE/sanity/faculties \
  -H "x-admin-token: $TOKEN" -H "Content-Type: application/json" \
  -d "{\"name\":\"Test Faculty\",\"university_id\":\"$UNI\"}" | jq -r '.faculty.id')

curl -s $BASE/sanity/faculties -H "x-admin-token: $TOKEN" | jq '.[] | {id, name, subject_count, professor_count}'
curl -s $BASE/sanity/faculties/$FAC -H "x-admin-token: $TOKEN" | jq '{id, name, university, studies, professors}'

# Dependency check: the university now has a faculty, so deleting it must be blocked (409)
curl -s -i -X DELETE $BASE/sanity/universities/$UNI -H "x-admin-token: $TOKEN" | head -n 1
```

```bash
# Study
STUDY=$(curl -s -X POST $BASE/sanity/studies \
  -H "x-admin-token: $TOKEN" -H "Content-Type: application/json" \
  -d "{\"name\":\"Test Study\",\"faculty_id\":\"$FAC\"}" | jq -r '.study.id')

curl -s $BASE/sanity/studies -H "x-admin-token: $TOKEN" | jq '.[] | {id, name, subject_count}'
curl -s $BASE/sanity/studies/$STUDY -H "x-admin-token: $TOKEN" | jq '{id, name, faculty, subjects, professors}'
```

```bash
# Subject
SUBJ=$(curl -s -X POST $BASE/sanity/subjects \
  -H "x-admin-token: $TOKEN" -H "Content-Type: application/json" \
  -d "{\"name\":\"Test Subject\",\"study_id\":\"$STUDY\"}" | jq -r '.subject.id')

curl -s $BASE/sanity/subjects -H "x-admin-token: $TOKEN" | jq '.[] | {id, name}'
curl -s $BASE/sanity/subjects/$SUBJ -H "x-admin-token: $TOKEN" | jq '{id, name, study, professors, scripts}'
```

```bash
# Two professors (need two to exercise many-to-many properly)
PROF1=$(curl -s -X POST $BASE/sanity/professors \
  -H "x-admin-token: $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Dr. Test One"}' | jq -r '.professor.id')
PROF2=$(curl -s -X POST $BASE/sanity/professors \
  -H "x-admin-token: $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Dr. Test Two"}' | jq -r '.professor.id')

curl -s $BASE/sanity/professors -H "x-admin-token: $TOKEN" | jq '.[] | {id, name}'
```

```bash
# Wire PROF1 into the hierarchy and confirm the joins/counts update
curl -s -X POST $BASE/sanity/professors/$PROF1/faculties/$FAC -H "x-admin-token: $TOKEN"
curl -s -X POST $BASE/sanity/professors/$PROF1/studies/$STUDY -H "x-admin-token: $TOKEN"
curl -s -X POST $BASE/sanity/subjects/$SUBJ/professors/$PROF1 -H "x-admin-token: $TOKEN"

curl -s $BASE/sanity/faculties/$FAC -H "x-admin-token: $TOKEN" | jq '.professors'
curl -s $BASE/sanity/subjects/$SUBJ -H "x-admin-token: $TOKEN" | jq '.professors'
curl -s $BASE/sanity/professors/$PROF1 -H "x-admin-token: $TOKEN" | jq '{faculties, studies, subjects}'
```

---

## Phase 2 — Accounts

Two fixed local accounts, so permission boundaries are actually testable in
later phases: one regular user, one promoted to admin.

| Role    | Email                | Username     | Password       |
| ------- | -------------------- | ------------ | -------------- |
| student | `student@test.local` | `localstudent` | `REDACTED_LOCAL_TEST_PASSWORD` |
| admin   | `admin@test.local`   | `localadmin`   | `REDACTED_LOCAL_TEST_PASSWORD` |

Both are local-only (`@test.local`); the password is deliberately trivial.
It has to satisfy `validateNewPassword` — 8+ characters with a lowercase,
an uppercase, a digit and a symbol — which is why the older `REDACTED_LOCAL_TEST_PASSWORD`
examples no longer register.

Registration takes only `email`, `password`, `username` and `full_name`;
academic selections are set separately in Phase 3.

```bash
# Create the two accounts. Once they exist this answers 409 for each — that is
# expected, so on a re-run skip to the login block below.
curl -s -c cookies-student.txt -X POST $BASE/auth/register -H "Content-Type: application/json" \
  -d '{"email":"student@test.local","password":"REDACTED_LOCAL_TEST_PASSWORD","username":"localstudent","full_name":"Test Student"}'
curl -s -c cookies-admin.txt -X POST $BASE/auth/register -H "Content-Type: application/json" \
  -d '{"email":"admin@test.local","password":"REDACTED_LOCAL_TEST_PASSWORD","username":"localadmin","full_name":"Test Admin"}'

# Missing a required field — expect 400
curl -s -X POST $BASE/auth/register -H "Content-Type: application/json" \
  -d '{"email":"incomplete@test.local","password":"REDACTED_LOCAL_TEST_PASSWORD"}' | jq .

# Duplicate username (409, field: username) and duplicate email (409, field:
# email) — each needs a different email so the other field is what collides
curl -s -X POST $BASE/auth/register -H "Content-Type: application/json" \
  -d '{"email":"other@test.local","password":"REDACTED_LOCAL_TEST_PASSWORD","username":"localstudent","full_name":"Duplicate User"}' | jq .
curl -s -X POST $BASE/auth/register -H "Content-Type: application/json" \
  -d '{"email":"student@test.local","password":"REDACTED_LOCAL_TEST_PASSWORD","username":"otherstudent","full_name":"Other Student"}' | jq .

# Disposable-email rejection — expect 400
curl -s -X POST $BASE/auth/register -H "Content-Type: application/json" \
  -d '{"email":"test@mailinator.com","password":"REDACTED_LOCAL_TEST_PASSWORD","username":"disposableuser","full_name":"Disposable User"}' | jq .
```

> Local Supabase only demands email confirmation when the running stack
> predates `[auth.email] enable_confirmations = false` in
> `hono/supabase/config.toml` — `supabase stop && supabase start` picks it up.
> If login answers `{"error":"Email not confirmed"}`, confirm both users
> without the dashboard:
>
> ```bash
> curl -s "$SUPABASE_URL/auth/v1/sanity/users?per_page=200" \
>   -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" \
>   | jq -r '.users[] | select(.email | test("@test\\.local$")) | .id' \
>   | while read -r ID; do
>       curl -s -o /dev/null -X PUT "$SUPABASE_URL/auth/v1/sanity/users/$ID" \
>         -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" \
>         -H "Content-Type: application/json" -d '{"email_confirm":true}'
>     done
> ```
>
> `POST /auth/callback` (`{ access_token, refresh_token }`) is the endpoint the
> frontend calls with the tokens from a real confirmation link; it can't be
> exercised with curl without a live link, so test it through the browser.

```bash
# Login returns the app-shaped session user (id, email, username, role, subjects, ...)
curl -s -c cookies-student.txt -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d '{"email":"student@test.local","password":"REDACTED_LOCAL_TEST_PASSWORD"}' | jq '{success, user: (.user | {id, email, username, role})}'
curl -s -c cookies-admin.txt -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@test.local","password":"REDACTED_LOCAL_TEST_PASSWORD"}' | jq '{success, user: (.user | {id, email, username, role})}'

# Bad credentials — expect 401
curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d '{"email":"student@test.local","password":"WrongPass123!"}' | jq .

STUDENT=$(curl -s -b cookies-student.txt $BASE/auth/session | jq -r '.user.id')
ADMIN=$(curl -s -b cookies-admin.txt $BASE/auth/session | jq -r '.user.id')
```

```bash
# Promote the admin account. Role changes are admin-session routes now, so the
# first admin has to be promoted out of band: service key, straight at PostgREST.
curl -s -X PATCH "$SUPABASE_URL/rest/v1/profiles?id=eq.$ADMIN" \
  -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" -d '{"role":"admin"}' | jq .
# From here on, role changes go through the website admin surface, which needs
# an admin session *and* a ten-minute unlock. This is what the /admin layout
# prompts for in the browser: exchange the current code for an HttpOnly cookie.
CODE=<current six-digit code>
curl -s -b cookies-admin.txt -c cookies-admin.txt -X POST $BASE/admin/access \
  -H "Content-Type: application/json" -d "{\"code\":\"$CODE\"}" | jq '{expiresAt}'

# Change a role while unlocked (400 without the cookie, 401 once it lapses).
curl -s -b cookies-admin.txt -X PATCH $BASE/admin/profiles/$STUDENT/role \
  -H "Content-Type: application/json" -d '{"role":"moderator"}' | jq '.profile.role'

# Confirm both sessions reflect the correct role
curl -s -b cookies-student.txt $BASE/auth/session | jq '.user.role'   # student
curl -s -b cookies-admin.txt $BASE/auth/session | jq '.user.role'     # admin
curl -s $BASE/auth/session | jq .                                     # no cookie: user is null
```

Login is limited to 10 attempts per 15 minutes per IP, and blocked attempts
keep the block in place. Run this last in the phase, otherwise the next login
answers `429`:

```bash
for i in $(seq 1 11); do curl -s -o /tmp/auth-rate-limit.json -w '%{http_code}\n' \
  -X POST $BASE/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"student@test.local","password":"WrongPass123!"}'; done | tail -n 3
```

`GET /auth/session` refreshes a valid session only when its access token
expires within 60 seconds. Access tokens are configured for one week in
`hono/supabase/config.toml`; hosted Supabase projects must have the same JWT
expiry configured in their Auth settings. If the refresh token is invalid or
expired, the endpoint clears the local session and returns `user: null`.

```bash
curl -s -b cookies-admin.txt $BASE/profiles | jq '.[] | {id, username, role}'
curl -s -o /dev/null -w '%{http_code}\n' $BASE/profiles                          # 401, admin only
curl -s -o /dev/null -w '%{http_code}\n' -b cookies-student.txt $BASE/profiles   # 403, admin only
curl -s -b cookies-student.txt $BASE/profiles/me | jq '{id, username, role}'
curl -s $BASE/profiles/username/localstudent | jq '{id, username}'
curl -s $BASE/profiles/$STUDENT/stats | jq .
```

Every profile payload carries `achievements` with each definition's `rarity`
(the single-profile endpoints and `/me` must all include it):

```bash
curl -s -b cookies-student.txt $BASE/profiles/me \
  | jq '.achievements[] | {achievement_id, earned_at, rarity: .achievement.rarity}'
curl -s $BASE/profiles/username/localstudent | jq '.achievements | length'
curl -s $BASE/profiles/$STUDENT | jq '[.achievements[].achievement.rarity] | unique'
```

Profile script summaries preserve their `comments: [{ count }]` response
shape. Counts include replies as well as root comments. If a profile query
fails because of a database error, the API returns a generic `500` rather
than exposing the underlying database message; a missing profile returns
`404`.

Public profiles include `favorite_scripts` for anonymous viewers too:

```bash
curl -s $BASE/profiles/username/localstudent | jq '.favorite_scripts | length'
```

Editing the signed-in profile (`username` is always required; the response is
`{ success, profile }`):

```bash
curl -s -b cookies-student.txt -X PATCH $BASE/profiles/me \
  -H "Content-Type: application/json" \
  -d '{"username":"localstudent","full_name":" Test Student "}' \
  | jq '.profile | {username, full_name}'   # full_name comes back trimmed

# 409 + field: username when another account already has the username
curl -s -o /dev/null -w '%{http_code}\n' -b cookies-student.txt -X PATCH $BASE/profiles/me \
  -H "Content-Type: application/json" -d '{"username":"localadmin"}'

# 400 for a missing username, a bad body, or a non-array selection list
curl -s -b cookies-student.txt -X PATCH $BASE/profiles/me \
  -H "Content-Type: application/json" -d '{"selected_faculty_ids":"x"}' | jq .

# 409 when a selected faculty id does not exist; an empty array clears them
curl -s -b cookies-student.txt -X PATCH $BASE/profiles/me \
  -H "Content-Type: application/json" \
  -d '{"username":"localstudent","selected_faculty_ids":["00000000-0000-0000-0000-000000000000"]}' | jq .
```

Changing the avatar is two calls, like a script file upload. It needs
`R2_PUBLIC_URL` set on the API (otherwise both calls answer `503`) and the
optimizer reachable (`OPTIMIZER_URL`/`OPTIMIZER_SECRET`); the in-process
stand-in can't crop, so it doesn't serve avatars.

```bash
# Any image works; the API crops it square at 320 px and stores WebP whatever was sent.
# A 1x1 PNG, base64-encoded, keeps this dependency-free.
printf '%s' 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' \
  | base64 -d > /tmp/avatar.png
SIZE=$(wc -c < /tmp/avatar.png | tr -d ' ')

# Step 1: presigned PUT into the bucket's staging/ prefix
AV=$(curl -s -b cookies-student.txt -X POST $BASE/profiles/me/avatar/upload-url \
  -H "Content-Type: application/json" -d "{\"name\": \"avatar.png\", \"size\": $SIZE}")
echo $AV | jq .            # { success, upload: { stagingKey, url, contentType } }

# Step 2: PUT the bytes, then upload. The response names the public URL.
curl -s -X PUT "$(echo $AV | jq -r '.upload.url')" \
  -H "Content-Type: $(echo $AV | jq -r '.upload.contentType')" --data-binary @/tmp/avatar.png
curl -s -b cookies-student.txt -X POST $BASE/profiles/me/avatar \
  -H "Content-Type: application/json" \
  -d "{\"stagingKey\": \"$(echo $AV | jq -r '.upload.stagingKey')\"}" | jq .   # { success, avatarUrl }
curl -s -b cookies-student.txt $BASE/profiles/me | jq -r '.avatar_url'          # same URL, stored on the profile

# Rejections: an unsupported extension or a file over 10 MB fails at step 1 with a 400;
# a key that isn't yours or wasn't uploaded fails at step 2 with a 400 and keeps the old avatar.
curl -s -b cookies-student.txt -X POST $BASE/profiles/me/avatar/upload-url \
  -H "Content-Type: application/json" -d '{"name": "avatar.gif", "size": 100}' | jq .
# Both calls share a limit of 20 per 10 minutes per user (429 beyond that).
```

The object is always `avatars/{userId}.webp`, in the same bucket as script
files, so uploading again overwrites the picture and only the `?v=` on
`avatar_url` changes — fetch the old URL and you get the new image, fetch the
new one and you bypass any cached copy. The URL is public and unsigned, so
`curl` on it works without a cookie.

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
# Accepted extensions are pdf, jpg, jpeg, png, webp, md, docx, xlsx. .txt, .doc and .xls are
# rejected, so use a .md file here.
echo "# Test script content" > /tmp/test-script.md
echo "# Second file" > /tmp/test-script-2.md
SIZE1=$(wc -c < /tmp/test-script.md | tr -d ' ')
SIZE2=$(wc -c < /tmp/test-script-2.md | tr -d ' ')

# Upload step 1: presigned PUT URLs. Send name + size only; subjectId scopes the R2 bucket and key prefix.
URLS=$(curl -s -b cookies-student.txt -X POST $BASE/file-ops/upload-urls -H "Content-Type: application/json" -d "{
  \"subjectId\": \"$SUBJ\",
  \"files\": [{\"name\": \"test-script.md\", \"size\": $SIZE1}, {\"name\": \"test-script-2.md\", \"size\": $SIZE2}]
}")
echo $URLS | jq .                                    # { success, uploads: [{ stagingKey, url, contentType }, ...] }

# Upload step 2: PUT each file straight to R2. The returned contentType is part of the signature.
curl -s -X PUT "$(echo $URLS | jq -r '.uploads[0].url')" -H "Content-Type: $(echo $URLS | jq -r '.uploads[0].contentType')" --data-binary @/tmp/test-script.md
curl -s -X PUT "$(echo $URLS | jq -r '.uploads[1].url')" -H "Content-Type: $(echo $URLS | jq -r '.uploads[1].contentType')" --data-binary @/tmp/test-script-2.md

# Upload step 3: finalize. Send each staging key with the file's original name (the stored display
# name is derived from it); runs the optimizer and returns the stored files.
UPLOAD=$(curl -s -b cookies-student.txt -X POST $BASE/file-ops/finalize -H "Content-Type: application/json" -d "{
  \"subjectId\": \"$SUBJ\",
  \"files\": [
    {\"stagingKey\": \"$(echo $URLS | jq -r '.uploads[0].stagingKey')\", \"name\": \"test-script.md\"},
    {\"stagingKey\": \"$(echo $URLS | jq -r '.uploads[1].stagingKey')\", \"name\": \"test-script-2.md\"}
  ]
}")
echo $UPLOAD | jq .                                  # { success, files: [{ fileKey, fileType, fileSizeBytes, bucket, fileName }, ...] }
echo $UPLOAD | jq '.files | length'                  # 2
echo $UPLOAD | jq -r '.files[0].fileKey'             # {facultyId}/{studyId}/{subjectId}/{userId}/{uuid}.md
echo $UPLOAD | jq -r '.files[].fileName'             # test-script, test-script-2 (kebab-case, no extension)

# Rejections: .doc/.xls (or any unsupported extension) and files over their limit (3.5 MB, or 20 MB for
# PDFs and images) fail at step 1 with a 400
curl -s -b cookies-student.txt -X POST $BASE/file-ops/upload-urls -H "Content-Type: application/json" -d '{"files": [{"name": "old.doc", "size": 100}]}' | jq .   # { error: "Unsupported file type (.doc)" }
# A key that isn't yours, never uploaded, or expired fails at step 3 with a 400; a file whose bytes
# don't match its extension (e.g. a PNG renamed to .pdf) fails with a 400 and nothing is kept.
# upload-urls is limited to 30 calls and finalize to 15 per 10 minutes per user (429 beyond that).
# POST /scripts with a file whose bucket or key is outside your own scope (e.g. another user's key)
# is rejected with 400 "Invalid upload request"; a file that isn't in R2 gets a 400 too. Nothing is deleted,
# and the size stored is the one R2 reports.

# files array is passed to POST /scripts exactly as returned (fileKey, fileType, fileSizeBytes, bucket)
FILES=$(echo $UPLOAD | jq -c '.files')

SCRIPT=$(curl -s -b cookies-student.txt -X POST $BASE/scripts -H "Content-Type: application/json" -d "{
  \"title\": [{\"_type\":\"block\",\"style\":\"normal\",\"markDefs\":[],\"children\":[{\"_type\":\"span\",\"text\":\"Test Script Title\",\"marks\":[]}]}],
  \"subject_id\": \"$SUBJ\",
  \"professor_id\": \"$PROF1\",
  \"files\": $FILES
}" | jq -r '.script.id')

# A script may also be created without files; omit `files` or send `[]`.
curl -s -b cookies-student.txt -X POST $BASE/scripts -H "Content-Type: application/json" -d "{
  \"title\": [{\"_type\":\"block\",\"style\":\"normal\",\"markDefs\":[],\"children\":[{\"_type\":\"span\",\"text\":\"Fileless Script\",\"marks\":[]}]}],
  \"subject_id\": \"$SUBJ\",
  \"professor_id\": \"$PROF1\",
  \"files\": []
}" | jq .

# Exam session + year: `examSession` is january/june/september or null (general)
# and `examYear` must be 2023..current year (the current year only if that
# session has already happened this year). `examYear: null` = "all years".
curl -s -b cookies-student.txt -X POST $BASE/scripts -H "Content-Type: application/json" -d "{
  \"title\": [{\"_type\":\"block\",\"style\":\"normal\",\"markDefs\":[],\"children\":[{\"_type\":\"span\",\"text\":\"June 2025 Script\",\"marks\":[]}]}],
  \"subject_id\": \"$SUBJ\",
  \"professor_id\": \"$PROF1\",
  \"exam_session\": \"june\",
  \"exam_year\": 2025,
  \"files\": []
}" | jq '{id: .script.id, session: .script.exam_session, year: .script.exam_year}'

# Out-of-range year or an unknown session — expect 400
curl -s -b cookies-student.txt -X POST $BASE/scripts -H "Content-Type: application/json" -d "{
  \"title\": [{\"_type\":\"block\",\"style\":\"normal\",\"markDefs\":[],\"children\":[{\"_type\":\"span\",\"text\":\"Future Script\",\"marks\":[]}]}],
  \"subject_id\": \"$SUBJ\",
  \"professor_id\": \"$PROF1\",
  \"exam_session\": \"june\",
  \"exam_year\": 2019
}" | jq .

# Unsupported Portable Text block type — expect 400 and no script created
curl -s -b cookies-student.txt -X POST $BASE/scripts -H "Content-Type: application/json" -d "{
  \"title\": [{\"_type\":\"image\"}],
  \"subject_id\": \"$SUBJ\",
  \"professor_id\": \"$PROF1\",
  \"files\": $FILES
}" | jq .
```

```bash
curl -s $BASE/scripts | jq 'length'                       # public: every script
curl -s -b cookies-student.txt $BASE/scripts | jq 'length' # same list; scripts are unscoped
curl -s $BASE/scripts/$SCRIPT | jq '{id, title, files}'    # each file includes bucket, ordered by position
curl -s $BASE/scripts/subject/$SUBJ | jq 'length'
curl -s "$BASE/scripts/top?limit=5" | jq 'length'
curl -s "$BASE/scripts/popular?limit=5" | jq 'length'
curl -s "$BASE/scripts/search?q=Test%20Scrpit" | jq 'length'   # misspelled on purpose — fuzzy match
curl -s -b cookies-student.txt $BASE/scripts/my-scripts | jq '.scripts | length'
```

```bash
# Pre-signed download URL (valid for 1 hour); the bucket is resolved server-side from script_files
KEY=$(curl -s $BASE/scripts/$SCRIPT | jq -r '.files[0].file_url')
curl -s "$BASE/file-ops/get-file/$KEY" | jq .
# Download variant: the signed URL carries response-content-disposition, so a
# HEAD/GET shows "attachment; filename=\"<file_name>.<ext>\"" instead of the UUID.
DL=$(curl -s "$BASE/file-ops/get-file/$KEY?download=1" | jq -r .url)
curl -sI "$DL" | grep -i content-disposition
```

```bash
# Download dedupe: unauthenticated + device id (no real IP locally, so device id drives it)
curl -s -X POST $BASE/scripts/$SCRIPT/download -H "x-device-id: test-device-1" | jq .   # counted: true
curl -s -X POST $BASE/scripts/$SCRIPT/download -H "x-device-id: test-device-1" | jq .   # counted: false

# Download dedupe: authenticated (dedupes by account instead)
curl -s -b cookies-student.txt -X POST $BASE/scripts/$SCRIPT/download | jq .            # counted: true
curl -s -b cookies-student.txt -X POST $BASE/scripts/$SCRIPT/download | jq .            # counted: false

# Author self-download: a signed-in author downloading their own script is never counted.
# OWN_SCRIPT must be a script authored by the account behind cookies-student.txt.
# No download_events row, no download_count change, no award check (download_count stays put).
curl -s -b cookies-student.txt -X POST $BASE/scripts/$OWN_SCRIPT/download | jq .       # counted: false
# Anonymous self-downloads can't be detected, so the same script with no cookie still counts.
curl -s -X POST $BASE/scripts/$OWN_SCRIPT/download -H "x-device-id: test-device-2" | jq .   # counted: true
```

```bash
curl -s -b cookies-student.txt -X PATCH $BASE/scripts/$SCRIPT -H "Content-Type: application/json" \
  -d '{"additional_reading":["https://example.com/notes"]}' | jq '.script.additional_reading'

# Remove a single uploaded file while keeping the script itself.
FILE_ID=$(curl -s -b cookies-student.txt $BASE/scripts/$SCRIPT | jq -r '.files[1].id // empty')
if [ -n "$FILE_ID" ]; then
  curl -s -b cookies-student.txt -X DELETE "$BASE/scripts/$SCRIPT/files/$FILE_ID" | jq .
  # Remaining files are renumbered: expect positions 0..n-1 with no gap.
  curl -s -b cookies-student.txt $BASE/scripts/$SCRIPT | jq '[.files[].position]'
fi

# Add more files to the existing script: upload first (the same three steps), then attach what came back.
echo "# Third file" > "/tmp/Test Script 3.md"
SIZE3=$(wc -c < "/tmp/Test Script 3.md" | tr -d ' ')
URLS3=$(curl -s -b cookies-student.txt -X POST $BASE/file-ops/upload-urls -H "Content-Type: application/json" -d "{\"subjectId\": \"$SUBJ\", \"files\": [{\"name\": \"Test Script 3.md\", \"size\": $SIZE3}]}")
curl -s -X PUT "$(echo $URLS3 | jq -r '.uploads[0].url')" -H "Content-Type: $(echo $URLS3 | jq -r '.uploads[0].contentType')" --data-binary @"/tmp/Test Script 3.md"
MORE=$(curl -s -b cookies-student.txt -X POST $BASE/file-ops/finalize -H "Content-Type: application/json" -d "{\"subjectId\": \"$SUBJ\", \"files\": [{\"stagingKey\": \"$(echo $URLS3 | jq -r '.uploads[0].stagingKey')\", \"name\": \"Test Script 3.md\"}]}")
echo $MORE | jq -r '.files[0].fileName'                # test-script-3
curl -s -b cookies-student.txt -X POST $BASE/scripts/$SCRIPT/files -H "Content-Type: application/json" \
  -d "{\"files\": $(echo $MORE | jq -c '.files')}" | jq .      # { success, files: [{ ..., position: last + 1, file_name }] }
# A non-author (and non-admin) gets 403, and the caller's own uploaded objects are removed again (a key
# under anyone else's user id is never deleted). Files outside the script's subject scope, or not in R2,
# are rejected with 400, as in POST /scripts.
# A restricted author gets 403 "restricted from adding files" (see Phase 10b).
```

---

## Phase 5 — Votes

```bash
curl -s -b cookies-admin.txt -X POST $BASE/votes/$SCRIPT | jq .   # voted: true, vote_score: 1
# SCRIPT was created by the student; this self-vote must return 403.
curl -s -b cookies-student.txt -X POST $BASE/votes/$SCRIPT | jq .
curl -s $BASE/votes/script/$SCRIPT/stats | jq .
curl -s -b cookies-admin.txt $BASE/votes/script/$SCRIPT/my-vote | jq .
curl -s -b cookies-admin.txt $BASE/votes/my-votes | jq .
curl -s -X POST -b cookies-admin.txt $BASE/votes/$SCRIPT | jq .   # voted: false, vote_score: 0 (toggle off)
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

Comment-list endpoints return two top-level comments per page by default and
include up to five immediate replies per comment before replies are paged on
demand.

```bash
COMMENT=$(curl -s -b cookies-student.txt -X POST $BASE/comments -H "Content-Type: application/json" -d "{
  \"content\": [{\"_type\":\"block\",\"children\":[{\"_type\":\"span\",\"text\":\"Great script, thanks!\"}]}],
  \"script_id\": \"$SCRIPT\"
}" | jq -r '.comment.id')

# The comment author cannot add a like or reaction to their own comment.
curl -s -b cookies-student.txt -X POST $BASE/comments/$COMMENT/like | jq . # expect 403
curl -s -b cookies-student.txt -X POST $BASE/comments/$COMMENT/reactions \
  -H "Content-Type: application/json" -d '{"reaction_type":"funny"}' | jq . # expect 403

# Comments need at least 3 characters and only allow normal text blocks — expect 400
curl -s -b cookies-student.txt -X POST $BASE/comments -H "Content-Type: application/json" -d "{
  \"content\": [{\"_type\":\"block\",\"style\":\"h1\",\"children\":[{\"_type\":\"span\",\"text\":\"No\"}]}],
  \"script_id\": \"$SCRIPT\"
}" | jq .

curl -s "$BASE/comments/script/$SCRIPT?limit=20&offset=0&sort=newest" \
  | jq '{totalCount, totalCommentCount, items: [.items[] | {id, content, reactions_count, likes_count, replies: (.replies | length), replies_has_more}]}'

# Top ranks root comments by combined heart likes and emoji reactions.
curl -s "$BASE/comments/script/$SCRIPT?sort=top" \
  | jq '{hasMore, totalCount, firstComment: .items[0].id}'

curl -s -b cookies-student.txt -X POST $BASE/comments/$COMMENT/replies -H "Content-Type: application/json" -d '{
  "content": [{"_type":"block","children":[{"_type":"span","text":"Agreed."}]}]
}' | jq -r '.reply.id'

# Replies load independently in chronological pages.
curl -s "$BASE/comments/$COMMENT/replies?limit=10&offset=0" \
  | jq '{hasMore, totalCount, items: [.items[] | {id, has_replies}]}'

# Reply target is copied from its parent; a supplied mismatched target is ignored.
# Comment/reply writes are limited to 10 per 15 minutes per account; combined
# comment likes/reactions are limited to 15 per minute per account.
# An author trying to like/react to their own comment receives 403 when adding
# engagement; existing self-engagement can still be removed.

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

# Unknown rating type — expect 400 (the type-check trigger runs before the FK)
curl -s -b cookies-student.txt -X POST $BASE/ratings/professor/$PROF1 -H "Content-Type: application/json" \
  -d '{"rating_type_id":"does_not_exist","score":3}' | jq .

# Unknown professor — expect 409 (foreign key)
curl -s -b cookies-student.txt -X POST $BASE/ratings/professor/00000000-0000-0000-0000-000000000000 -H "Content-Type: application/json" \
  -d '{"rating_type_id":"test_teaching","score":3}' | jq .

# Malformed / non-JSON body — expect 400, not 500
curl -s -b cookies-student.txt -X POST $BASE/ratings/professor/$PROF1 -H "Content-Type: application/json" \
  -d 'not json' | jq .
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

# Preferences are own-row data. Missing rows return {}, and PATCH merges.
# Preferences, /restrictions/me and /notifications share a 15 requests/min/user limit (429).
curl -s -b cookies-student.txt $BASE/profiles/me/preferences | jq .
curl -s -b cookies-student.txt -X PATCH $BASE/profiles/me/preferences \
  -H "Content-Type: application/json" \
  -d '{"preferences":{"version":1,"notifications":{"toasts":false,"achievements":"hide"}}}' | jq .
curl -s -b cookies-student.txt $BASE/profiles/me/preferences | jq .
curl -s -b cookies-student.txt -X PATCH $BASE/profiles/me/preferences \
  -H "Content-Type: application/json" \
  -d '{"preferences":{"version":1,"notifications":{"unknown":true}}}' | jq . # 400
```

---

> Admin endpoints below need a live unlock. If the last code exchange was more
> than ten minutes ago, re-run it — the cookie jar keeps the result:
> `curl -s -b cookies-admin.txt -c cookies-admin.txt -X POST $BASE/admin/access -H "Content-Type: application/json" -d "{\"code\":\"$CODE\"}"`

## Phase 9 — Flags & moderation

This is the permission-sensitive part of the API — worth confirming the
admin-vs-reporter boundary actually holds.

```bash
# The student authored both targets; self-reports must return 403.
curl -s -b cookies-student.txt -X POST $BASE/flags -H "Content-Type: application/json" -d "{
  \"target_type\": \"comment\",
  \"target_id\": \"$COMMENT\",
  \"reason\": \"Trying to report my own comment\"
}" | jq . # expect 403
curl -s -b cookies-student.txt -X POST $BASE/flags -H "Content-Type: application/json" -d "{
  \"target_type\": \"script\",
  \"target_id\": \"$SCRIPT\",
  \"reason\": \"Trying to report my own script\"
}" | jq . # expect 403

FLAG=$(curl -s -b cookies-admin.txt -X POST $BASE/flags -H "Content-Type: application/json" -d "{
  \"target_type\": \"comment\",
  \"target_id\": \"$COMMENT\",
  \"reason\": \"Testing the flag pipeline end to end\"
}" | jq -r '.flag.id')

curl -s -b cookies-student.txt $BASE/flags/my-flags | jq .
curl -s $BASE/comments/script/$SCRIPT | jq '.items[] | select(.id=="'"$COMMENT"'") | .id'  # note is_flagged isn't in the public payload

# Admin: list + resolve
curl -s -b cookies-admin.txt $BASE/flags | jq '.[] | {id, status, target_comment_id}'
curl -s -b cookies-admin.txt $BASE/flags/pending | jq 'length'
curl -s -b cookies-admin.txt $BASE/comments/flagged/all | jq 'length'   # should include $COMMENT

curl -s -b cookies-admin.txt -X PATCH $BASE/flags/$FLAG -H "Content-Type: application/json" \
  -d '{"status":"dismissed"}' | jq '.flag.status'

curl -s -b cookies-admin.txt $BASE/comments/flagged/all | jq 'length'   # back to not including it
```

### Five-distinct-reporter alert

Set `THRESHOLD_SCRIPT` to a script that none of the five reporter accounts
owns and that has not already been flagged by those accounts. Each reporter
must use a separate cookie jar:

```bash
for COOKIE in cookies-reporter-1.txt cookies-reporter-2.txt cookies-reporter-3.txt cookies-reporter-4.txt cookies-reporter-5.txt; do
  curl -s -b "$COOKIE" -X POST $BASE/flags -H "Content-Type: application/json" \
    -d "{\"target_type\":\"script\",\"target_id\":\"$THRESHOLD_SCRIPT\",\"reason\":\"Threshold alert test\"}" | jq '.success'
done

# Every admin should have one alert for the target after the fifth distinct reporter.
curl -s -b cookies-admin.txt "$BASE/notifications?is_read=false" \
  | jq '[.[] | select(.type=="flag_threshold" and .data.target_id=="'"$THRESHOLD_SCRIPT"'")] | length'

# Re-flagging after review/dismissal with an existing reporter must not increase
# the distinct count or create a second alert for an admin.
```

```bash
# A second flag, deleted by admin rather than the reporter — exercises the admin-delete branch
FLAG2=$(curl -s -b cookies-admin.txt -X POST $BASE/flags -H "Content-Type: application/json" -d "{
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

## Phase 10c — Achievement definitions

Public read is unauthenticated; writes need the admin cookie. Titles and
descriptions come from `ACHIEVEMENT_COPY` (`shared/config/achievements.ts`), so
a definition can only be created for an id that already has wording there —
`script_stack` is a seeded one, so it is the safe id for this walkthrough.
A definition nobody has earned can be deleted, so teardown is safe.

~~~bash
curl -s $BASE/achievement-definitions | jq .

# Student cannot write — expect 403
curl -s -b cookies-student.txt -X POST $BASE/achievement-definitions \
  -H "Content-Type: application/json" \
  -d '{"id":"script_stack","metric":"scripts_uploaded","threshold":3,"rarity":"uncommon"}' | jq .

# An id with no code entry — expect 400 naming ACHIEVEMENT_COPY
curl -s -b cookies-admin.txt -X POST $BASE/achievement-definitions \
  -H "Content-Type: application/json" \
  -d '{"id":"not_in_the_catalogue","metric":"scripts_uploaded","threshold":1,"rarity":"common"}' | jq .

# Admin creates one; the row picks up the catalogue wording
curl -s -b cookies-admin.txt -X POST $BASE/achievement-definitions \
  -H "Content-Type: application/json" \
  -d '{"id":"script_stack","metric":"scripts_uploaded","threshold":3,"rarity":"uncommon"}' \
  | jq '.achievement_definition | {id, title, description, rarity, threshold}'

# Duplicate id — expect 409
curl -s -b cookies-admin.txt -X POST $BASE/achievement-definitions \
  -H "Content-Type: application/json" \
  -d '{"id":"script_stack","metric":"scripts_uploaded","threshold":3,"rarity":"uncommon"}' | jq .

# Unknown rarity, then a zero threshold — each expect 400
curl -s -b cookies-admin.txt -X POST $BASE/achievement-definitions \
  -H "Content-Type: application/json" \
  -d '{"id":"script_stack","metric":"scripts_uploaded","threshold":1,"rarity":"mythic"}' | jq .
curl -s -b cookies-admin.txt -X PATCH $BASE/achievement-definitions/script_stack \
  -H "Content-Type: application/json" -d '{"threshold":0}' | jq .

# `title` is no longer a body field — it is ignored
curl -s -b cookies-admin.txt -X PATCH $BASE/achievement-definitions/script_stack \
  -H "Content-Type: application/json" -d '{"title":"Renamed","threshold":3}' \
  | jq '.achievement_definition | {title, threshold}'   # title stays the catalogue copy

# Edit rarity and threshold; profiles see the new rarity on their next read
curl -s -b cookies-admin.txt -X PATCH $BASE/achievement-definitions/script_stack \
  -H "Content-Type: application/json" \
  -d '{"rarity":"legendary","threshold":2}' | jq '.achievement_definition | {rarity, threshold}'
curl -s $BASE/profiles/username/localstudent \
  | jq '.achievements[] | select(.achievement_id == "script_stack") | .achievement.rarity'

# Delete it (nobody has earned it), then expect 404
curl -s -b cookies-admin.txt -X DELETE $BASE/achievement-definitions/script_stack | jq .
curl -s -b cookies-admin.txt -X DELETE $BASE/achievement-definitions/script_stack | jq .

# A definition somebody holds cannot be deleted — expect 409
curl -s -b cookies-admin.txt -X DELETE $BASE/achievement-definitions/first_upload | jq .
~~~

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
curl -s -b cookies-admin.txt "$BASE/restrictions/lookup?profile_id=$STUDENT" | jq .
curl -s -b cookies-admin.txt $BASE/restrictions | jq '.[] | select(.profile_id=="'"$STUDENT"'") | {active, expires_at, reason}'
curl -s -b cookies-student.txt $BASE/restrictions/me | jq .             # own status, non-null

# Re-restricting an active user changes only the reason; compare the response
# with the previous row to confirm restricted_by, created_at, and expires_at
# did not move.
curl -s -b cookies-admin.txt -X PUT $BASE/restrictions/$STUDENT -H "Content-Type: application/json" \
  -d '{"reason":"Reason update only"}' | jq '.restriction | {reason, restricted_by, created_at, expires_at}'

# Blocked while restricted — each expect 403
curl -s -b cookies-student.txt -X POST $BASE/comments -H "Content-Type: application/json" -d "{
  \"content\": [{\"_type\":\"block\",\"children\":[{\"_type\":\"span\",\"text\":\"Should be blocked\"}]}],
  \"script_id\": \"$SCRIPT\"
}" | jq .
curl -s -b cookies-student.txt -X POST $BASE/votes/$SCRIPT | jq .
# Editing their own script is blocked too: expect 403 "restricted from editing
# scripts", not a generic 500.
curl -s -b cookies-student.txt -X PATCH $BASE/scripts/$SCRIPT -H "Content-Type: application/json" \
  -d '{"additional_reading":["https://example.com/blocked"]}' | jq .

# Still allowed while restricted: favoriting, and removing own content
curl -s -b cookies-student.txt -X POST $BASE/favorites/$SCRIPT | jq .
curl -s -b cookies-student.txt -X DELETE $BASE/favorites/$SCRIPT | jq .

# Lift it
curl -s -b cookies-admin.txt -X DELETE $BASE/restrictions/$STUDENT | jq .
curl -s -b cookies-admin.txt -X DELETE $BASE/restrictions/$STUDENT | jq .   # 404: not restricted
curl -s -b cookies-student.txt $BASE/restrictions/me | jq .                  # null
```

The pure ladder cases run in `corepack pnpm --filter @scriptr/api test`:
first restriction = 14 days, second = one calendar month (clamped at month
end), third and later = permanent. For an end-to-end ladder walkthrough, let
each temporary restriction lapse before applying the next one; an early lift
is excluded from the count. The admin list keeps lapsed rows until removed.

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

# Without this the `student@test.local` / `admin@test.local` emails stay taken,
# so the next Phase 2 run registers nothing and `409`s instead
curl -s -X DELETE "$SUPABASE_URL/auth/v1/sanity/users/$STUDENT" \
  -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY"
curl -s -X DELETE "$SUPABASE_URL/auth/v1/sanity/users/$ADMIN" \
  -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY"

# Catalog, narrowest to widest
curl -s -X DELETE $BASE/sanity/professors/$PROF1/faculties/$FAC -H "x-admin-token: $TOKEN"
curl -s -X DELETE $BASE/sanity/professors/$PROF1/studies/$STUDY -H "x-admin-token: $TOKEN"
curl -s -X DELETE $BASE/sanity/subjects/$SUBJ/professors/$PROF1 -H "x-admin-token: $TOKEN"
curl -s -X DELETE $BASE/sanity/professors/$PROF1 -H "x-admin-token: $TOKEN" | jq .
curl -s -X DELETE $BASE/sanity/professors/$PROF2 -H "x-admin-token: $TOKEN" | jq .
curl -s -X DELETE $BASE/sanity/subjects/$SUBJ -H "x-admin-token: $TOKEN" | jq .
curl -s -X DELETE $BASE/sanity/studies/$STUDY -H "x-admin-token: $TOKEN" | jq .
curl -s -X DELETE $BASE/sanity/faculties/$FAC -H "x-admin-token: $TOKEN" | jq .
curl -s -X DELETE $BASE/sanity/universities/$UNI -H "x-admin-token: $TOKEN" | jq .   # now succeeds: no faculties left
```

```bash
# Confirm a clean slate
curl -s $BASE/sanity/universities -H "x-admin-token: $TOKEN" | jq 'length'   # 0
curl -s $BASE/scripts | jq 'length'                                        # 0

rm -f cookies-student.txt cookies-admin.txt /tmp/test-script.md /tmp/test-script-2.md
```

> Deleting a script (or a single script file) removes its R2 objects on a
> best-effort basis; failures are logged server-side only, so check the bucket
> for leftovers if a delete errored.

---

## Troubleshooting

| Symptom                                                    | Cause                                                                                                                           |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `{"error":"Not authenticated"}`                            | Missing `-b cookies-*.txt`, or the session expired or was cleared (access tokens last one week) — log in again                  |
| `{"error":"Access code required"}` on a catalog route      | No `x-admin-token` sent — run the token exchange in the setup block first                                                       |
| `{"error":"Access expired. Enter a new code."}`            | The ten-minute token lapsed, or `ADMIN_TOTP_SECRET` changed since it was issued — exchange a fresh code                        |
| `{"error":"Admin access code required"}` on `/api/admin/*` | No unlock cookie: run the `/api/admin/access` exchange (or send `x-admin-token`)                                                    |
| `403` on any `/api/sanity/*` or `/api/admin/*` call        | The request came from another origin, or the matching `SANITY_STUDIO_ORIGIN` / `WEBSITE_ORIGIN` is unset                       |
| `{"error":"Admin access is not configured"}` (503)         | `ADMIN_TOTP_SECRET` is unset or not base32 in `hono/.env` (restart after setting it)                                           |
| `{"error":"Forbidden"}` on `GET /sitemap/scripts`          | `x-sitemap-secret` missing or does not match `SITEMAP_SECRET`                                                                  |
| `403` on `GET /profiles`                                   | Admin only — use `cookies-admin.txt`; the listing is not public                                                                 |
| `403` on a create/update that should work                  | The account is still restricted from Phase 10b — lift it with `DELETE /restrictions/:profileId`                                 |
| `404 Route not found` on a documented endpoint             | The route file isn't mounted in `hono/src/index.ts`                                                                             |
| `invalid input syntax for type uuid`                       | A captured `jq -r` variable came back `null` — check the previous step's response shape                                         |
| `Cannot delete: still referenced by ...` / `409`           | Teardown ran out of order — delete the named dependent first                                                                    |
| `finalize` returns `This upload is unknown or has expired` | The staging key must come from your own `upload-urls` call, be PUT to R2 within 10 minutes, and not already have been finalized |
| Fuzzy search returns nothing                               | Query too far from the title/description text; threshold is intentionally strict                                                |

**Server**: `hono/` via `@hono/node-server`, port `8787`, env file
`hono/.env`. **Auth cookie**: `sb-auth-token` (HttpOnly, `SameSite=Lax`,
`Path=/`). **CORS**: the localhost ports are allowed automatically outside
production; in production only `CORS_ORIGINS` decides (see
`docs/VERCEL_DEPLOYMENT.md`), and browser clients need `credentials: true`.