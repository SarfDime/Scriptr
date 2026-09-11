# Scriptr Product and Implementation Roadmap

## 1. Project goal

Scriptr is a university-focused platform for discovering and sharing scripts within a single academic context. The app stays simple, reliable, and easy to maintain, with a clean separation between editorial content (Sanity), runtime data (Supabase), and platform logic.

Confirmed for the first release: Sanity is the CMS for academic metadata, Supabase stores only lightweight runtime records, the initial rollout assumes a single university, and scripts are always tied to exactly one subject. The academic hierarchy is `University → Faculty → Study → Subject`.

---

## 2. Release scope and product assumptions

1. Expected volume is very small at launch.
2. Only scripts are searchable in the first release (details: §4.3, §6.5).
3. There is a single university in v1; it is auto-selected and read-only for users (§5.3).
4. All academic entities (university, faculty, study, subject, professor) are created from app start in both Sanity and Supabase, and changed only when a new university is added later (§5.3).
5. Scripts are always tied to exactly one subject; multi-subject scripts are out of scope. Faculty, study, and university are resolved from the subject automatically; professor is selected explicitly (full rule: §4.4.2).
6. Three user roles: normal user, moderator (global, not university-scoped), admin (full model: §3.2).
7. Guest onboarding and academic-profile data persist in local storage until account creation (full model: §5.8).
8. General flagging — covering scripts, users, and comments through a shared `flags` table with a pending/reviewed/dismissed lifecycle — is implemented in v1. Suspicious download-pattern detection is a separate, additional abuse control (full model: §4.6).
9. Download deduplication identity priority: account first, then IP, then device (§5.7).

### Product principle for v1

The first release is intentionally narrow: ship the right core product, keep the architecture clean, and defer advanced moderation/community features until the product is proven (deferred list: §8.3).

---

## 3. Product requirements

### 3.1 Core user flows

1. Browse and filter scripts by subject, professor, popularity, recency, and other metadata.
2. View subject pages (subject info, professor data, relevant scripts).
3. View professor pages (profile info, subject/study assignments, relevant scripts).
4. View faculty, study, and university pages.
5. View a script detail page (title, description, file preview, subject context, comments, metadata).
6. Create, edit, and delete own scripts.
7. View and manage own profile and uploaded content.
8. Guests can browse content and download scripts where permitted, without an account.

### 3.2 Roles, auth, and permissions

**Role model** (canonical — referenced elsewhere as "§3.2"): three roles — normal user, moderator, admin.

- Moderators are a **global** role: they can act across all universities, not scoped to one. This is a deliberate simplification given v1 has only one university anyway.
- Admins retain platform-level governance rights (escalations, edge cases, entity administration).
- Only authenticated users can create, edit, or delete scripts, or like/save/comment.
- Users manage only their own scripts unless they have moderator or admin privileges.
- Anonymous users can read public content and preview/download scripts where allowed.
- Permissions are enforced in both frontend and backend (server-side enforcement is authoritative — see §5.5.7, §6.6.1).

### 3.3 Content quality and moderation

1. Submitted scripts are validated before storage.
2. Abuse prevention focuses on suspicious download patterns and repeated spam-like activity (§4.6, §5.7).
3. The app surfaces clear auth prompts when a guest attempts a protected action (§4.8).
4. Ownership and attribution stay clear for scripts, professors, faculties, studies, universities, and subjects.
5. Moderators review and resolve abuse and flagged content across all universities (role model: §3.2); admins handle escalations.
6. Moderation actions are auditable with a clear status lifecycle (`flags.status`: pending/reviewed/dismissed).

### 3.4 Notifications and engagement

1. Users are notified when their script becomes popular, or when a moderation decision affects their content.
2. Notifications are visible in-app, structured so future email/push delivery is possible, without reworking the system.
3. Notification preferences become configurable in a later phase.
4. In v1, only a persistent, hardcoded reminder exists, for incomplete onboarding / no account (pattern detailed in §7.5).

### 3.5 Achievements and progression

1. Users unlock achievements for milestones (script uploads, like thresholds, subject engagement).
2. Achievement logic runs server-side, not only on frontend state.
3. Achievement states display on profiles and relevant pages.
4. New achievement types should be addable without a large rewrite (current implementation: a `jsonb` array on `profiles.achievements`, chosen for this flexibility).

### 3.6 Guest experience and access

1. The app is usable without an account for browsing, previewing, and downloading scripts.
2. Guests see a clear auth modal for protected actions (§4.8).
3. Guest onboarding data persists in local storage until account creation or sign-out (§5.8).
4. Download tracking avoids inflated totals from repeated requests by the same user/IP/device (§5.7).

### 3.7 Onboarding and academic-profile persistence

