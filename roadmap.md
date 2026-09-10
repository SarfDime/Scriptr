# Scriptr Product and Implementation Roadmap

## 1. Project goal
Scriptr is a university-focused platform for discovering and sharing scripts within a single academic context. The app should stay simple, reliable, and easy to maintain while still having a clean separation between editorial content, runtime data, and platform logic.

This roadmap reflects the product decisions that have now been confirmed for the first release: Sanity is the CMS for academic metadata, Supabase stores only lightweight runtime records, the initial rollout assumes a single university, and scripts are always tied to exactly one subject.

---

## 2. Release scope and product assumptions

### 2.1 Initial release assumptions
1. Expected volume is very small at launch.
2. Only scripts will be searchable in the first release.
3. Search should use a local data-first approach when possible, with an API fallback if needed.
4. There will be a single university in v1, so the university should be automatically selected and readonly for users.
5. All academic entities in Sanity and in the database will be created from app start and changed only when a new university is added later.
6. Scripts are always tied to one subject only; multi-subject scripts are not allowed.
7. Each script should automatically resolve the associated professor, faculty, and university from the selected subject.
8. The app will support three user roles: normal user, university-scoped moderator, and admin.
9. Guest onboarding and profile data should persist in local storage only.
10. The first release does not include general flagging; suspicious download patterns are the initial abuse-control mechanism.
11. The deduplication identity priority should be account first, then IP, then device.
12. Download activity should be unique per identity and should not count duplicate requests from the same person or device beyond the allowed threshold.

### 2.2 Product principle for v1
The first release is intentionally narrow. The goal is to ship the right core product, keep the architecture clean, and defer more advanced moderation and community features until the product is proven.

---

## 3. Product requirements

### 3.1 Core user flows
1. Users must be able to browse and filter scripts by subject, professor, popularity, recency, or other relevant metadata.
2. Users must be able to view subject pages that show subject information, associated professor data, and relevant scripts.
3. Users must be able to view professor pages that show profile information, subject assignments, and relevant scripts.
4. Users must be able to view faculty pages and university pages generated from their IDs.
5. Users must be able to view a dedicated script detail page showing the title, description, file preview, subject context, comments, and metadata.
6. Users must be able to create, edit, and delete their own scripts.
7. Users must be able to view and manage their own profile information and uploaded content.
8. Guests must still be able to browse content and download scripts where permitted without creating an account.

### 3.2 Auth and permissions
1. Only authenticated users should be able to create, edit, or delete scripts.
2. Users should only be able to manage their own scripts unless they have moderator or admin privileges.
3. Anonymous users should still be able to read public content.
4. Authenticated actions such as liking, saving, commenting, or script creation should be restricted to signed-in users.
5. Guests should still be able to preview or download scripts unless abuse protections are triggered.
6. Permissions must be enforced in both the frontend and backend.
7. Moderators should be scoped per university and only act within that university.
8. Admin users should retain platform-level governance rights.

### 3.3 Content quality and moderation
1. Submitted scripts should be validated before storage.
2. Abuse prevention should focus on suspicious download patterns and repeated spam-like activity in v1.
3. The app should surface clear auth prompts when a user attempts protected actions without an account.
4. Ownership and attribution must remain clear for scripts, professors, faculties, universities, and subjects.
5. The first version does not require a general user or script flagging workflow.
6. Moderators should be able to review and resolve abuse-related issues within their university context.
7. Admins should be able to handle escalations, edge cases, and platform-level actions.
8. Moderation actions should be auditable and include a clear status lifecycle where relevant.

### 3.4 Notifications and engagement
1. Users should receive notifications when their script becomes popular or when a moderation decision affects their content.
2. Notifications should be visible in-app and should be structured so future email or push delivery is possible.
3. Notification preferences should be configurable in a later phase when the system is more mature.
4. In the first release, a persistent reminder or reminder-like notification can be hardcoded when a user has not completed onboarding or has not created an account yet.
5. The app should support future notification types without reworking the whole system.

### 3.5 Achievements and progression
1. Users should unlock achievements for milestones such as script uploads, like thresholds, or subject engagement.
2. Achievement logic should run server-side and should not rely only on frontend state.
3. Achievement states should be displayed on user profiles and relevant pages.
4. New achievement types should be easy to add without a large rewrite.

### 3.6 Guest experience and access
1. The app should be usable without an account for browsing, previewing, and downloading scripts.
2. Guests should be shown a clear auth modal if they try to perform a protected action.
3. Guest onboarding data should persist in local storage until account creation or sign-out.
4. Download tracking should avoid inflated totals caused by repeated requests from the same user, IP, or device.
5. The guest flow should be frictionless while still protecting the platform from abuse.

