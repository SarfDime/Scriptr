# Optimizer service

A small Hono service that shrinks uploaded files before they are stored in R2:
PDFs with Ghostscript, images with sharp (converted to WebP). The API calls it
from `POST /file-ops/finalize` and `POST /profiles/me/avatar` when
`OPTIMIZER_URL` and `OPTIMIZER_SECRET` are set; see `docs/ARCHITECTURE.md` and
`docs/PROGRESS.md`.

## What `POST /optimize` does

For one staged file (`OptimizeFileRequest`), in order:

1. Verify the request signature, then validate its body.
2. Look the staged object up in R2 and reject it as `missing` or `too-large`
   (over the upload limit for its type) before downloading anything.
3. Read it and check the real file signature (`invalid-content` if it isn't
   what its extension claims).
4. Optimize it by type:
   - **Images** (jpg, jpeg, png, webp): oriented by EXIF, stripped of metadata
     (so GPS data is dropped), at most 2400 px on the long side, and converted to
     WebP. It walks down a quality and size ladder until the result fits the
     3 MB target; PNGs try lossless WebP first so screenshots stay crisp.
   - **PDFs**: stored as uploaded when already within the 3 MB target. Larger
     ones have their embedded XMP stripped first (`pdf-metadata.ts`, pdf-lib),
     then go through Ghostscript at **150, then 120, then 96, then 72 dpi**,
     stopping at the first result that fits the 3.5 MB cap. A **200 dpi** step
     leads the ladder, but only when the uploaded file is under 10 MB — a bigger
     document rarely has the headroom, so the pass would be wasted before the
     ladder reached a resolution that fits. Measured on the upload, not the
     stripped copy, so a large upload that strips down small still skips it. Stripping
     runs
     *before* Ghostscript on purpose: Ghostscript re-emits XMP attached to
     embedded artwork instead of dropping it, so stripping first saves both the
     bytes and the work of copying them through. It costs no pixels, and on a
     real 15.7 MB InDesign manual (11.4 MB of it XMP) it was the difference
     between storing the file at 50 dpi and storing it at 200 dpi. When metadata
     alone brings a file within the target it is stored without Ghostscript
     re-encoding anything. It does not keep
     grinding down to the smallest result: `TARGET_STORED_FILE_BYTES` may be
     missed when going lower costs quality. A resolution ladder is used rather
     than Ghostscript's named presets because the presets jump straight from
     about 150 dpi to about 72 and overshoot — on a 24-page 400 dpi scan, 120 dpi
     already fitted the cap at 2.9 MB where 72 dpi gave 1.4 MB for the same
     storable result. **72 dpi is the floor**: below it the quality loss stops
     being small and text scanned as an image stops being comfortable, so a file
     that cannot fit there is rejected rather than quietly destroyed.
     Colour and grey are downsampled with `/Bicubic` — sharper than the old
     `/Average` — and 1-bit mono images (glyph masks) are held at 300 dpi instead
     of greying out. Every step also drops document XMP, the Info dates and the
     file ID, and writes the catalogue and cross-reference table as compressed
     object streams.
     A PDF still over the cap gets a diagnosis in its rejection log, from
     `pdf-bloat.ts`: it reports how the bytes split between metadata, images and
     content streams. Ghostscript re-emits XMP attached to embedded artwork and
     will not drop it, so a metadata-dominated PDF cannot be helped by
     downsampling further and the log says so instead of costing more quality.
   - **docx, xlsx, md**: can't be shrunk, so they only have to fit the cap.
   - **Avatars** (`purpose: 'avatar'`): the same image path, but cropped square
     around the most interesting region at 320 px and held to the avatar limits
     instead (aiming for 100 KB, at most 200 KB; `shared/config/avatar.ts`). A
     single 320 px WebP is small enough that the ladder rarely runs past its
     first step.
5. If the best result is over the 3 MB target but within the 3.5 MB cap, use it;
   if it can't get under the cap, reject as `too-large`. The cap is enforced
   again after the optimizer returns, whatever it returned.
6. Write the final object (`{destinationKeyBase}.{extension}`, immutable
   `Cache-Control`), then delete the staged copy.

