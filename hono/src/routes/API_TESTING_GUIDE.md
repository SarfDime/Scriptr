# API Testing Guide

Hono API on **http://localhost:8787**. Start it from the repo root:

```bash
npm run dev:hono
```

IDs in this database are **UUIDs**. Slug IDs like `univ-001` / `fac-001` are not valid and will 404 (or 500 on UUID columns).

---

## Health

```bash
curl http://localhost:8787/
```

```json
{
  "status": "ok",
  "service": "Faculty Scripts API",
  "version": "1.0.0"
}
```

---

## Auth (cookies, not Bearer)

Protected routes use `authMiddleware`, which calls `supabase.auth.getUser()` against the **`sb-auth-token` HttpOnly cookie**. Sending `Authorization: Bearer <access_token>` is ignored and returns `401 {"error":"Not authenticated"}`.

Use a cookie jar:

```bash
# Login — save the session cookie
curl -c cookies.txt -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"redacted@example.test",
    "password":"REDACTED_LOCAL_TEST_PASSWORD"
  }' | jq '{success, user: {id: .user.id, email: .user.email}}'
```

The JSON body still includes `session.access_token` / `refresh_token`. Those are for `POST /api/auth/refresh` only, not for `Authorization` headers.

### Test account

| Field    | Value                                  |
| -------- | -------------------------------------- |
| Email    | `redacted@example.test`                   |
| Password | `REDACTED_LOCAL_TEST_PASSWORD`                   |
| Username | `localstudent`                          |
| User ID  | `00000000-0000-4000-8000-000000000000` |
| Role     | `student`                              |

Selected faculties after seed: Computer Science + Engineering.

### Current session (GET /api/auth/session)

There is **no** `GET /api/auth/me`.

```bash
curl -b cookies.txt http://localhost:8787/api/auth/session | jq .
```

Returns `user` with `id`, `email`, `username`, `role`, `completed_subject_ids`, `selected_faculty_ids`. Unauthenticated: `{ "user": null, "session": null }`.

### Logout / refresh

```bash
curl -b cookies.txt -c cookies.txt -X POST http://localhost:8787/api/auth/logout | jq .
```

```bash
curl -X POST http://localhost:8787/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"<from login session>"}' | jq .
```

### Register (POST /api/auth/register)

Requires `email`, `password`, `username`, `full_name`.

---

## Seed IDs (live)

From the loaded seed. Re-fetch lists if your DB was reseeded.

### Universities (3)

| Name                     | ID                                     |
| ------------------------ | -------------------------------------- |
| University of Technology | `ea820b10-8c0d-5922-8c32-0e205c3b3b57` |
| State University         | `b230e48c-cbc9-5f06-8a24-ef74069269ac` |
| Private Institute        | `d22140e4-736d-5cbb-826f-e7520152d44d` |

### Faculties (5)

| Name             | ID                                     | University               |
| ---------------- | -------------------------------------- | ------------------------ |
| Computer Science | `968000e6-7666-5f9e-9f0e-1634190f176a` | University of Technology |
| Engineering      | `f416f208-84ca-5a1d-b017-44d3649a4ee4` | University of Technology |
| Business         | `2010ec4e-a8d8-56d2-a386-8624089c9eea` | State University         |
| Medicine         | `29c2aad2-d70f-535c-a982-0afaec2554da` | State University         |
| Arts             | `3331ae65-0d53-542c-8880-4080bff35694` | Private Institute        |

### Professors (5)

| Name              | ID                                     |
| ----------------- | -------------------------------------- |
| Dr. Alice Johnson | `9775ee05-547d-5f4a-a8bc-a9e48364a1e7` |
| Dr. Bob Smith     | `a4e58717-d125-58f8-9933-c4829e3617a5` |
| Prof. Carol Davis | `f6394cb2-1f8d-59ce-9e81-7ef19ca2b92e` |
| Dr. David Wilson  | `e83a42de-2ce1-54dd-bce9-86fe29924c31` |
| Prof. Emma Brown  | `a2107863-abc6-596e-88de-d5101fe29a21` |

### Subjects (6)

| Name                        | Year | ID                                     | Faculty          |
| --------------------------- | ---- | -------------------------------------- | ---------------- |
| Data Structures             | 1    | `cc1e89dd-75d8-54e8-9ab5-7ba8be923783` | Computer Science |
| Web Development Basics      | 2    | `647c8285-6992-5bcd-a159-cb84aafffb3d` | Computer Science |
| Database Management Systems | 2    | `f4bce583-8cd0-5e55-a904-ecff7a0c0a95` | Computer Science |
| Advanced Algorithms         | 3    | `a3fe1c45-fb2c-5085-8fbe-80240a6887c4` | Engineering      |
| Cloud Computing             | 3    | `a23131a4-d39f-51ec-beda-8aa2cc6073ef` | Engineering      |
| Microservices Architecture  | 4    | `42ac388c-7176-5627-a917-07963b467d83` | Engineering      |

Shorthand used below:

