# `optimizer/` — file optimizer

Repo rules: [`../AGENTS.md`](../AGENTS.md). Behaviour, contract and deploy runbook:
[`README.md`](README.md).

- `hono/` calls it from `POST /file-ops/finalize` and `POST /profiles/me/avatar`; it
  never writes to Supabase.
- Every `/optimize` call is HMAC-signed (`x-optimizer-timestamp`,
  `x-optimizer-signature` over `${timestamp}.${body}`,
  `shared/utils/request-signature.ts`); a signature older than ±5 minutes is rejected.
  No route bypasses `verifyRequest`.
- Buckets and keys are validated against the shapes the API mints
  (`src/object-key.ts`), so a leaked secret cannot reach an arbitrary object.
- A file verdict is never a status code: a rejection is `200` with an
  `OptimizeFileResult`. Non-2xx (`401` signature, `400` request, `500` storage) means
  "service unavailable" and the upload is refused.
- An 80 s per-file deadline (queueing included) sits under the API's 90 s timeout; past
  it the service stops and writes nothing. Concurrency is `OPTIMIZER_MAX_CONCURRENCY`
  (default 2) — a 20 MB photo decodes to hundreds of MB.
- The bundle is esbuild output with `sharp` as the only external dependency; everything
  else stays a devDependency because it is bundled. Breaking that ships modules the
  image never loads.
- A new variable gets an entry in `ENV_REQUIREMENTS` (`src/server.ts`). Names only,
  never values.
- Tests run without Ghostscript or R2 (injected runner, in-memory storage); images run
  sharp for real, so try real PDFs by hand.