### 3.7 Onboarding and profile persistence
1. On first visit, users should be shown an onboarding modal to select their faculty, current subjects, and completed subjects.
2. Users should be able to complete an entire year in one action, automatically marking all relevant subjects as complete.
3. Once a user has completed all subjects in a year for that faculty, the year should be marked as completed for that student.
4. Completed subjects and completed years should be grouped and displayed on the profile page.
5. Guest data should persist locally and be migrated into the user profile after the user creates an account.
6. The app should show a dismissable, persistent reminder encouraging the guest to create an account to save their academic profile.
7. Users should be able to update and revise their academic profile later without losing prior progress.

### 3.8 Accessibility and UX
1. Interactive states should be keyboard accessible.
2. Forms should include validation and guiding error states.
3. Loading, empty, and error states should be visible and consistent across the app.
4. The layout should work across mobile, tablet, and desktop views.
5. The visual design should remain consistent with the product design system.

---

## 4. Functional requirements by feature area

### 4.1 Script features
1. Display a list of scripts with subject, professor, upload date, exam session, additional reading links, and popularity metadata.
2. Implement reusable script filtering and sorting logic (including filtering by exam session and subject).
3. Create a dedicated dynamic script detail page for each script showing metadata, file preview, additional reading links, comments, and subject context.
4. Support script creation with required metadata, exam session, optional additional reading links (array of strings/URLs), and validation.
5. Allow script editing only for editable fields such as title, description, and additional reading links.
6. Uploaded script files should remain immutable after upload.
7. Allow script deletion for owners and admins with proper authorization checks.
8. Script uploads should support PDF or image-based files only.

### 4.2 Academic entity features
1. Create dedicated pages for universities, faculties, subjects, and professors using programmatic slugs (`slug` field) as the canonical route parameters instead of internal Sanity IDs.
2. Generate dynamic pages from Sanity-backed academic records and map them to the database identity records.
3. Each page should show relevant script lists, related entities, and Sanity metadata such as bios or descriptions.
4. Navigation should prefer slug-based routes such as `professor/[slug]`, `subject/[slug]`, `faculty/[slug]`, and `university/[slug]`.
5. These pages should be built from the same entity model and the same sync lifecycle.
6. Each academic entity should be resolved by slug/ID and merged from the lightweight DB record plus the rich Sanity document.

### 4.3 Search and discovery
1. Search should support scripts only in the first release.
2. Search should try a local data-first search when the data is already loaded in the frontend.
3. If the local dataset is incomplete, the app should fall back to a dedicated script search API.
4. Search state should include proper loading, empty, and error messaging.
5. Search should remain simple and low-risk for the early product stage.

### 4.4 Script creation and upload flow
1. Users should create a script from a dedicated create script modal.
2. The user should select a single subject; the associated professor, faculty, and university should be auto-selected from that subject.
3. The user should provide a title, description, exam session, and optional additional reading links (array of URLs).
4. The user should upload the actual script file.
5. Validation should ensure all required fields are present before submission.
6. The system should prevent invalid subject selection and missing university context.
7. The create modal should include clear empty, loading, and validation states.
8. Multi-subject scripts are explicitly out of scope for v1.

### 4.5 Notifications and achievements features
1. Implement an in-app notification center for user actions and status updates.
2. Trigger notifications for script popularity, moderation decisions, and account-related reminders.
3. Keep notification infrastructure flexible enough for future expansion.
4. Implement achievement tracking and display for milestone-based progress.

### 4.6 Moderation and abuse prevention features
1. The first release does not include a general flagging workflow.
2. Suspicious download patterns should be detected using a lightweight abuse check.
3. The app should record download attempts with account, IP, and device identity information.
4. The system should detect repeated downloads from the same identity and suppress duplicate counting.
5. Moderators and admins should still be able to review abuse issues when they arise.
6. Comments should be flaggable using the same flag workflow as scripts and users.
7. The comments query should return reaction counts and like counts per comment, plus the current logged-in user's own reaction and like status when authenticated.

### 4.7 User onboarding and academic profile features
1. On first visit, the user should be prompted to choose their faculty and current/completed subjects.
2. Users should be able to complete a full year in one action.
3. A year should be marked complete when all subjects in that year for that faculty are completed.
4. Completed subjects and completed years should display on the profile page grouped by year.
5. Guest onboarding data should persist locally and later be migrated into the user profile after account creation.
6. A dismissable persistent reminder should notify guests to create an account and preserve their data.