1. On first visit, users see an onboarding modal to select their faculty, study(s), current subjects, and completed subjects.
2. Users can complete an entire year in one action, auto-marking all relevant subjects as complete.
3. A year is marked complete once all subjects in that year (for that faculty) are complete.
4. Completed subjects and years display grouped on the profile page.
5. Guest data persists locally and migrates into the account's academic profile on sign-up (data model and exact table mapping: §5.8).
6. A dismissible, persistent reminder encourages guests to create an account to save their academic profile (pattern: §7.5).
7. Users can update their academic profile later without losing prior progress.

### 3.8 Accessibility and UX

1. Interactive states are keyboard accessible.
2. Forms include validation and guiding error states.
3. Loading, empty, and error states are visible and consistent app-wide.
4. Layout works across mobile, tablet, and desktop.
5. Visual design stays consistent with the product design system.

---

## 4. Functional requirements by feature area

### 4.1 Script features

1. List scripts with subject, professor, upload date, exam session, additional reading links, and popularity metadata.
2. Reusable script filtering/sorting logic, including by exam session and subject.
3. Dedicated script detail page: metadata, file preview, additional reading links, comments, subject context.
4. Script creation with required metadata, exam session, optional additional reading links (`text[]` of URLs), and validation (flow detail: §4.4).
5. Editing limited to title, description, and additional reading links.
6. Uploaded script files are immutable after upload.
7. Script deletion for owners and admins, with authorization checks.
8. Script uploads support PDF or image-based files only.

### 4.2 Academic entity features

1. Dedicated pages for universities, faculties, studies, subjects, and professors, using programmatic `slug` fields as the canonical route parameters (not internal Sanity IDs) — routes: `university/[slug]`, `faculty/[slug]`, `study/[slug]`, `subject/[slug]`, `professor/[slug]` (slug rules: §5.9).
2. Pages are generated from Sanity-backed academic records merged with the matching Supabase identity record.
3. Each page shows relevant script lists, related entities, and Sanity metadata (bios, descriptions).
4. All five entity types share the same page-generation model and sync lifecycle (sync rules: §5.6).

### 4.3 Search and discovery

1. Search supports scripts only in v1.
2. Local data-first search when data is already loaded in the frontend; API fallback if incomplete.
3. Proper loading, empty, and error messaging.
4. Kept simple and low-risk for the early product stage.

### 4.4 Script creation and upload flow

1. Users create a script from a dedicated create-script modal.
2. **Subject-driven resolution (canonical rule):** the user selects a single subject. Professor, faculty, study, and university are resolved automatically from that subject (`subject → study → faculty → university`, all derived, never stored redundantly on `scripts` — see §5.2.8).
3. User provides title, description, exam session, and optional additional reading links (array of URLs).
4. User uploads the script file.
5. Validation ensures all required fields are present before submission.
6. The system rejects invalid subject selection or missing university context.
7. Clear empty, loading, and validation states in the create modal.
8. Multi-subject scripts are explicitly out of scope for v1.

### 4.5 Notifications and achievements features

1. In-app notification center for user actions and status updates.
2. Triggers: script popularity, moderation decisions, account-related reminders.
3. Infrastructure stays flexible for future notification types.
4. Achievement tracking and display for milestone-based progress.

### 4.6 Moderation and abuse prevention features

**Flagging (canonical rule):** general flagging is implemented in v1 — scripts, users, and comments are all flaggable through the shared `flags` table (`target_script_id` / `target_user_id` / `target_comment_id`, each nullable so a flag targets exactly one), with a `pending → reviewed → dismissed` status lifecycle and a `reviewed_by`/`reviewed_at` audit trail. This is broader than the platform's original abuse-only scope and is treated as a deliberate, superseding decision (see §8.1.7).

1. Suspicious download patterns are detected using a lightweight abuse check, separate from flagging (§5.7).
2. The app records download attempts with account, IP, and device identity information.
3. Repeated downloads from the same identity are detected and suppressed from the public count.
4. Moderators and admins review abuse issues and flags globally (role model: §3.2).
5. Comments are flaggable via the same `flags` workflow as scripts and users.
6. The comments query returns reaction counts and like counts per comment, plus the current logged-in user's own reaction/like status when authenticated.

### 4.7 Auth modal and access prompts

1. A reusable auth modal appears when a signed-out user attempts a protected action.
2. The modal explains which actions require authentication.
3. Protected actions are blocked at both UI and backend level.
4. Triggers: script creation, likes, saves, comments.
5. Download and preview remain accessible to guests where allowed.

### 4.8 Sanity-managed academic entity administration

Applies uniformly to all five entity types: university, faculty, study, subject, professor.

1. Manageable through the Sanity admin layer using one shared pattern.
2. A Sanity document is editable without requiring a DB row to exist yet.
3. Admin flow: create/update the document in Sanity first.
4. A separate **Create in DB** action then creates the minimal database record and writes the returned DB ID back onto the Sanity document.
5. A document cannot hold duplicate DB IDs for the same entity type.
6. Publication is blocked until the DB ID exists (elaboration: §8.2).
7. Deletion is blocked unless dependency checks pass; on success, the DB record and Sanity document are removed together.

---

## 5. Data and CMS requirements

### 5.1 Content model requirements

