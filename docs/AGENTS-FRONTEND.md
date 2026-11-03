# Frontend (`next/`) — Next.js 16, React 19

The root [Global Rules](../AGENTS.md#global-rules) still apply. Architecture: [Frontend Structure & UI Conventions](ARCHITECTURE-FRONTEND.md) and [API Client & Response Typing](ARCHITECTURE-API-CLIENT.md).

* Server Components by default; add `'use client'` only for real interactivity/state/effects and `'use server'` only for real Server Actions. No speculative directives.
* React Compiler is on (`reactCompiler: true`) — don't hand-write `useMemo`/`useCallback`/`React.memo`; justify any exception in a comment.
* `params`/`searchParams` are `Promise`s in pages, layouts and `generateMetadata` — always `await`. This is a hard failure in 16, not a warning as in 15.
* Turbopack is the default bundler; no webpack-specific config without a documented reason.
* There is no middleware today. If request interception is needed, add `proxy.ts` (Node.js runtime) — never `middleware.ts`.
* `revalidateTag()` needs a `cacheLife` profile (a bare single-argument call behaves differently now); scripts revalidate by tag on mutation ([`ARCHITECTURE-SCRIPTS-UPLOADS.md`](ARCHITECTURE-SCRIPTS-UPLOADS.md)). `/api/revalidate` keeps `revalidateTag(tag, { expire: 0 })` so a mutation never serves stale data.
* `next/image`: assume 16-era defaults (async decoding, `fetchPriority: auto`, `qualities`/`minimumCacheTTL`/`imageSizes` in `next.config.ts`) — not the 15 behaviour.
* UI: follow [`next/STYLING_GUIDE.md`](../next/STYLING_GUIDE.md) exactly — reuse `Box`/`Card`/`Button`/`Badge`/`Divider` and the `ui-*`/`cp-*` classes; never invent a class absent from `styles/`. Theme through `next/providers/theme/`, never hardcoded colours. Add a utility only at 3+ repeats, and update the guide.
* **API calls:** only `apiFetch` (`next/lib/api/next-api.ts`) and the per-domain wrappers in `next/lib/api/*-api.ts`, with paths from `apiRoutes` (`shared/config/api-routes.ts`) — never a new `fetch` pattern or a hardcoded path string.
* Every screen needs loading, error and empty states, and semantic/ARIA-correct HTML.
* **Keep pages thin:** a new or refactored `page.tsx` awaits params, calls a loader in `next/lib/<feature>-page.ts` (fetching, cookies, 404s) and composes components that take a view model from `next/types/components/`. Components don't fetch; one responsibility each. See [`ARCHITECTURE-FRONTEND.md`](ARCHITECTURE-FRONTEND.md).