```bash
UNI=ea820b10-8c0d-5922-8c32-0e205c3b3b57
FAC=968000e6-7666-5f9e-9f0e-1634190f176a   # Computer Science
PROF=9775ee05-547d-5f4a-a8bc-a9e48364a1e7 # Dr. Alice Johnson
SUBJ=cc1e89dd-75d8-54e8-9ab5-7ba8be923783 # Data Structures
USER=00000000-0000-4000-8000-000000000000
```

---

## Profiles

### List / lookup (public)

```bash
curl http://localhost:8787/api/profiles | jq .
curl http://localhost:8787/api/profiles/username/localstudent | jq .
curl http://localhost:8787/api/profiles/$USER | jq .
curl http://localhost:8787/api/profiles/$USER/stats | jq .
```

### Current user (auth cookie)

```bash
curl -b cookies.txt http://localhost:8787/api/profiles/me | jq .
```

### Update (PATCH /api/profiles/me)

Not `PATCH /api/profiles`. There is no `POST /api/profiles/select-faculty`.
`avatar_url` is not accepted on this endpoint.

```bash
curl -b cookies.txt -X PATCH http://localhost:8787/api/profiles/me \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Sarf Dime",
    "selected_faculty_ids": [
      "968000e6-7666-5f9e-9f0e-1634190f176a",
      "f416f208-84ca-5a1d-b017-44d3649a4ee4"
    ],
    "completed_subject_ids": [
      "cc1e89dd-75d8-54e8-9ab5-7ba8be923783",
      "647c8285-6992-5bcd-a159-cb84aafffb3d"
    ]
  }' | jq .
```

`PATCH /api/profiles/:id/role` does not exist on the public API. Role changes are internal-only and must be sent to `/api/internal/profiles/:id/role` with the `x-internal-secret` header.

---

## Public catalog

No auth required.

```bash
curl http://localhost:8787/api/universities | jq .
curl http://localhost:8787/api/universities/$UNI | jq .

curl http://localhost:8787/api/faculties | jq .
curl http://localhost:8787/api/faculties/$FAC | jq .

curl http://localhost:8787/api/professors | jq .
curl http://localhost:8787/api/professors/$PROF | jq .

curl http://localhost:8787/api/subjects | jq .
curl "http://localhost:8787/api/subjects/year/1" | jq .
curl http://localhost:8787/api/subjects/$SUBJ | jq .
```

Expected counts after seed: universities **3**, faculties **5**, professors **5**, subjects **6**.

---

## Scripts

List/get/top/popular/by-subject are **public**. If a session cookie is present, list/top/popular/by-subject are filtered to the user’s selected faculties. This test user sees **5** scripts (CS + Engineering). Unauthenticated list returns all scripts (**6** in seed).

```bash
curl http://localhost:8787/api/scripts | jq 'length'
curl -b cookies.txt http://localhost:8787/api/scripts | jq 'length'   # 5

curl -b cookies.txt "http://localhost:8787/api/scripts/top?limit=10" | jq .
curl -b cookies.txt "http://localhost:8787/api/scripts/popular?limit=10" | jq .
curl http://localhost:8787/api/scripts/subject/$SUBJ | jq .
```

Pick a real script id from the list:

```bash
SCRIPT=$(curl -s http://localhost:8787/api/scripts | jq -r '.[0].id')
curl http://localhost:8787/api/scripts/$SCRIPT | jq .
```

### Create (auth)

Required: `title`, `subject_id` (or `subjectId`), `professor_id`, `faculty_id`, `fileKey` (or `file_url`), `fileType` (`pdf` | `jpg` | `jpeg` | `png` | `webp`).

```bash
curl -b cookies.txt -X POST http://localhost:8787/api/scripts \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"My Study Notes\",
    \"description\": \"Notes for Data Structures\",
    \"subject_id\": \"$SUBJ\",
    \"professor_id\": \"$PROF\",
    \"faculty_id\": \"$FAC\",
    \"fileKey\": \"s3://bucket/my-file.pdf\",
    \"fileType\": \"pdf\"
  }" | jq .
```

`PATCH /api/scripts/:id` and `DELETE /api/scripts/:id` are author or moderator.

### Broken routes (do not use yet)

These are registered **after** `GET /:id`, so the path segment is treated as a script UUID:

| Path                             | What happens |
| -------------------------------- | ------------ |
| `GET /api/scripts/search?q=data` | 404          |
| `GET /api/scripts/my-scripts`    | 404          |
| `GET /api/scripts/flagged/all`   | 404          |

---

## Comments

```bash
curl http://localhost:8787/api/comments | jq .
curl http://localhost:8787/api/comments/professor/$PROF | jq .
curl http://localhost:8787/api/comments/user/$USER | jq .

curl -b cookies.txt -X POST http://localhost:8787/api/comments \
  -H "Content-Type: application/json" \
  -d "{\"content\":\"Great professor, clear lectures.\",\"professor_id\":\"$PROF\"}" | jq .
```

`PATCH` / `DELETE /api/comments/:id` are author (delete also allows moderator).