1. Sanity is the source of truth for structured academic content (professors, subjects, studies, faculties, universities) and static page-level metadata.
2. Dynamic user-generated content (scripts, likes, saves, interactions) lives in the database.
3. Relationships are explicit and normalized between scripts, subjects, studies, professors, faculties, and universities.
4. Rich metadata (bios, descriptions, images, academic year info) lives in Sanity only.
5. The database stores only minimal identifiers and runtime data: names, IDs, states, and relationship keys.
6. All content is editable through a versioned CMS workflow.

### 5.2 Data ownership boundary

1. Sanity owns rich academic content and editorial data (subject year, semester, description, syllabus, credits, and descriptive text about professor/program affiliation).
2. Supabase owns runtime identity, script records, user relationships, moderation metadata, and access-related state — this now explicitly includes the structured professor↔faculty, professor↔study, and student↔study relationship data (`professor_faculties`, `professor_studies`, `profile_faculties`, `profile_studies`), which is relational/runtime by nature even though Sanity may separately hold descriptive text about those same affiliations.
3. The database does not store rich descriptive content (bios, description text, non-critical metadata).
4. The backend resolves the Sanity document by ID whenever the full academic record is needed.
5. The frontend never assumes the DB row is the complete source of truth for academic entity data.
6. `scripts` owns runtime script metadata: `exam_session` (categorization by exam period) and `additional_reading` (`text[]` of supplementary URLs).
7. `subjects` is minimal (names, IDs, relationships). `exam_session` belongs on scripts, not subjects; `year`/`semester` belong to Sanity. `exam_session` and `year` have been removed from the `subjects` DB table.
8. `scripts` does **not** store `faculty_id` directly. Faculty is always derived via `subject_id → study_id → faculty_id`, to avoid drift. (This column existed before `studies` was introduced, when the chain was `subject_id → faculty_id` directly; it has since been dropped.)

### 5.3 Initial university and entity assumptions

1. Only one university at launch.
2. The university is always auto-selected and read-only in the client.
3. Universities, faculties, studies, subjects, and professors are created from app start and changed only when adding a new university later.
4. The system does not rely on annual data churn for academic entities at launch.

### 5.4 Data fetching and rendering requirements

1. Data fetching is separated into CMS-backed academic content and database-backed dynamic content.
2. Server-side rendering is used where appropriate for page-level content.
3. Dynamic data is isolated into client components when needed.
4. Loading, empty, and error states are included in all data fetches.
5. Missing or stale data fails gracefully without breaking the page.

### 5.5 Data integrity requirements

1. Relationships between scripts, subjects, studies, professors, faculties, universities, and user records are validated.
2. Required fields are enforced at both schema and API levels.
3. Data is normalized so duplicate records and inconsistent references are avoided (this is why `scripts.faculty_id` was removed — see §5.2.8).
4. Download counting is not inflated by repeated requests from the same account, IP, or device (§5.7).
5. Roles and permissions are enforced server-side to prevent misuse (§3.2, §6.6).

### 5.6 Academic entity sync rules

Applies uniformly to all five entity types (§4.8 elaboration: §8.2):

1. The Sanity document is the system of record for rich academic metadata.
2. The database row is a lightweight runtime record for identity and relationship linking.
3. Creating/updating an entity in Sanity may require a DB record to exist for runtime use.
4. Sanity document updates are allowed before the DB record exists; publication is blocked until a DB ID is present.
5. When the admin chooses **Create in DB**, the system creates the DB row and writes the returned ID back onto the Sanity document.
6. The database rejects duplicate IDs for the same entity type.
7. Deletion of a Sanity-backed entity is blocked unless dependencies are safe to remove.

### 5.7 Download and abuse prevention data model

1. `download_events` records raw attempts: user identity source, script ID, and dedupe state (`identity_key`, `ip_address`, `device_id`, `user_id`).
2. Identity priority for dedup: account first, then IP, then device.
3. Download counting is deduplicated across repeated requests from the same effective identity.
4. Abuse logic stays simple and explicit rather than a complex fraud pipeline in v1.
5. Events are stored in a way that supports future analytics and auditing (append-only log; dedup happens at query/aggregation time, not by rejecting duplicate rows).

### 5.8 Academic profile data model

**"Academic profile" (canonical definition):** the combination of `profiles`, `profile_subjects`, `profile_faculties`, and `profile_studies` — not a single dedicated table. `profile_subjects.status` tracks `completed`/`currently_taking`; `profile_faculties` and `profile_studies` are many-to-many enrollment records (a student can belong to multiple faculties and studies). On account creation, the locally-stored guest onboarding state syncs into these four tables.

1. Guest academic-profile data persists in local storage until account creation.
2. The app tracks current subjects, completed subjects, faculty/study enrollment, and completed years in a structured way.
3. The profile preserves academic history even if the user later changes faculty, study, or university.
4. Completed-year state updates automatically when all subjects in the year are complete.
5. On account creation, local onboarding data migrates into `profiles` / `profile_subjects` / `profile_faculties` / `profile_studies`.

