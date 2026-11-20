# Out of Scope

- Push delivery, Sanity-authored notifications, moderator escalation.
- Non-script search.
- IP/device repeat-account prevention.
- Restriction enforcement for file operations.
- Translating user-generated text: comments stay in the language they were written in.
- A third language. `LOCALES` plus translations is the whole change — routing, the
  fallback chain and both schemas are already N-language — but nothing is built for it.
  The admin surface stays in the default language: maintainer-only, and translating it
  doubles every label without a reader who wants it.
- Academic sync/dependency tooling: the per-document sync covers the current scale.
