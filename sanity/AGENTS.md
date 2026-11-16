# `sanity/` — Sanity Studio

Repo rules: [`../AGENTS.md`](../AGENTS.md). Architecture:
[`Academic Catalog`](../docs/ARCHITECTURE-ACADEMIC-CATALOG.md).

## Entities

* Follow the existing entity pattern (mini-schemas, "Create in Database" / "Sync with
  Database" / checked-delete actions). A new academic entity extends
  `getDatabaseAcademicEndpoints` (`shared/utils/api.utils.ts`) and
  `parentFieldFor`/`parentColumnFor` (`actions/academicEntitySync.tsx`) exhaustively —
  a switch with no silent default, no special cases.
* Publishing stays blocked until a document has a `dbId`; deletion stays blocked on the
  admin API's dependency check (`409`). Never bypass either.
* **Every object field needs a named type.** The GraphQL deploy (dry-run in `*-s-*` CI)
  fails on an inline `type: 'object'`; give the shape its own `defineType` and point
  the field at it.

## Localized fields

* Localized fields come from `schemas/common/localeFields.ts`: a language added to
  `SUPPORTED_LANGUAGES` gives every `localizedString`/`localizedRichText`/
  `localizedRichTextLite`/`localizedStringArray` that field, and a matching entry in
  `LANGUAGE_FLAGS` (`shared/components/language-flags.tsx`, exhaustive — the build
  fails until it exists). Use `localizedField({ valueType })`, never hand-written
  per-language fields.
* A required localized field needs at least one language, not the default one
  (`hasAnyLocaleContent`); readers fall back requested → default → any filled
  language.
* A single string — a Postgres `name`, a slug stem, a Studio preview — comes from
  `firstFilledLocalizedText` (`shared/utils/localized-strings.ts`) or
  `localizedX.en` with `.mk` as fallback.
* A content migration (`sanity/migrations/<name>`) writes straight to the dataset and
  bypasses the publish webhook, so revalidate the tags or rebuild afterwards.

## Access and environment

* The Studio holds **no secret**: every `SANITY_STUDIO_*` value is inlined into the
  public bundle, so API access is a TOTP code exchanged for a twenty-minute token
  (`lib/api-access.ts`). Never add a `SANITY_STUDIO_*SECRET*` variable, and route every
  admin call through `adminFetch`, never bare `fetch`.
* `SANITY_STUDIO_API_URL` must point at the real API outside local — check it before
  debugging a Studio action as a logic bug.
* A new variable gets an entry in `ENV_REQUIREMENTS` (`lib/startup-report.ts`), printed
  by `scripts/check-env.ts` before `sanity dev`/`build`. Names only, never values.