## Contract

- Request: `OptimizeFileRequest` (`shared/types/file-upload.types.ts`) as JSON,
  signed with an HMAC over `${timestamp}.${body}` using `OPTIMIZER_SECRET`
  (`shared/utils/request-signature.ts`, headers `x-optimizer-timestamp` and
  `x-optimizer-signature`). A signature older than ±5 minutes is rejected.
- Target: the buckets must be valid bucket names and the keys must follow the
  shapes the API mints — `staging/<userId>/<uuid>.<ext>` and a destination base
  ending in a generated id (`avatars/<userId>`, `<…>/<uuid>`). Anything else is
  `400 Invalid storage target`, so a leaked secret cannot reach an arbitrary
  object (`optimizer/src/object-key.ts`).
- Response: `200` with an `OptimizeFileResult` for everything decided about the
  file, rejections included. A non-2xx status (`401` bad signature, `400` bad
  request, `500` when R2 can't be reached) is read by the API as the service
  being unavailable, and the upload is rejected rather than stored unoptimized.
- Time: each file gets an 80 s deadline, queueing included, under the API's own
  90 s timeout. Past it the service stops and writes nothing, so a request the
  API has already given up on doesn't leave an orphaned object.
- Concurrency: at most `OPTIMIZER_MAX_CONCURRENCY` files at once (default 2). A
  20 MB photo decodes to hundreds of MB, and one finalize can send ten files.

## Logs

One line per request, in the API's format, and one line per file just before
it saying what was done and what came of it:

```
[OPTIMIZER_SUCCESS]: pdf -> pdf: 15.67 MB -> 3.48 MB (-78%) via gs 200dpi in 4.0s [gs 200dpi 3.48 MB in 3.7s] -> u/k.pdf
[OPTIMIZER_SUCCESS]: jpg -> webp: 4.21 MB -> 310.2 KB (-93%) via webp q80 max 2400px in 480ms [q80 max 2400px 310.2 KB in 480ms] -> u/k.webp
[OPTIMIZER_WARN]: pdf rejected as too-large (best 4.20 MB, cap 3.50 MB): smallest was gs 72dpi (metadata is 11.4 MB of 15.7 MB (73%) and images are only 1.6 MB (10%), so downsampling has almost nothing to remove) after 14.0s [gs 150dpi 4.06 MB in 4.0s, gs 120dpi 3.79 MB in 4.7s, gs 96dpi 3.75 MB in 5.3s, gs 72dpi 3.75 MB in 5.3s]
[OPTIMIZER_WARN]: pdf rejected as failed: deadline passed before gs 120dpi after 80.1s [gs 150dpi 8.10 MB in 80.0s]
[OPTIMIZER_SUCCESS]: POST /optimize 200 41.2s
```

When a file doesn't fit, the bracketed list shows where it stalled: which steps
ran, how big each result was, and how long each took. That tells apart a preset
that doesn't shrink a file from a run that hit the deadline. The parenthesis
before it says what the file is made of, which is what says whether any further
step could have helped at all.

A rejected file is still answered with a `200` (the service did its job; the
verdict is in the body), so its request line is logged as a warning that says
why, not as a success:

```
[OPTIMIZER_WARN]: POST /optimize 200 10224ms (file rejected: too-large)
```

## Configuration

See `.env.example`. The R2 variables are the same ones the API uses, but give
this service its own token, scoped to the staging bucket and the university
buckets (read, write, delete). Avatars are written to the same buckets, so no
extra access is needed.

## Running it

```bash
# Development: reloads on change; needs optimizer/.env, and Ghostscript (`gs`) for PDFs
corepack pnpm dev:optimizer

# The production bundle
corepack pnpm --filter @scriptr/optimizer build   # -> optimizer/dist/server.cjs
corepack pnpm --filter @scriptr/optimizer start

corepack pnpm --filter @scriptr/optimizer test
corepack pnpm --filter @scriptr/optimizer check-types
```

To point the API at it locally, set the same `OPTIMIZER_SECRET`, plus
`OPTIMIZER_URL=http://localhost:8788`, in `hono/.env`.

### Build

The service is bundled into one file with esbuild. Only `sharp` (a native
module) stays external, so it is the only `dependencies` entry; everything else
in `package.json` is a devDependency because it is bundled — including
`pdf-lib`, which is pure JavaScript and adds about 1 MB to the bundle. Keep it that way, or
the Docker image will carry modules it never loads.

### Docker

```bash
# From the repository root: the build needs the workspace and shared/
docker build -f optimizer/Dockerfile -t scriptr-optimizer .
docker run --rm -p 8788:8788 --env-file optimizer/.env scriptr-optimizer
curl http://localhost:8788/health   # {"status":"ok"}
```

The image is `node:24-trixie-slim` plus Ghostscript, runs as the non-root `node`
user, and listens on `PORT` (default 8788). Building on Apple Silicon makes an
arm64 image; Cloud Run needs amd64, so add `--platform linux/amd64`.

## Deploying to Cloud Run

**Deployed:** `optimizer` in `REDACTED_GCP_PROJECT` / `europe-west2`, verified on
29 Oct 2026 — health check, an unsigned request rejected with `401`, an avatar
(1.19 MB PNG → 16 KB WebP) and a 10 MB image-only PDF through Ghostscript
(`/ebook`, 833 ms, 2.5 KB result). The commands below are what was run.

```bash
# London, to match the eu-west-2 Supabase project (see the settings below).
PROJECT=<gcp-project>; REGION=europe-west2; REPO=scriptr
IMAGE=$REGION-docker.pkg.dev/$PROJECT/$REPO/optimizer:latest

# Once per project
gcloud services enable run.googleapis.com artifactregistry.googleapis.com \
  cloudbuild.googleapis.com secretmanager.googleapis.com
gcloud artifacts repositories create $REPO --repository-format=docker --location=$REGION
# The image is ~480 MB against a 0.5 GB free allowance, so keep the last two
# builds and let the rest expire. --policy takes a file, not inline JSON.
cat > /tmp/cleanup-policy.json <<'JSON'
[{ "name": "keep-two", "action": { "type": "Keep" }, "mostRecentVersions": { "keepCount": 2 } }]
JSON
gcloud artifacts repositories set-cleanup-policies $REPO --location=$REGION \
  --policy=/tmp/cleanup-policy.json

# Cloud Build runs as the default compute service account, which on a project
# created after mid-2024 has no roles at all: `builds submit` fails with
# "could not resolve source ... does not have storage.objects.get" until it can
# read the source tarball, push the image and write logs.
BUILD_SA=$(gcloud projects describe $PROJECT --format='value(projectNumber)')-compute@developer.gserviceaccount.com
gcloud storage buckets add-iam-policy-binding gs://${PROJECT}_cloudbuild \
  --member="serviceAccount:$BUILD_SA" --role=roles/storage.objectViewer
gcloud projects add-iam-policy-binding $PROJECT \
  --member="serviceAccount:$BUILD_SA" --role=roles/artifactregistry.writer
gcloud projects add-iam-policy-binding $PROJECT \
  --member="serviceAccount:$BUILD_SA" --role=roles/logging.logWriter

# Secrets (read from stdin so they stay out of shell history)
printf '%s' "$OPTIMIZER_SECRET"      | gcloud secrets create optimizer-secret --data-file=-
printf '%s' "$R2_ACCESS_KEY_ID"      | gcloud secrets create optimizer-r2-access-key-id --data-file=-
printf '%s' "$R2_SECRET_ACCESS_KEY"  | gcloud secrets create optimizer-r2-secret-access-key --data-file=-
# The service account Cloud Run runs as needs roles/secretmanager.secretAccessor on each.
RUN_SA=optimizer-run@$PROJECT.iam.gserviceaccount.com
gcloud iam service-accounts create optimizer-run --display-name="Optimizer Cloud Run"
for s in optimizer-secret optimizer-r2-access-key-id optimizer-r2-secret-access-key; do
  gcloud secrets add-iam-policy-binding $s --member="serviceAccount:$RUN_SA" \
    --role=roles/secretmanager.secretAccessor --quiet
done

# Build and push (from the repository root)
gcloud builds submit --config optimizer/cloudbuild.yaml --substitutions _IMAGE=$IMAGE .

# Deploy
gcloud run deploy optimizer --image $IMAGE --region $REGION \
  --service-account $RUN_SA \
  --allow-unauthenticated \
  --cpu 1 --memory 2Gi --concurrency 2 --timeout 100 --cpu-boost \
  --min-instances 0 --max-instances 3 \
  --set-env-vars R2_ENDPOINT=<r2-endpoint>,OPTIMIZER_MAX_CONCURRENCY=2 \
  --set-secrets OPTIMIZER_SECRET=optimizer-secret:latest,R2_ACCESS_KEY_ID=optimizer-r2-access-key-id:latest,R2_SECRET_ACCESS_KEY=optimizer-r2-secret-access-key:latest

# Sanity check: 200, then 401 from the signature gate
URL=$(gcloud run services describe optimizer --region $REGION --format='value(status.url)')
curl -s -o /dev/null -w "health %{http_code}\n" $URL/health
curl -s -o /dev/null -w "unsigned %{http_code}\n" -X POST $URL/optimize \
  -H 'Content-Type: application/json' -d '{}'
```

Why these settings:

- **`--allow-unauthenticated`**: the API is not a Google identity, so Cloud Run
  IAM can't authenticate it. The HMAC signature on every `/optimize` call is the
  authentication. Requests with a bad signature are cheap but still reach the
  container, so the max-instances cap and a budget alert are what bound the cost
  of someone hammering the URL.
- **`--concurrency 2`, `--memory 2Gi`**: matches `OPTIMIZER_MAX_CONCURRENCY`. Two
  large images decoding at once can need over 1 GiB, and Cloud Run's `/tmp` is
  in memory, which is where Ghostscript writes.
- **`--timeout 100`**: above the service's 80 s deadline and the API's 90 s
  timeout, so the service gives up first.
- **`--min-instances 0`**: scale to zero. A cold start is a Node process
  starting, which is quick, and the first upload after idle is the only one that
  pays it.
- **`REGION=europe-west2`**: the Supabase project is `eu-west-2` (London) and the
  users are in Europe, so a US region would put an Atlantic round trip on every
  call, including the API → service hop and the R2 write. Both Vercel projects
  run their functions in `fra1`, so this is a ~15 ms hop. The Artifact Registry
  repository is in the same region so a cold start never pulls the image across
  the ocean. Cloud Run's per-unit price and free allowance are identical in both.

### Changing the region later

The region is not configuration the service reads — it is where the image and
the service live, so moving it means re-creating both. Everything to touch:

1. `REGION=` in the deploy block above, and the `_IMAGE` substitution default in
   [`cloudbuild.yaml`](cloudbuild.yaml) (the path starts with the region).
2. Re-create the registry there: `gcloud artifacts repositories create …`.
   Repositories cannot move between regions; the old one can be deleted once
   the new image is deployed.
3. `gcloud run deploy --region …` — this creates a **new service with a new
   URL**. The old service keeps running until it is deleted
   (`gcloud run services delete optimizer --region <old>`).
4. Update `OPTIMIZER_URL` in the `scriptr-api` Vercel project and redeploy it;
   the API signs requests to whatever that URL is, so nothing else changes.
5. Secrets and the service account are project-level, not regional — no action.

Worth knowing if Frankfurt ever becomes the better answer (`europe-west3`, same
city as Vercel's `fra1`): the saving is ~10 ms on a request that spends 1–2 s
doing work, so only move for a reason other than latency.

Then set `OPTIMIZER_URL` (the service URL Cloud Run prints) and the same
`OPTIMIZER_SECRET` on the `scriptr-api` Vercel project. Check with a real upload
before relying on it.

## Tests

They run without Ghostscript or R2: the PDF logic goes through an injected
runner, and storage is in memory. The image tests run sharp for real. The one
thing they don't cover is Ghostscript itself, so try real PDFs by hand.