### 5.9 Programmatic slug generation requirements

1. Sanity documents for academic entities do not use Sanity IDs (`_id`) for public URLs/routing.
2. Each of the five entity types defines a `slug` field, generated programmatically from its position in the hierarchy:
   - **University**: based on name (e.g., `ukim`).
   - **Faculty**: parent university + faculty name (e.g., `ukim-pharmacy`).
   - **Study**: parent university + parent faculty + program name (e.g., `ukim-pharmacy-pharmacology`).
   - **Subject**: parent university + parent faculty + parent study + subject name (e.g., `ukim-pharmacy-pharmacology-cell-biology`).
   - **Professor**: based on name (e.g., `john-doe`).
3. Slugs are normalized, lowercase, hyphenated, and auto-generated on document creation/update.

### 5.10 Sanity typegen and in-app type synchronization

1. Re-use generated Sanity types (`sanity.types.ts`) for in-app TypeScript models wherever possible, across all five entity types.
2. Utility types (e.g. `StripSanityFields<T>`, `Dereferenced<T>`) strip Sanity system metadata (`_rev`, `_createdAt`, `_updatedAt`, etc.).
3. Sanity reference structures (`{ _type: "reference", _ref: string }`) are replaced with dereferenced domain models, including `study` references, so in-app types stay clean and type-safe.

### 5.11 Reusable academic schema components (mini-schemas)

1. Extract recurring fields across all five academic document types (`university`, `faculty`, `study`, `subject`, `professor`) into modular, reusable Sanity mini-schemas (descriptions/bios, contact/social info, media assets, academic metadata).
2. Mini-schemas enforce consistent validation, preview configuration, and fieldsets across all entity types.

### 5.12 Study architecture (resolved)

**Decision:** Study is an independent relational entity in both Supabase and Sanity, giving the hierarchy `University → Faculty → Study → Subject`. Subjects reference `study_id`; a subject's faculty and university are resolved transitively through that relationship, not stored redundantly.

This was chosen over the alternative (treating study as a tag/attribute on scripts or Sanity-only metadata) because it represents the real academic structure accurately, even though it required cascading changes across the schema, sync workflows, slug generation, routing, and onboarding — most of which are now complete (status: §9–§10, Phase 1–2).

**Cross-entity relationships added as a result:**

