# Out of Scope

* Push delivery, Sanity-authored notifications, and moderator escalation.
* Non-script search.
* IP/device-based repeat-account prevention.
* Restriction enforcement for file operations.
* Comments stay in the language they were written in; user-generated text is
  never translated.
* A third language. `LOCALES` plus translations is the whole change — the
  routing, the fallback chain and both schemas are already N-language — but
  nothing is built for it yet. The admin surface stays in the default
  language on purpose: it is maintainer-only, and translating it would double
  every label without a reader who wants it.

Academic sync/dependency tooling is deferred — the per-document sync covers the
current scale.