---

## Votes

```bash
curl http://localhost:8787/api/votes | jq .
curl http://localhost:8787/api/votes/script/$SCRIPT | jq .
curl http://localhost:8787/api/votes/script/$SCRIPT/stats | jq .
curl http://localhost:8787/api/votes/user/$USER | jq .
curl -b cookies.txt http://localhost:8787/api/votes/my-votes | jq .
curl -b cookies.txt http://localhost:8787/api/votes/script/$SCRIPT/my-vote | jq .
```

### Vote (currently broken)

```bash
curl -b cookies.txt -X POST http://localhost:8787/api/votes/$SCRIPT/vote \
  -H "Content-Type: application/json" \
  -d '{"value":1}' | jq .
```

Returns **500** `permission denied for table scripts`. The handler writes a `votes` row, then updates `scripts.vote_score`; that update is denied. `value` must be `1` or `-1`. Toggle same value to unvote.

```bash
curl -b cookies.txt -X DELETE http://localhost:8787/api/votes/$SCRIPT | jq .
```

---

## Internal admin

Requires header `x-internal-secret` matching `INTERNAL_API_SECRET` in `hono/.env`.

That variable is **not set** in the current env file, so every internal call returns **403 Forbidden** until you add it and restart the server.

```bash
# After INTERNAL_API_SECRET is set:
curl http://localhost:8787/api/internal/universities \
  -H "x-internal-secret: $INTERNAL_API_SECRET" | jq .

curl -X POST http://localhost:8787/api/internal/universities \
  -H "x-internal-secret: $INTERNAL_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"name":"New University"}' | jq .

curl -X PATCH http://localhost:8787/api/internal/profiles/$USER/role \
  -H "x-internal-secret: $INTERNAL_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"role":"moderator"}' | jq .
```

| Method       | Path                                                 | Body                                                                                 |
| ------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------ |
| GET/POST     | `/api/internal/universities`                         | `{ "name" }`                                                                         |
| PATCH/DELETE | `/api/internal/universities/:id`                     | `{ "name" }`                                                                         |
| GET/POST     | `/api/internal/faculties`                            | `{ "name", "university_id" }`                                                        |
| PATCH/DELETE | `/api/internal/faculties/:id`                        | `{ "name", "university_id" }`                                                        |
| GET/POST     | `/api/internal/professors`                           | `{ "name", "picture_url?", "bio?", "faculty_ids?" }`                                 |
| PATCH/DELETE | `/api/internal/professors/:id`                       | `{ "name", "picture_url", "bio" }`                                                   |
| POST/DELETE  | `/api/internal/professors/:id/faculties/:facultyId`  | —                                                                                    |
| GET/POST     | `/api/internal/subjects`                             | `{ "name", "year", "exam_session", "faculty_id", "description?", "professor_ids?" }` |
| PATCH/DELETE | `/api/internal/subjects/:id`                         | same fields, partial                                                                 |
| POST/DELETE  | `/api/internal/subjects/:id/professors/:professorId` | —                                                                                    |
| PATCH        | `/api/internal/profiles/:id/role`                    | `{ "role": "student"                                                                 | "moderator" }` |

---

## Loading test data

1. Supabase Dashboard → SQL Editor → run `hono/supabase/seed-test-data.sql` (UUID seed used by the live DB) or `test-data.sql` (slug IDs — **will not match** a UUID `id` column).
2. Confirm: `SELECT COUNT(*) FROM universities;`

---

## Suggested workflow

1. Start the API (`npm run dev:hono`).
2. Login with `-c cookies.txt`.
3. `GET /api/auth/session` and `GET /api/profiles/me`.
4. Browse catalog with real UUIDs.
5. Create a script, then a professor comment.
6. Skip vote until the `scripts.vote_score` permission issue is fixed.
7. Logout and confirm `GET /api/profiles/me` is 401.

---

## Troubleshooting

### `{"error":"Not authenticated"}`
You used a Bearer token, skipped `-b cookies.txt`, or the cookie expired (~1 hour). Login again with `-c cookies.txt`.

### `{"error":"Route not found"}` / 404 on `/api/auth/me` or `PATCH /api/profiles`
Those paths do not exist. Use `/api/auth/session` and `PATCH /api/profiles/me`.

### `invalid input syntax for type uuid`
You passed a slug (`prof-001`). Use a UUID from the tables above.

### Internal `403 Forbidden`
`INTERNAL_API_SECRET` missing or header mismatch. Header name is `x-internal-secret`.

### Empty catalog
Seed is not loaded.

### CORS
Allowed origins in `hono/src/index.ts`: `http://localhost:3000`, `http://localhost:5173`, and a placeholder Vercel origin. Browser clients must send `credentials: true`.

---

## Notes

- Cookie name: `sb-auth-token` (HttpOnly, `SameSite=Lax`, `Path=/`)
- Server: `hono/` via `@hono/node-server`, port `8787`
- Env file: `hono/.env` (loaded by `node --env-file=.env`)