### 4.8 Auth modal and access prompts
1. A reusable auth modal should appear when a user tries a protected action without signing in.
2. The modal should explain which actions require authentication.
3. Protected actions should be blocked at the UI and backend level.
4. The modal should appear for script creation, likes, saves, and comments.
5. Download and preview actions should remain accessible for guests where allowed.

### 4.9 Sanity-managed academic entity administration
1. Universities, faculties, subjects, and professors should all be manageable through the Sanity admin layer using one pattern.
2. A Sanity document should be editable without requiring a DB row to exist yet.
3. The admin flow should allow a document to be created or updated in Sanity first.
4. A separate create-in-DB action should then create the minimal database record and return the DB ID back to the Sanity document.
5. The same document should not be allowed to have duplicate DB IDs across the same academic entity type.
6. Updating a Sanity document without an existing DB row should be allowed, but publication should be blocked until the DB ID exists.
7. Deletion should be blocked unless the dependency checks pass.
8. If deletion succeeds, the DB record and corresponding Sanity document should be removed together.

---

## 5. Data and CMS requirements

### 5.1 Content model requirements
1. Sanity should be the source of truth for structured academic content such as professors, subjects, faculties, universities, and static page-level metadata.
2. Dynamic user-generated content such as scripts, likes, saves, and user interactions should be stored in the database layer.
3. Relationships should be explicit and normalized between scripts, subjects, professors, faculties, and universities.
4. Rich metadata such as bios, descriptions, images, academic year information, and similar non-critical fields should live in Sanity only.
5. The database should store only minimal identifiers and runtime data such as names, IDs, states, and relationship keys.
6. All content should be editable through a versioned CMS workflow.

### 5.2 Data ownership boundary
1. Sanity owns rich academic content and editorial data (including subject year, semester, description, syllabus, credits, and professor assignments).
2. Supabase owns runtime identity, script records, user relationships, moderation metadata, and access-related state.
3. The database should not store rich descriptive academic content such as bios, description text, or non-critical metadata.
4. The backend should resolve the Sanity document by ID whenever the full academic record is needed.
5. The frontend should never assume the DB row is the complete source of truth for academic entity data.
6. The `scripts` database table owns runtime script metadata including `exam_session` (for script categorization by exam period) and `additional_reading` (an array of supplementary URL strings).
7. The `subjects` database table should be minimal (names, IDs, relationships); `exam_session` belongs on scripts, not subjects, and `year`/`semester` belong to Sanity CMS. Remove `exam_session` from the `subjects` DB table and evaluate removing `year` from the `subjects` DB table.

### 5.3 Initial university and entity assumptions
1. At launch there will be only one university.
2. The university should always be auto-selected and readonly in the client.
3. Universities, faculties, subjects, and professors are created from app start and only changed when adding a new university in the future.
4. The system should not rely on annual data churn for academic entities at launch.

### 5.4 Data fetching and rendering requirements
1. Data fetching should be separated into CMS-backed academic content and database-backed dynamic content.
2. Server-side rendering should be used where appropriate for page-level content.
3. Dynamic data should be isolated into client components when needed.
4. Loading, empty, and error states should be included in all data fetches.
5. Missing or stale data should fail gracefully without breaking the page.

### 5.5 Data integrity requirements
1. Relationships between scripts, subject, professor, faculty, university, and user records must be validated.
2. Required fields should be enforced at both schema and API levels.
3. Data should be normalized so duplicate records and inconsistent references are avoided.
4. Script creation should always infer the relevant faculty, professor, and university from the selected subject.
5. Download counting should not be inflated by repeated requests from the same account, IP, or device.
6. If the same user or device downloads the same script more than a threshold, additional requests should not contribute to the public total.
7. Roles and permissions should be enforced server-side to prevent misuse.

### 5.6 Academic entity sync rules
1. The Sanity document is the system of record for rich academic metadata.
2. The database row is a lightweight runtime record used for identity and relationship linking.
3. When an academic entity is created or updated in Sanity, it may also require a DB record to exist for runtime use.
4. Updates to the academic document are allowed before the DB record is created, but publication should be blocked until a DB ID is present.
5. A document cannot be published while missing a valid DB ID.
6. When the admin chooses Create in DB, the system should create the DB row and then update the Sanity document to store the returned DB ID.
7. The database should reject duplicate IDs for the same academic entity type.
8. Deletion of a Sanity-backed academic entity should be blocked unless dependencies are safe to remove.

