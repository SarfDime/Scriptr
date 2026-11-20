# Users, Auth, Roles & Access

## Auth

- Supabase Auth through a cookie; no Bearer path. `scriptr.uk` and `api.scriptr.uk` are
  same-site: the API sets `sb-auth-token` with `Domain=${COOKIE_DOMAIN}` (`.scriptr.uk`),
  `SameSite=Lax`, `Secure`, `HttpOnly`, so the browser and Server Components (which forward
  it with `getRequestCookieHeader`) both see it. Unset locally; `*.vercel.app` previews are
  cross-site and get no cookie.
- Access tokens use the one-week maximum lifetime (`hono/supabase/config.toml`; hosted
  projects need the same Auth setting).
- Routes: register, login, logout, session, and `/auth/callback`, which `useAuthCallback`
  calls with tokens from the email-confirmation fragment (implicit flow, no PKCE).
  `/login`, `/callback` and `/session` return one app-shaped user (id, email, username,
  role, subjects, selected faculty/study ids), so the client never refetches the session
  after login. `/session` refreshes only when the token expires within 60 s; a protected
  client action that gets a 401 refreshes and retries once, then signs out with a notice.
  A DB trigger creates the profile on signup.

## Academic setup

- A profile is per study, so setup runs inside one: `/start` picks university → faculty →
  study and hands off to `/study/[siteSlug]/academic-setup`, which asks for that study's
  years and subjects only. A study the reader already belongs to stays selectable but
  cannot be continued into — Continue is disabled and the note links to that study's setup
  (`studyPickerQuery` carries `dbId` to match `selected_study_ids`).
- A signed-in reader's answers persist to `profile_studies`/`profile_subjects`; a guest's
  live in `lib/study-setup-storage.ts` keyed by study id, and `lib/study-setup-sync.ts`
  applies them after register or sign-in.
- The setup page is the only study surface that reads the session (every other study page
  is static and asks client-side): a member is _updating_ the profile, so the heading
  changes, completed subjects are pre-ticked, a year is finished when all its subjects are,
  and saving applies a diff — new ticks are written and unticked completed subjects are
  deleted (`removeProfileSubject`). Its header carries **Set up another study** (the only
  route from inside a study to the catalog picker); **Edit academics** opens the newest
  study's setup (`getStudySetupUrl`). No onboarding modal, no global editor; registration
  carries no academic profile. `useSubjectCompletion` is shared with the form; copy is
  `UI_STRINGS.onboarding`. Signup still generates a notification.

## Roles and restrictions

- `profiles.role` is `student`, `moderator` or `admin`. Only `admin` is privileged: full CRUD
  on scripts/comments/profiles, flag resolution, rating types, restrictions, the moderation
  UI, the user manager, announcements. The admin layout 404s a non-admin and hides the nav
  entry; API authorization and RLS remain the boundary.
- `role` has no `authenticated` grant, so it changes only through the service-role client
  (`PATCH /api/admin/profiles/:id/role`); granting it back would let a user promote
  themselves. Moderators have no elevated access.
- Guests browse, preview and download. Upload, like, comment, save, rate and flag need auth.
- `profile_restrictions` has one row per user, active while `expires_at` is `null` or later;
  `is_restricted()` ignores expired rows. Each application is recorded in
  `profile_restriction_history`; the ladder (14 days, one calendar month, then permanent)
  counts history that was not lifted early. Reapplying to an active restriction updates
  only its reason; lifting marks the latest history row `lifted_early_at`; removing an
  expired row does not affect the ladder.
- A restricted user cannot create or update scripts, comments, flags, comment
  reactions/likes, votes or ratings, but can delete their own content. Favorites are exempt.

## Profile data

- `profile_id = auth.uid()` RLS tables. `PATCH /profiles/me` writes the row and both
  selection lists through `sync_profile_selections`, one transaction; an admin editing
  another user uses the service-role client (those tables have no admin RLS path), and an
  admin delete removes the profile, its avatar and, through Supabase's admin API, the Auth
  login.
- Subject selection carries a status (`completed` | `currently_taking`) and is written per
  subject. `currently_taking` rows are not relied on for display: profile pages derive
  "currently taking" from the non-completed subjects of the selected studies.
- `ProfilePage` is the one layout for `/user` and `/user/[username]`, a Server Component on
  both: the loader reads profile, stats, affiliations and subjects and passes them in
  (`isOwner` adds edit actions). The public page redirects to `/user` for the viewer's own
  username; `/user` shows an edit because the form calls `router.refresh()` after saving
  (`useEditProfileForm`), and `ProfileProvider` still feeds the navbar.
- Favorites and subjects are public: `script_favorites` is publicly readable and the
  public profile endpoint returns subjects. Academic links are built from Sanity slugs
  through the catalog (`buildProfileAcademics`), not Postgres ids; a favorited or authored
  script links to its study's site (`getScriptSitePath`).

## Avatars

- `profiles.avatar_url` is a full public URL, not an R2 key: it is used directly as an
  image `src` on cached pages, where a signed URL would expire inside the cache.
- Upload is two calls: `POST /profiles/me/avatar/upload-url` presigns a PUT into
  `staging/{userId}/`, the browser sends the photo straight to R2, and
  `POST /profiles/me/avatar` runs the optimizer's avatar profile (EXIF-oriented, cropped
  square around the most interesting region at 320 px, metadata stripped, WebP ≤200 KB,
  aiming for 100 KB; `shared/config/avatar.ts`).
