# Scriptr: Architecture & Requirements

This describes the system as it currently stands, one file per area. Start here, then open the section you need — `§N` references elsewhere in the repo resolve to these headings. Outstanding work lives in `PROGRESS.md`; endpoint detail in [`API_DOCUMENTATION.md`](../hono/src/routes/API_DOCUMENTATION.md).

## 1. System Overview

[Open](ARCHITECTURE-SYSTEM-OVERVIEW.md) — hierarchy, the study as tenant, Sanity vs. Supabase data split, junction tables, workspace dependencies, type derivation, access control, API surface.

## 2. Academic Catalog

[Open](ARCHITECTURE-ACADEMIC-CATALOG.md) — entities, catalog routing and the study site handle, Sanity ↔ DB sync, internal-secret access model.

## 3. Scripts & Uploads

[Open](ARCHITECTURE-SCRIPTS-UPLOADS.md) — script payload, comments, file types, three-step upload pipeline, storage scoping, search, caching.

## 4. Users, Auth, Roles & Access

[Open](ARCHITECTURE-USERS-AUTH.md) — cookie auth, per-study academic setup, roles, restrictions, profiles, avatars, achievements, notifications, ratings.

## 5. Moderation

[Open](ARCHITECTURE-MODERATION.md) — flags, resolution, the admin pages, download dedupe.

## 6. Out of Scope (Current Version)

[Open](ARCHITECTURE-OUT-OF-SCOPE.md) — what the current version does not cover.

## 7. API Client & Response Typing

[Open](ARCHITECTURE-API-CLIENT.md) — no Hono RPC client, generated route paths, `apiFetch`, typed responses.

## 8. Frontend Structure & UI Conventions

[Open](ARCHITECTURE-FRONTEND.md) — thin pages, loading and 404 behaviour, failure handling, surfaces and dialogs.

## 9. Calendar

[Open](ARCHITECTURE-CALENDAR.md) — Sanity-only events, the timezone constant, the URL-encoded view, build-time alert data, client matching and per-browser dismissals.