### 5.7 Download and abuse prevention data model
1. A download event model should record raw attempts, user identity source, script ID, and dedupe state.
2. The identity priority should be account first, then IP, then device.
3. Download counting should be deduplicated across repeated requests from the same effective identity.
4. The system should use simple, explicit abuse logic rather than a highly complex fraud pipeline in v1.
5. Events should be stored in a way that can support future analytics and auditing.

### 5.8 User profile and academic progress data model
1. User academic profile data should persist in local storage for guest users until account creation.
2. The app should track current subjects, completed subjects, and completed years in a structured way.
3. The profile should preserve academic history even if the user later changes faculty or university data.
4. The completed-year state should update automatically when all subjects in the year are complete.
5. When the user creates an account, the local onboarding data should be migrated into the persisted profile.

### 5.9 Programmatic slug generation requirements
1. Sanity documents for academic entities must not use Sanity IDs (`_id`) for public URLs and routing.
2. Each academic entity document must define a `slug` field generated programmatically based on entity naming and structural hierarchy:
   - **University**: Based on its name (e.g., `ukim`).
   - **Faculty**: Based on parent university and faculty name (e.g., `ukim-pharmacy`).
   - **Subject**: Based on parent university, parent faculty, and subject name (e.g., `ukim-pharmacy-cell-biology`).
   - **Professor**: Based directly on their name (e.g., `john-doe`).
3. Slugs must be normalized, lowercase, hyphenated, and auto-generated on document creation/update.

### 5.10 Sanity typegen and in-app type synchronization
1. Re-use generated Sanity types (from `sanity.types.ts`) for in-app TypeScript models wherever possible (at least partially) to keep schemas and frontend types strictly aligned.
2. Implement utility types (e.g., `StripSanityFields<T>` or `Dereferenced<T>`) that strip Sanity system metadata (such as `_rev`, `_createdAt`, `_updatedAt`, etc.).
3. Replace Sanity reference structures (`{ _type: "reference", _ref: string }`) with dereferenced domain models so in-app types remain clean, ergonomic, and type-safe.

### 5.11 Reusable academic schema components (mini-schemas)
1. Extract recurring fields across academic documents (`university`, `faculty`, `subject`, `professor`) into modular, reusable Sanity mini-schemas / field objects (e.g., descriptions/bios, contact/social info, media assets, academic metadata).
2. Mini-schemas must enforce consistent validation rules, preview configurations, and fieldsets across all academic entity types to maintain DRY principles in CMS schema definitions.

### 5.12 Study Program architecture evaluation (TODO)
1. **Decision required**: Decide whether to introduce `study_program` as an independent entity/table or attach study program categorization directly to `scripts` (or purely within Sanity CMS metadata).
2. **Impact analysis**:
   - *Option A (Independent relational entity)*: Hierarchical structure becomes `University -> Faculty -> Study Program -> Subject`. Each subject belongs to a study program under a faculty. This represents the real academic structure most accurately, but introduces significant cascade changes across the database schema, Sanity document schemas, sync workflows, slug generation (`[uni]-[faculty]-[program]-[subject]`), route handlers, frontend pages, and onboarding logic.
   - *Option B (Script attribute / Sanity-only)*: Keep `Faculty -> Subject` direct relation and treat study program as an optional tag/attribute on `scripts` or as descriptive metadata in Sanity. Avoids large-scale code rewriting for v1.

---

## 6. Backend and API requirements

### 6.1 API structure
1. The backend should expose clean endpoints for scripts, profiles, subjects, professors, faculties, universities, and interactions.
2. API routes should be organized by resource and responsibility.
3. The API should return consistent response shapes for success, validation errors, and system failures.
4. Search should be built around script discovery first and should not be over-engineered for other content types in v1.
5. Every endpoint file should carry a short doc comment above each route explaining what it is for.
6. Professor, subject (excluding profile-subject), faculty, and university routes should be internal-only, gated the same way as `/api/internal`, since this data is admin-managed and not meant for direct public access.

### 6.2 Backend responsibilities
1. Handle authentication checks.
2. Validate input before writing data.
3. Enforce permissions for creation, update, deletion, and moderation.
4. Return consistent, meaningful status codes and helpful error messages.
5. Resolve the Sanity document behind any academic entity ID before returning a full entity detail payload.
6. Centralize business rules for script creation, role enforcement, and download deduplication.