- Stored in the **same bucket as script files** at `avatars/{userId}.webp` — one key per
  user, overwritten each change — while the profile stores
  `${R2_PUBLIC_URL}/avatars/{userId}.webp?v={version}`. The key never changes, so `?v=`
  gives browser and CDN caches a new URL; R2 ignores the query. Account deletion removes
  the key.
- A public bucket domain means script objects are readable by key (they stay random UUIDs,
  only handed out with a script). The URL renders with `next/image`'s `unoptimized`, so the
  image quota is not spent and `remotePatterns` is not the backstop — the column grant is:
  `avatar_url` is written only with the service-role client, and `authenticated` has no
  `INSERT`/`UPDATE` on it. Without `R2_PUBLIC_URL`, avatar uploads answer `503` rather than
  storing an uncropped photo.

## Preferences

`profile_preferences` is an own-row RLS table, separate from the publicly readable
`profiles`: a versioned v1 shape controlling optional toast delivery and achievement
notifications, defaults when the row is missing. Restriction and moderation notices are
never configurable.

## Achievements

- `achievement_definitions` (entity type — only `profile` — metric, threshold, `rarity`,
  optional `study_id`) plus `profile_achievements` (one row per profile per achievement).
  `rarity` is one of five ordered tiers (`ACHIEVEMENT_RARITIES`, mirrored by a DB CHECK).
- An award check runs on vote, download, comment and script creation. A definition with
  `study_id` counts inside that study; a global one counts platform-wide; a mutation inside
  a study evaluates both, one outside evaluates only global definitions.
- The admin editor picks a definition's scope from the studies the operator can see. Every
  definition authored before scoping existed was moved onto LBE.
- The seeded catalogue is four metrics × five tiers, with thresholds climbing inside each
  metric and a distinct icon in `ACHIEVEMENT_ICON_OVERRIDES`.
- Title and description live in code (`ACHIEVEMENT_COPY`, resolved by `getAchievementCopy`),
  so a wording change updates badges, admin list and notification together; metric,
  threshold and rarity stay data. An id with no catalogue entry cannot be created
  (`POST /achievement-definitions` rejects it). The row keeps a copy of the text as a
  snapshot for readers of the table.
- Awards are permanent: nothing recomputes or revokes them, and deleting a script never
  removes one (an admin can delete a row through the RLS DELETE policy; there is no
  endpoint). A new or lowered definition awards on the user's next qualifying mutation, with
  no backfill. Hiding achievement notifications never suppresses awards.
- Every profile payload (`/me`, `/:id`, `/username/:username`, the list) embeds each earned
  achievement with its definition and that definition's study. Badges group by scope —
  platform-wide first, then one group per study headed by its name — and a single scope
  keeps the plain unlabelled row. `ProfileCard` takes a `badges` slot; `ProfilePage` fills
  it with `AchievementBadges` ordered by `sortAchievements` (rarest first, then newest).
  Colour comes from `ACHIEVEMENT_RARITY_PALETTES`, the icon from the metric with
  `next/lib/achievement-display.ts` overrides. Badges sit below the avatar from `lg`, beside
  it below.

## Notifications

- `notifications` (`profile_id`, `type`, `title`, `body`, `data jsonb`, `is_read`,
  `study_id`). `study_id` names the study a content notification belongs to (study
  achievement, removed script or comment, flag alert, study announcement) and stays null
  for account-wide ones; links minted for notifications use it to point at
  `/study/<site_slug>/…`.
- `GET /notifications` returns each row's study site handle. The tray on a study site shows
  that study's rows plus platform-wide ones; elsewhere it shows everything, so nothing is
  unreachable.
- An announcement addresses everyone or one study; the study variant reaches that study's
  students, admins, moderators and owners, and the insert policy lets a study admin write
  only rows naming a study they administer. `type` is unconstrained.
- Users list (filter by read state), count unread, mark one or all read, and delete their
  own. Kinds: account creation, achievements, restrictions applied/lifted, content removed,
  announcements, and admin alerts at five distinct reporters.
- The tray merges server rows with per-user local notifications, sorts unread first, caps
  its list, and refetches on mount and open (throttled to once per 15 s; the API allows 15
  requests per minute per user; no polling, realtime or focus refetch).
- The restriction notice and preferences cache in local storage
  (`next/lib/account-state-storage.ts`): read once on login, rewritten on save, refetched
  only when a cached restriction lapses or a newer restriction notification appears, and
  cleared on logout (`/restrictions/me` and `/profiles/me/preferences` are limited to 15
  requests per minute per user).
- The non-dismissible restriction notice comes from `GET /restrictions/me`, so deleting
  notification rows cannot hide it; while it is shown the dismissible `restriction_applied`
  row is hidden from the tray.

## Ratings

- Professors and subjects are rated on extensible types in `rating_types` (public read,
  admin write; each criterion's name is stored per language in `labels` and rendered in the
  reader's). One rating per user per type per entity, score 1–5, with a trigger rejecting
  target mismatches. Restricted users cannot create or change one; removal stays allowed.
- `RatingsSection` renders in the professor About card and the subject details card,
  loading criteria, stats and the viewer's scores in the browser so the pages stay static.
  The viewer's restriction comes from `GET /restrictions/me`, with a 403 on save as the
  fallback.
- Server-side criteria and stats are tagged Data Cache entries (`ratings:types`,
  `ratings:professor:<id>`, `ratings:subject:<id>`) invalidated only by a rating mutation;
  the browser always reads them fresh so averages update right after a score.