- `profile_studies` (`profile_id`, `study_id`) — a student can be enrolled in multiple studies. Publicly readable; a user manages their own rows.
- `professor_studies` (`professor_id`, `study_id`) — a professor can be affiliated with multiple studies, independent of which subjects they currently teach. Publicly readable; only moderators manage rows (mirrors `professor_faculties`' admin-managed pattern, since professor records are not self-managed).

Both mirror the existing `profile_faculties` / `professor_faculties` many-to-many pattern and both exist in the live schema.

---

## 6. Backend and API requirements

### 6.1 API structure

1. Clean endpoints for scripts, profiles, subjects, studies, professors, faculties, universities, and interactions.
2. Routes organized by resource and responsibility.
3. Consistent response shapes for success, validation errors, and system failures.
4. Search is built around script discovery first, not over-engineered for other content types in v1.
5. Every endpoint file carries a short doc comment above each route.
6. Professor, study, subject (excluding profile-subject), faculty, and university routes are internal-only, gated the same way as `/api/internal` — this data is admin-managed, not for direct public access.

### 6.2 Backend responsibilities

1. Handle authentication checks.
2. Validate input before writing data.
3. Enforce permissions for creation, update, deletion, and moderation.
4. Return consistent, meaningful status codes and helpful error messages.
5. Resolve the Sanity document behind any academic entity ID before returning a full entity detail payload.
6. Centralize business rules for script creation (§4.4.2), role enforcement (§3.2), and download deduplication (§5.7).

### 6.3 Script creation and upload backend requirements

1. Support creating scripts with a single subject, title, description, exam session, optional additional reading links, and uploaded file metadata.
2. Subject selection determines faculty, study, and university context automatically; professor is validated explicitly against `subject_professors` (full rule: §4.4.2).
3. Uploaded files are validated as PDF or image-based assets.
4. File content is immutable after upload; only title, description, and additional reading links are editable.
5. Reject invalid scripts or missing subject context.

### 6.4 Academic entity backend requirements

1. Academic entity endpoints accept IDs as the main lookup mechanism; public-facing routes resolve by `slug` (§5.9) and internally map to the DB ID.
2. The backend merges database identity data with Sanity metadata for all five entity types.
3. The API handles missing Sanity documents gracefully with a useful empty/error state.
4. The backend supports create, update, and delete patterns for each entity type (sync rules: §5.6).

### 6.5 Search backend requirements

1. Script search only in v1.
2. A script search endpoint exists and may be improved, staying simple and focused.
3. Frontend attempts a local search first when current script data is already in memory.
4. Loading, empty, and error states while waiting for results.
5. Kept lightweight given the small expected volume.

### 6.6 Auth and download protection backend requirements

1. Only authenticated users can create, like, save, or comment on scripts.
2. Public preview/download endpoints remain available to guests where allowed.
3. Deduplicate download counts: account → IP → device (§5.7).
4. Repeated download attempts from the same identity don't inflate popularity counts beyond reasonable thresholds.
5. Abuse logic stays simple, explicit, and easy to maintain.

### 6.7 Moderator and admin backend requirements

1. Moderators are global (role model: §3.2) — no university-scoping logic needed.
2. Admins have access to platform-level moderation actions.
3. The backend supports moderator review actions and escalation logic, including flag review (§4.6).
4. Moderation in v1 focuses on abuse/suspicious activity and flag review, not broader general-purpose moderation tooling (deferred: §8.3.2).

### 6.8 Academic onboarding and profile persistence backend requirements

1. Support local-first guest profile storage and later migration into the account profile (§5.8).
2. Store current/completed subject state, faculty enrollment, and study enrollment in structured form.
3. Support bulk year-completion state based on faculty-specific subject data.
4. Trigger a persistent reminder for guest users with incomplete onboarding state.

### 6.9 Script caching and revalidation requirements

1. Frontend fetches of script data (list, by-subject, top, popular, detail) use the Next.js Data Cache, tagged per endpoint and per query (e.g. per subject/script ID).
2. Script search results are never cached; search always hits the live dataset.
3. Requests scoped to the current user's session (e.g. "my scripts") are never cached.
4. Creating, updating, or deleting a script revalidates only the affected cache tags (its detail tag, its subject's tag, and the shared list/top/popular tags) — never the entire cache.
5. Revalidation is triggered by the backend via a shared-secret webhook to the frontend, working regardless of which client performed the mutation.

---

## 7. Frontend architecture requirements

### 7.1 UI responsibilities

1. Components manage only the UI state they own.
2. Data fetching and business rules are extracted into hooks/helpers.
3. Filtering, sorting, and transformation logic is reusable and testable.
4. The page layer orchestrates data flow instead of embedding logic in render code.

### 7.2 Academic entity page requirements

1. Universities, faculties, studies, subjects, and professors each have dynamically generated pages, routed by `slug` (§5.9) rather than internal ID.
2. Each page loads the lightweight DB record and merges in Sanity metadata for full display.
3. Empty, not-found, and loading states are present for each page.
4. Subject pages show their parent study, not just faculty.

### 7.3 Search UX requirements

1. Loading indicators; avoid flashing empty states unnecessarily.
2. Local data-first search when the current dataset is available.
3. Clear empty state when there are no script results.
4. Designed to feel fast and low-friction for a small-volume product.

### 7.4 Onboarding and profile UX requirements

1. First-visit onboarding modal collects faculty, study(s), current subjects, and completed subjects.
2. One-click completion of an academic year.
3. Profile page displays grouped completed subjects and completed years, plus faculty/study enrollment.
4. Guest users see a persistent reminder to create an account and save their academic profile (pattern: §7.5).
5. The reminder is dismissable and configurable client-side.

### 7.5 Persistent notification pattern

1. Persistent reminders are the lightweight, v1-only first step of a notification system.
2. This does not depend on the full notification engine being complete.
3. It's hardcoded to the onboarding/account-save use case and stays separate from the future full in-app notification system (§4.5, §3.4).

---

## 8. Explicit decisions and clarifications

### 8.1 Resolved decisions

1. Dynamic pages for all five entity types use programmatic slug-based routes, not internal Sanity IDs (§5.9, §7.2).
2. Search is script-only in v1, local-first with API fallback (§4.3, §6.5).
3. The app is designed for very small expected volume.
4. Role model: normal user, moderator (global), admin (§3.2).
5. Download dedup priority: account → IP → device (§5.7).
6. Scripts are single-subject only; university, study, and faculty are determined from the subject, while professor is selected explicitly from the subject's valid professors (§4.4.2).
7. **General flagging is implemented** for scripts, users, and comments via the shared `flags` table with pending/reviewed/dismissed statuses (§4.6) — this supersedes the platform's original "abuse-only, no general flagging" framing; suspicious-download detection remains a separate mechanism.
8. Guest onboarding/academic-profile data is stored in local storage only for v1, migrating into `profiles` / `profile_subjects` / `profile_faculties` / `profile_studies` on account creation (§5.8).
9. A year is marked complete when all subjects in that year, for that faculty, are complete.
10. Persistent reminders are allowed as a simple, dismissable onboarding/account-save notification, independent of a full notification system (§7.5).
11. The admin triggers the create button for academic entity creation/editing, for explicit editorial control.
12. Sanity document updates are allowed before the DB record exists, but publication is blocked until the DB ID is created (§8.2).
13. Deletion is blocked until dependency checks pass; on success, the DB record and Sanity document are removed together.
14. Slugs follow the entity hierarchy (§5.9): University (`ukim`), Faculty (`ukim-pharmacy`), Study (`ukim-pharmacy-pharmacology`), Subject (`ukim-pharmacy-cell-biology`), Professor (`john-doe`).
15. In-app TypeScript types re-use generated Sanity types where possible, via helper utility types that strip internal metadata and dereference references (§5.10).
16. Shared academic document fields are extracted into modular Sanity mini-schemas across all five entity types (§5.11).
17. `scripts` includes `additional_reading` (`text[]`) and `exam_session` (`text`) (§5.2.6).
18. `exam_session` is removed from `subjects`; it belongs on scripts only (§5.2.7).
19. `year`/`semester` are authored and owned in Sanity CMS, removed from the `subjects` DB table (§5.2.7).
20. **Study is an independent entity/table** in the `Faculty → Study → Subject` hierarchy (§5.12).
21. `profiles.role` allows `student`, `moderator`, and `admin`, matching the three-role model (§3.2).
22. **`scripts.faculty_id` has been removed** — it predated `studies` and was a redundant, unsynced column; faculty is now always derived via `subject_id → study_id → faculty_id` (§5.2.8).
23. **`profile_studies` and `professor_studies`** junction tables have been added, mirroring the `profile_faculties`/`professor_faculties` pattern, since both students and professors can be associated with multiple studies (§5.12).
24. **The live Supabase schema uses study naming throughout** — `study_programs` was renamed to `studies`, both junction tables were renamed to `profile_studies`/`professor_studies`, and all `study_program_id` columns were renamed to `study_id`.

### 8.2 Sanity/DB sync workflow elaboration

- The Sanity document is the authoring layer; the database row is the runtime linking layer.
- A content editor can create/edit a Sanity document before a DB row exists.
- A separate **Create in DB** action creates the minimal runtime row and returns the DB ID to the Sanity document.
- This avoids needing a DB row before the editorial record exists, while guaranteeing published content always has runtime identity.
- It keeps Sanity as the source of truth for descriptive content while the database stays lean for app behavior, permissions, and relationships.
- It prevents duplicate identity records, since a document type can't be assigned two different DB IDs.

### 8.3 Deferred items

Out of scope for the first release, to address after launch:

1. Comprehensive notification system beyond persistent reminder banners.
2. Large-scale moderation tooling/UI beyond the existing flags data model (the `flags` table and comment-flagging workflow are already implemented at the data layer — §4.6).
3. Advanced search beyond script search.
4. Broad non-academic CMS capabilities beyond the entity model described here.

---

## 9. Implementation priorities

### Phase 1: Database foundation and backend API

1. Configure the minimal DB schema for runtime identity and script records.
2. Implement all required database tables: `profiles`, `scripts`, `profile_subjects`, `profile_faculties`, `profile_studies`, `professor_studies`, `download_events`, and remaining relationship tables (academic profile model: §5.8). **[✅]**
3. Set up database constraints, indexes, and validation rules for data integrity.
4. Implement the script API (create, read, update, delete).
5. Implement authentication and permission checks in the backend.
6. Implement download deduplication logic (account → IP → device priority).
7. Add backend validation and error handling for all operations.
8. Add `additional_reading` (`text[]`) and `exam_session` (`text`) to `scripts`. **[✅]**
9. Remove `exam_session` and `year` from `subjects`; keep academic year data in Sanity. **[✅]**
10. Implement Study as a separate table (`Faculty → Study → Subject`). **[✅]**
11. Add `profile_studies` and `professor_studies` junction tables (composite PK, RLS: publicly readable; `profile_studies` self-managed by the owning user; `professor_studies` managed by moderators only). **[✅]**
12. Drop the stale `scripts.faculty_id` column, its FK, and its index — faculty is now derived via `subject_id → study_id → faculty_id` only. **[✅]**
13. Add `admin` to the `profiles.role` check constraint. **[✅]**
14. **Regenerate `shared/types/database.types.ts`** to reflect items 11–13, and grep `hono/` and `next/` for any remaining `scripts.faculty_id` references to remove. **[✅]**
15. Update the onboarding/profile backend to accept and persist study selection into `profile_studies`. **[✅]**
16. Update professor admin sync actions to manage `professor_studies` alongside `professor_faculties`. **[✅]**
17. Rename the live Supabase schema from study-program naming to study naming, including tables, columns, constraints, indexes, and policies. **[✅]**
18. Test database schema and API endpoints thoroughly. **[🔲]**
18. Cache script list/subject/top/popular/detail fetches in the Next.js Data Cache, tagged per endpoint/query; revalidate affected tags via a backend webhook on script create/update/delete; keep search and my-scripts uncached. **[✅]**

### Phase 2: Sanity CMS setup and academic entity management

1. Finalize the academic entity model/schema structure for Sanity. **[✅]**
2. Create Sanity document types for university, faculty, study, subject, and professor with shared validation patterns. **[✅]**
3. Define relationships/references between academic entities in Sanity, including `study` references on `subject`. **[✅]**
4. Implement the Create-in-DB action (§8.2). **[✅ Complete]**
5. Set up Sanity sync endpoints (create/update/delete DB records from CMS documents). **[✅ Mostly complete]**
6. Implement publication blocking until DB ID exists. **[✅ Complete]**
7. Implement deletion checks and cascading delete/update workflows. **[⚠️]**
8. Define the initialization set for universities, faculties, studies, subjects, and professors in Sanity. **[✅ Complete]**
9. Create the `study` Sanity schema, update subject references, adjust sync actions. **[✅]**
10. Test sync workflows for create/update/delete, across all five entity types. **[🔲 Pending, after the deletion fix]**
11. Implement programmatic `slug` generation for all five entity types, including `study` (`[uni]-[faculty]-[study]`) (§5.9). **[🔲 TODO]**
12. Create TypeScript utility types to strip Sanity metadata and dereference references, including `study` references, for in-app models (§5.10). **[🔲 TODO]**
13. Create reusable Sanity mini-schemas across all five entity types, including `study` (§5.11). **[🔲 TODO]**

### Phase 3: Core content and discovery

1. Build dynamic slug-based pages for universities, faculties, subjects, and professors. **[✅ Mostly complete — ID→slug migration pending]**
2. Add a dynamic slug-based `study/[slug]` page, following the same pattern as the other four entity types (§7.2). **[🔲 New]**
3. Update subject pages to display their parent study alongside faculty (§7.2.4). **[🔲 New]**
4. Implement script listing, sorting, and filtering. **[✅ Mostly complete]**
5. Add search for scripts (local-first + API fallback). **[🔲 Missing]**
6. Add loading, empty, and error states across pages and search. **[🔲 Missing]**
7. Transition existing ID-based routes/queries to programmatic slug-based routes. **[🔲 TODO]**

### Phase 4: User actions and uploads

1. Build the create-script modal and upload flow: title, description, exam session, additional reading links.
2. Enforce single-subject constraints; resolve faculty/study/university from the subject; explicitly select and validate the professor against `subject_professors` (§4.4.2).
3. Implement script edit/delete permissions (title, description, additional reading links only).
4. Add guest-friendly download/preview access with dedupe protection.

### Phase 5: Profile and onboarding

1. Implement first-visit onboarding for faculty and subject selection.
2. **Add study selection to onboarding**, scoped to the selected faculty. **[🔲 New]**
3. Add one-click year-completion logic and auto-complete year state.
4. Persist guest academic data in local storage.
5. Add a dismissable persistent reminder to create an account.
6. Build the profile page with grouped subject/year data, plus faculty and study enrollment.
7. Sync guest onboarding data into `profiles`, `profile_subjects`, `profile_faculties`, **and `profile_studies`** during account creation. **[Updated for studies]**

### Phase 6: Moderation and admin tools

1. Implement global moderator and admin roles with platform-wide moderation rules (§3.2, §6.7).
2. Add simple suspicious-download review flows.
3. Add admin action interfaces for academic entity creation, sync, and dependency checks across all five entity types.
4. **Add admin UI for managing `professor_studies` affiliations**, alongside the existing `professor_faculties` management. **[🔲 New]**
5. Ensure delete/update flows remain safe and auditable.
6. Make comments flaggable via the existing flags workflow. **[✅]**
7. Return reaction counts, like counts, and the current user's reaction/like status in the comments query. **[✅]**
8. Add a short doc comment above each API endpoint. **[✅]**
9. Move professor, study, subject (not profile-subject), faculty, and university routes behind internal-only access. **[Updated to include study routes]**
10. Build frontend flag submission and moderation views for scripts, users, and comments (pending/reviewed/dismissed states).

### Phase 7: Polish and iteration

1. Improve UX consistency and mobile behavior.
2. Add accessibility and validation refinements.
3. Expand the notification system after the first release.
4. Review architecture for maintainability and future scale.
5. Implement CSS obfuscation for production builds.

---

### Phase 1: Database foundation and backend API `[✏️ In Progress]`

- Configure the minimal DB schema for runtime identity and script records. **[✅]**
- Implement all required database tables (`profiles`, `scripts`, `profile_subjects`, `profile_faculties`, `profile_studies`, `professor_studies`, `download_events`, relationship tables). **[✅]**
- Set up database constraints, indexes, and validation rules. **[✅]**
- Implement the script API (CRUD). **[✅]**
- Implement authentication and permission checks. **[✅]**
- Implement download deduplication logic. **[✅]**
- Add backend validation and error handling. **[✅]**
- Add `additional_reading`/`exam_session` to `scripts`. **[✅]**
- Remove `exam_session`/`year` from `subjects`. **[✅]**
- Decide and implement Study architecture. **[✅]**
- Add `profile_studies` / `professor_studies` junction tables. **[✅]**
- Drop stale `scripts.faculty_id`. **[✅]**
- Add `admin` role to `profiles.role`. **[✅]**
- Regenerate database types; remove dead `scripts.faculty_id` references from Hono/Next.js. **[✅]**
- Sync study selection into `profile_studies` in onboarding backend. **[✅]**
- Manage `professor_studies` in professor admin sync actions. **[✅]**
- Rename the live Supabase schema to `studies`, `profile_studies`, `professor_studies`, and `study_id`, including constraints, indexes, and policies. **[✅]**
- Test database schema and API endpoints thoroughly. **[🔲]**
- Cache script fetches in the Next.js Data Cache with tag-based revalidation via webhook; keep search/my-scripts uncached. **[✅]**

### Phase 2: Sanity CMS setup and academic entity management `[✏️ In Progress]`

- Finalize the academic entity model/schema structure for Sanity. **[✅]**
- Create Sanity document types (university, faculty, subject, professor) with shared validation. **[✅]**
- Define relationships/references between academic entities. **[✅]**
- Implement the Create-in-DB action. **[✅]**
- Set up Sanity sync endpoints. **[✅]**
- Implement publication blocking until DB ID exists. **[✅]**
- Implement deletion checks and cascading delete/update workflows. **[⚠️ Needs repair — Sanity deletion is not currently working]**
- Define the initialization set for universities, faculties, studies, subjects, professors. **[✅]**
- Create the `study` Sanity schema and update subject references/sync actions. **[✅]**
- Test sync workflows for create/update/delete. **[🔲]**
- Implement programmatic slug generation for all five entity types. **[🔲]**
- Create TypeScript utility types for stripped/dereferenced Sanity types (including `study`). **[🔲]**
- Create reusable Sanity mini-schemas across all five entity types. **[🔲]**

### Phase 3: Core content and discovery `[✏️ In Progress]`

- Build dynamic slug-based pages for universities, faculties, subjects, professors. **[✅ Mostly complete — slug migration pending]**
- Add `study/[slug]` page. **[🔲]**
- Update subject pages to show parent study. **[🔲]**
- Implement script listing, sorting, filtering. **[✅]**
- Add search for scripts (local-first + API fallback). **[🔲 Missing]**
- Add loading/empty/error states across pages and search. **[🔲 Missing]**
- Transition ID-based routes/queries to programmatic slug routes. **[🔲]**

### Phase 4: User actions and uploads `[🔲 Planned]`

- Build the create-script modal and upload flow. **[🔲]**
- Enforce single-subject constraints; resolve faculty/study/university from subject; explicitly validate professor via `subject_professors`. **[🔲]**
- Implement script edit/delete permissions. **[🔲]**
- Add guest-friendly download/preview access with dedupe protection. **[🔲]**

### Phase 5: Profile and onboarding `[🔲 Planned]`

- Implement first-visit onboarding for faculty and subject selection. **[🔲]**
- Add study selection to onboarding. **[🔲]**
- Add one-click year-completion logic. **[🔲]**
- Persist guest academic data in local storage. **[🔲]**
- Add a dismissable persistent reminder to create an account. **[🔲]**
- Build the profile page with grouped subject/year/faculty/study data. **[🔲]**
- Sync guest onboarding data into `profiles`, `profile_subjects`, `profile_faculties`, `profile_studies`. **[🔲]**

### Phase 6: Moderation and admin tools `[🔲 Planned]`

- Implement global moderator and admin roles with platform-wide rules. **[🔲]**
- Add simple suspicious-download review flows. **[🔲]**
- Add admin interfaces for academic entity creation, sync, dependency checks. **[🔲]**
- Add admin UI for `professor_studies` management. **[🔲]**
- Ensure delete/update flows remain safe and auditable. **[🔲]**
- Make comments flaggable via the existing flags workflow. **[✅]**
- Return reaction/like counts and current-user status in the comments query. **[✅]**
- Add a short doc comment above each API endpoint. **[✅]**
- Move professor, study, subject (not profile-subject), faculty, and university routes behind internal-only access. **[✅]**
- Build frontend flag submission/moderation views (scripts, users, comments). **[🔲]**

### Phase 7: Polish and iteration `[🔲 Planned]`

- Improve UX consistency and mobile behavior. **[🔲]**
- Add accessibility and validation refinements. **[🔲]**
- Expand the notification system. **[🔲]**
- Review architecture for maintainability and future scale. **[🔲]**
- Implement CSS obfuscation for production builds. **[🔲]**

### How to update progress

```
[ROADMAP: Phase 1 - Sanity schema] Add academic entity document types

Implemented university, faculty, subject, and professor document types with shared fields.
Added validation rules and relationship references.
```

---

## 11. Final product position

The first release of Scriptr is intentionally narrow but structurally correct. Sanity is the CMS source of truth for academic metadata; the database stays lightweight and runtime-focused, with a full `University → Faculty → Study → Subject` relational hierarchy and explicit many-to-many enrollment for both students and professors. It supports a single-university academic flow with single-subject scripts, explicit-but-auto-assisted professor selection, general flagging across scripts/users/comments, and simple download-abuse protection.

This gives the team a clean technical foundation without overbuilding, while staying ready for future growth — including a second university — once the platform proves itself.