### 6.3 Script creation and upload backend requirements
1. The backend should support creating scripts with a single subject, title, description, exam session, optional additional reading links (array of URLs/strings), and uploaded file metadata.
2. Subject selection should automatically determine the professor, faculty, and university context.
3. Uploaded files should be validated as PDF or image-based assets.
4. File content should be immutable after upload; only title, description, and additional reading links should be editable.
5. The backend should reject invalid scripts or missing subject context.

### 6.4 Academic entity backend requirements
1. Academic entity endpoints should accept IDs as the main lookup mechanism.
2. The backend should merge database identity data with Sanity metadata for subject, professor, faculty, and university details.
3. The API should handle missing Sanity documents gracefully with a useful empty or error state.
4. The backend should support create, update, and delete patterns for each academic entity type.

### 6.5 Search backend requirements
1. Search should support script search only in the first release.
2. A script search endpoint should already exist and may be improved, but it should remain simple and focused.
3. The frontend should attempt a local search first when current script data is already in memory.
4. Loading, empty, and error states should be shown while waiting for search results.
5. Search should remain lightweight due to the small expected volume and limited release scope.

### 6.6 Auth and download protection backend requirements
1. Only authenticated users can create, like, save, or comment on scripts.
2. Public preview and download endpoints should remain available to guests where allowed.
3. The backend should deduplicate download counts based on account first, then IP, then device.
4. Repeated download attempts from the same identity should not inflate popularity counts beyond reasonable thresholds.
5. The abuse logic should be simple, explicit, and easy to maintain.

### 6.7 Moderator and admin backend requirements
1. Moderators should be scoped by university.
2. Admins should have access to platform-level moderation actions.
3. The backend should support moderator review actions and escalation logic.
4. In the first release, moderation should be focused on abuse and suspicious activity rather than full general-purpose flag management.

### 6.8 Academic onboarding and profile persistence backend requirements
1. The backend should support local-first guest profile storage and later migration into the account profile.
2. Current and completed subject state should be stored in a structured format.
3. The backend should support bulk year completion state based on faculty-specific subject data.
4. A persistent reminder should be triggered for guest users who have incomplete onboarding state.

