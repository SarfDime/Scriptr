# Sanity (`sanity/`)

The root [Global Rules](../AGENTS.md#global-rules) still apply. Architecture: [Academic Catalog](ARCHITECTURE-ACADEMIC-CATALOG.md).

* Follow the existing entity pattern (mini-schemas, "Create in Database"/"Sync with Database"/checked-delete actions) — see [`ARCHITECTURE-ACADEMIC-CATALOG.md`](ARCHITECTURE-ACADEMIC-CATALOG.md). A new academic entity extends `getDatabaseAcademicEndpoints` (`shared/utils/api.utils.ts`) and `parentFieldFor`/`parentColumnFor` (`sanity/actions/academicEntitySync.tsx`) exhaustively (switch with no silent default) — no special cases.
* Publishing stays blocked until a document has a `dbId`, and deletion stays blocked on the admin API's dependency check (`409`). Don't bypass either.
* **New env var → startup checklist:** add it to `ENV_REQUIREMENTS` in `sanity/lib/startup-report.ts`; `scripts/check-env.ts` prints it before `sanity dev`/`sanity build`. Anything named `SANITY_STUDIO_*SECRET*` is already flagged there as a bundle leak.
* The Studio holds **no secret**. Every `SANITY_STUDIO_*` value is inlined into the deployed bundle, which anyone can download, so API access comes from a TOTP code exchanged for a twenty-minute token (`sanity/lib/api-access.ts`). Never add a `SANITY_STUDIO_*API_SECRET`-style variable back, and route every admin call through `adminFetch` rather than `fetch`.
* `SANITY_STUDIO_API_URL` must point at the real API outside local — check that before debugging Studio actions as a logic bug.
* **Every object field needs a named type.** The GraphQL deploy
  (`sanity graphql deploy`, dry-run in `*-s-*` CI) fails on a field declared
  `type: 'object'` inline — "Encountered anonymous inline object … you will need
  to create a top-level schema type for it" — because a GraphQL type must have a
  name. Give the shape its own `defineType` (e.g. `studySiteSettings`,
  `christmasColors`) and point the field at it. Existing documents are
  untouched: an object field stores the same data wherever its fields are
  declared.
* **Localized fields** come from [`localeFields.ts`](../sanity/schemas/common/localeFields.ts): add a language to `SUPPORTED_LANGUAGES` and every `localizedString`/`localizedRichText`/`localizedRichTextLite`/`localizedStringArray` object gains that field. Use `localizedField({ valueType })` in a schema rather than hand-writing per-language fields, and give the flag a matching entry in `LANGUAGE_FLAGS` in [`TranslateFieldWrapper.tsx`](../sanity/components/TranslateFieldWrapper.tsx) (the record is exhaustive, so the build fails until you do).