### 6.9 Script caching and revalidation requirements
1. Frontend fetches of script data (list, by-subject, top, popular, detail) should use the Next.js Data Cache, tagged per endpoint and, where applicable, per query (e.g. per subject/script ID).
2. Script search results must never be cached; search requests always hit the live dataset.
3. Requests scoped to the current user's session (e.g. "my scripts") must never be cached.
4. Creating, updating, or deleting a script must revalidate only the cache tags affected by that script (its detail tag, its subject's tag, and the shared list/top/popular tags), not the entire cache.
5. Revalidation is triggered by the backend via a shared-secret webhook to the frontend, so it works regardless of which client performed the mutation.

---

## 7. Frontend architecture requirements

### 7.1 UI responsibilities
1. Components should only manage the UI state they own.
2. Data fetching and business rules should be extracted into hooks or helpers.
3. Filtering, sorting, and transformation logic should be reusable and testable.
4. The page layer should orchestrate data flow instead of embedding all logic directly in render code.

### 7.2 Academic entity page requirements
1. Universities, faculties, subjects, and professors should each have dynamically generated pages by ID.
2. The page should load the lightweight DB record and then merge in Sanity metadata for the full display.
3. Empty states, not-found states, and loading states should be present for each page.
4. The route should remain stable and should not depend on slugs alone.

### 7.3 Search UX requirements
1. Search should show loading indicators and should avoid flashing empty states unnecessarily.
2. Local data-first search should be used when the current dataset is available.
3. The app should display a clear empty state when there are no script results.
4. Search should be designed to feel fast and low-friction for a small-volume product.

### 7.4 Onboarding and profile UX requirements
1. Users should see a first-visit onboarding modal that collects faculty, current subjects, and completed subjects.
2. The UI should allow one-click completion of an academic year.
3. The profile page should display grouped completed subjects and completed years.
4. Guest users should see a persistent reminder to create an account to save their academic profile.
5. The reminder should be dismissable and configurable in a simple client-side way.

### 7.5 Persistent notification pattern
1. Persistent reminders are allowed as a lightweight first-step notification system.
2. This system should not depend on the full notification engine being complete.
3. It should be hardcoded to the onboarding/account-save use case and should remain separate from the future full in-app notifications system.

---

## 8. Explicit decisions and clarifications

### 8.1 Resolved decisions
1. Dynamic pages for universities, faculties, subjects, and professors should be generated from programmatic slug-based routes (not internal Sanity IDs).
2. Search is script-only in v1 and should use local-first behavior plus API fallback.
3. The app is designed for very small expected volume.
4. The user role model is: normal user, university-scoped moderator, and admin.
5. Download deduplication should prefer account identity first, then IP, then device.
6. Scripts are single-subject only; professor, university, and faculty are auto-determined from the selected subject.
7. General flags are not required in v1; suspicious download patterns are the initial abuse mechanism.
8. Guest onboarding and profile data should be stored in local storage only for the first release.
9. A year is marked complete when all subjects in that year for that faculty are completed.
10. Persistent reminders are allowed and can be implemented as a simple, dismissable onboarding/account-save notification that does not depend on a full notification system.
11. The admin should trigger the create button for academic entity creation and editing to ensure explicit editorial control.
12. Updates to Sanity academic documents should be allowed even before the DB record exists, but publication should be blocked until the DB ID is created.
13. Deletion should be blocked until dependency checks pass; if deletion succeeds, the DB record and Sanity document should be removed together.
14. Slugs are generated programmatically following the entity hierarchy: University based on name (`ukim`), Faculty based on name + parent university (`ukim-pharmacy`), Subject based on name + parent faculty (`ukim-pharmacy-cell-biology`), and Professor based on name (`john-doe`).
15. In-app TypeScript types should re-use generated Sanity types where possible, using helper utility types to strip internal Sanity metadata (`_rev`, `_createdAt`, `_updatedAt`, etc.) and replace reference fields with dereferenced domain types.
16. Extract shared academic document fields into modular Sanity mini-schemas to ensure uniform validation and DRY schema definitions across academic entity types.
17. The `scripts` database table includes `additional_reading` (an array of link strings) for supplementary study materials and `exam_session` for categorizing scripts by exam period.
18. `exam_session` belongs on scripts (for categorization) and is removed from the `subjects` database table.
19. `year` and `semester` are authored and owned in Sanity CMS; evaluate and remove `year` from the `subjects` database table if not strictly required for runtime linkage.
20. **Open Architectural Decision (TODO)**: Decide whether `Study Program` should be an independent entity/table (`Faculty -> Study Program -> Subject`) or just a field on `scripts` / Sanity metadata. A full independent entity would require restructuring the academic hierarchy, CMS schemas, DB relations, sync pipelines, slugs, and UI routes.

### 8.2 Question 3 elaboration
Question 3 is the editorial and sync workflow for academic entities:

- The Sanity document is the authoring layer.
- The database row is the runtime linking layer.
- The content editor can create or edit a Sanity document before a DB row exists.
- A separate Create in DB action creates the minimal runtime row and returns the DB ID back to the Sanity document.
- This avoids the product needing a DB row before the editorial record exists, but it still guarantees that published content cannot exist without runtime identity.
- This keeps Sanity as the source of truth for descriptive content while the database stays lean for actual app behavior, permissions, and relationships.
- It also prevents accidental duplicate identity records because the same document type cannot be assigned two different DB IDs.

### 8.3 Deferred items from the original open list
The following items remain out of scope for the first release and should be addressed after launch:
1. Comprehensive notification system beyond persistent reminder banners.
2. Large-scale moderation flows or general-purpose flags.
3. Advanced search beyond script search.
4. Broad non-academic CMS capabilities beyond the entity model described here.

---

## 9. Implementation priorities

### Phase 1: Database foundation and backend API
1. Configure the minimal DB schema for runtime identity and script records.
2. Design and implement all required database tables: users, scripts, academic_profiles, download_events, and relationship tables.
3. Set up database constraints, indexes, and validation rules for data integrity.
4. Implement the first version of the script API with create, read, update, delete endpoints.
5. Implement authentication and permission checks in the backend.
6. Implement download deduplication logic (account → IP → device priority).
7. Add backend validation and error handling for all operations.
8. Add `additional_reading` (`text[]` array of link strings) and `exam_session` (`text`) columns to `scripts` database table. [🔲 TODO]
9. Remove `exam_session` from the `subjects` database table and evaluate removing `year` from `subjects` table if not needed for runtime linking (since `year` and `semester` live in Sanity). [🔲 TODO]
10. Decide on Study Program architectural placement: separate database table & intermediate entity (`Faculty -> Study Program -> Subject`) vs. script-level attribute/Sanity metadata. [🔲 TODO]
11. Test database schema and API endpoints thoroughly.

### Phase 2: Sanity CMS setup and academic entity management
1. Finalize the academic entity model and schema structure for Sanity. [✅ Mostly complete]
2. Create Sanity document types for university, faculty, subject, and professor with shared validation patterns. [✅ Mostly complete]
3. Define relationships and references between academic entities in Sanity. [✅ Mostly complete]
4. Implement the create-in-DB action that creates DB records and returns IDs to Sanity documents. [✅ Complete]
5. Set up Sanity sync endpoints to create, update, and delete DB records from CMS documents. [✅ Mostly complete]
6. Implement publication blocking until DB ID exists. [✅ Complete]
7. Implement deletion checks and cascading delete/update workflows. [⚠️ Needs verification; Sanity deletion is currently not working and should be checked]
8. Define the initialization set for universities, faculties, subjects, and professors in Sanity. [✅ Complete]
9. Test sync workflows for create, update, and delete operations. [🔲 Pending follow-up after the deletion fix]
10. Implement programmatic `slug` field generation on academic entity schemas (University: `[name]`, Faculty: `[uni]-[faculty]`, Subject: `[uni]-[faculty]-[subject]`, Professor: `[name]`). [🔲 TODO]
11. Create TypeScript utility types to derive in-app types from Sanity generated types by stripping system metadata (`_rev`, `_createdAt`, etc.) and replacing reference fields with dereferenced domain types. [🔲 TODO]
12. Create Sanity mini-schemas / reusable field objects for commonly used fields across academic documents (descriptions, media, contact/links, academic metadata) to eliminate schema duplication. [🔲 TODO]
13. If Study Program is adopted as a dedicated entity, create Sanity schema for `studyProgram`, update `faculty` and `subject` references, and adjust sync actions. [🔲 TODO / Decision dependent]

### Phase 3: Core content and discovery
1. Build dynamic slug-based pages for universities, faculties, subjects, and professors (`/[entity]/[slug]`). [✅ Mostly complete - transition from ID routes to programmatic slugs pending]
2. Implement script listing, sorting, and filtering. [✅ Mostly complete]
3. Add search for scripts with local-first and API-fallback behavior. [🔲 Missing / not complete]
4. Add loading, empty, and error states across pages and search. [🔲 Missing / not complete]
5. Transition existing ID-based routes and queries to programmatic slug-based routes. [🔲 TODO]

### Phase 4: User actions and uploads
1. Build the create script modal and upload flow supporting title, description, exam session, and additional reading links (array of URLs).
2. Enforce single-subject constraints and auto-populate faculty/professor/university context.
3. Implement script edit and delete permissions (allowing title, description, and additional reading links edits).
4. Add guest-friendly download and preview access with dedupe protection.

### Phase 5: Profile and onboarding
1. Implement first-visit onboarding for faculty and subject selection.
2. Add one-click year completion logic and auto-complete year state.
3. Persist guest academic data in local storage.
4. Add a dismissable persistent reminder to create an account.
5. Build the profile page with grouped subject/year data.

### Phase 6: Moderation and admin tools
1. Implement moderator and admin roles with university-scoped rules.
2. Add simple suspicious-download review flows.
3. Add admin action interfaces for academic entity creation, sync, and dependency checks.
4. Ensure delete and update flows remain safe and auditable.
5. Make comments flaggable via the existing flags workflow.
6. Return reaction counts, like counts, and the current user's reaction/like status in the comments query.
7. Add a short doc comment above each API endpoint explaining its purpose.
8. Move professor, subject (not profile-subject), faculty, and university routes behind internal-only access.

### Phase 7: Polish and iteration
1. Improve UX consistency and mobile behavior.
2. Add accessibility and validation refinements.
3. Expand the notification system after the first release.
4. Review architecture for maintainability and future scale.
5. Implement CSS obfuscation for production builds.

---

## 10. Progress and status tracking

This section is maintained automatically by the commit agent. Update status by including `[ROADMAP: Phase X - Feature Name]` in commit messages.

### Phase 1: Database foundation and backend API [✏️ In Progress]
- Configure the minimal DB schema for runtime identity and script records. [✅]
- Design and implement all required database tables: users, scripts, academic_profiles, download_events, and relationship tables. [✅]
- Set up database constraints, indexes, and validation rules for data integrity. [✅]
- Implement the first version of the script API with create, read, update, delete endpoints. [✅]
- Implement authentication and permission checks in the backend. [✅]
- Implement download deduplication logic (account → IP → device priority). [✅]
- Add backend validation and error handling for all operations. [✅]
- Add `additional_reading` (`text[]`) and `exam_session` (`text`) columns to `scripts` table. [🔲]
- Remove `exam_session` from `subjects` table and evaluate removing `year` (sourced from Sanity). [🔲]
- Decide Study Program architectural model: separate table vs script attribute vs Sanity-only. [🔲]
- Test database schema and API endpoints thoroughly. [🔲]
- Cache script list/subject/top/popular/detail fetches in the Next.js Data Cache with per-endpoint and per-query tags; revalidate the affected tags via a backend webhook on script create/update/delete; keep search and my-scripts uncached. [✅]

### Phase 2: Sanity CMS setup and academic entity management [✏️ In Progress]
- Finalize the academic entity model and schema structure for Sanity. [✅]
- Create Sanity document types for university, faculty, subject, and professor with shared validation patterns. [✅]
- Define relationships and references between academic entities in Sanity. [✅]
- Implement the create-in-DB action that creates DB records and returns IDs to Sanity documents. [✅]
- Set up Sanity sync endpoints to create, update, and delete DB records from CMS documents. [✅]
- Implement publication blocking until DB ID exists. [✅]
- Implement deletion checks and cascading delete/update workflows. [⚠️ Needs repair; Sanity deletion is not currently working and needs to be checked]
- Define the initialization set for universities, faculties, subjects, and professors in Sanity. [✅]
- Test sync workflows for create, update, and delete operations. [🔲]
- Implement programmatic slug generation for academic entities (University, Faculty, Subject, Professor). [🔲]
- Create TypeScript utility types to strip Sanity metadata and replace references with dereferenced domain types for in-app models. [🔲]
- Create reusable Sanity mini-schemas for common academic entity fields (descriptions, media, metadata, links). [🔲]

### Phase 3: Core content and discovery [✏️ In Progress]
- Build dynamic slug-based pages for universities, faculties, subjects, and professors. [✅ Mostly complete - slug migration pending]
- Implement script listing, sorting, and filtering. [✅]
- Add search for scripts with local-first and API-fallback behavior. [🔲 Missing]
- Add loading, empty, and error states across pages and search. [🔲 Missing]
- Transition dynamic pages and queries from Sanity ID routes to programmatic slug routes (`/[entity]/[slug]`). [🔲]

### Phase 4: User actions and uploads [🔲 Planned]
- Build the create script modal and upload flow with exam session selection and additional reading links. [🔲]
- Enforce single-subject constraints and auto-populate faculty/professor/university context. [🔲]
- Implement script edit and delete permissions (including updating additional reading links). [🔲]
- Add guest-friendly download and preview access with dedupe protection. [🔲]

### Phase 5: Profile and onboarding [🔲 Planned]
- Implement first-visit onboarding for faculty and subject selection. [🔲]
- Add one-click year completion logic and auto-complete year state. [🔲]
- Persist guest academic data in local storage. [🔲]
- Add a dismissable persistent reminder to create an account. [🔲]
- Build the profile page with grouped subject/year data. [🔲]

### Phase 6: Moderation and admin tools [🔲 Planned]
- Implement moderator and admin roles with university-scoped rules. [🔲]
- Add simple suspicious-download review flows. [🔲]
- Add admin action interfaces for academic entity creation, sync, and dependency checks. [🔲]
- Ensure delete and update flows remain safe and auditable. [🔲]
- Make comments flaggable via the existing flags workflow. [✅]
- Return reaction counts, like counts, and the current user's reaction/like status in the comments query. [✅]
- Add a short doc comment above each API endpoint explaining its purpose. [✅]
- Move professor, subject (not profile-subject), faculty, and university routes behind internal-only access. [✅]

### Phase 7: Polish and iteration [🔲 Planned]
- Improve UX consistency and mobile behavior. [🔲]
- Add accessibility and validation refinements. [🔲]
- Expand the notification system after the first release. [🔲]
- Review architecture for maintainability and future scale. [🔲]
- Implement CSS obfuscation for production builds. [🔲]

### How to update progress
Commits with `[ROADMAP: Phase X - Feature Name]` headers will automatically update this section. See [.commit-agent.md](.commit-agent.md) for details.

Example commit:
```
[ROADMAP: Phase 1 - Sanity schema] Add academic entity document types

Implemented university, faculty, subject, and professor document types with shared fields.
Added validation rules and relationship references.
```

---

## 11. Final product position
The first release of Scriptr is intentionally narrow but structurally correct. It treats Sanity as the CMS source of truth for academic metadata, keeps the database lightweight and runtime-focused, and supports a simple single-university academic flow with single-subject scripts and simple abuse protection.

This gives the team a clean technical foundation without overbuilding, while still keeping the architecture ready for future growth once the platform proves itself and the volume increases.
