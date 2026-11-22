# Optimizer service

A small Hono service that shrinks uploaded files before they reach R2: PDFs with
Ghostscript, images with sharp (to WebP). `hono/` calls it from
`POST /file-ops/finalize` and `POST /profiles/me/avatar` when `OPTIMIZER_URL` and
`OPTIMIZER_SECRET` are set. Rules for changing it: [`AGENTS.md`](AGENTS.md).

## `POST /optimize`

One staged file (`OptimizeFileRequest`), in order:

1. Verify the request signature, then the body.
2. Reject `missing` or `too-large` from the R2 HEAD, before downloading.
3. Read it and check the real file signature (`invalid-content` on a mismatch).
4. Optimize by type:
   - **Images** (jpg, jpeg, png, webp): EXIF-oriented, metadata stripped, max 2400 px
     on the long side, WebP. Walks a quality/size ladder to the 3 MB target; PNGs try
     lossless WebP first.
   - **PDFs**: stored as uploaded when already within 3 MB. Otherwise XMP is stripped
     (`pdf-metadata.ts`, pdf-lib) and Ghostscript runs at 150 → 120 → 96 → 72 dpi,
     stopping at the first result inside the 3.5 MB cap. A 200 dpi step leads the
     ladder only for uploads under 10 MB (bigger ones lack the headroom). Stripping
     runs before Ghostscript because Ghostscript re-emits XMP attached to embedded
     artwork. `/Bicubic` downsampling; 1-bit mono held at 300 dpi. **72 dpi is the
     floor** — below it scanned text stops being readable, so a file that cannot fit
     is rejected. A PDF still over the cap gets a size breakdown from `pdf-bloat.ts`
     in its rejection log.
   - **docx, xlsx, md**: can only be checked against the cap.
   - **Avatars** (`purpose: 'avatar'`): the image path, cropped square around the most
     interesting region at 320 px, aiming for 100 KB and at most 200 KB
     (`shared/config/avatar.ts`).
5. Between the 3 MB target and the 3.5 MB cap the best result is used; over the cap it
   is `too-large`. The cap is enforced again by the API on return.
6. Write `{destinationKeyBase}.{extension}` with immutable `Cache-Control`, then delete
   the staged copy.

## Contract

- Request: `OptimizeFileRequest` (`shared/types/file-upload.types.ts`) as JSON, signed
  with an HMAC over `${timestamp}.${body}` (`shared/utils/request-signature.ts`).
- Target: bucket names and keys must match what the API mints —
  `staging/<userId>/<uuid>.<ext>`, destination base `avatars/<userId>` or `<…>/<uuid>`.
  Anything else is `400 Invalid storage target` (`src/object-key.ts`).
- Response: `200` with an `OptimizeFileResult`, rejections included. `401`, `400` or
  `500` means the service is unavailable and the upload is refused, not stored raw.

## Logs

One line per request and one per file:

```
[OPTIMIZER_SUCCESS]: pdf -> pdf: 15.67 MB -> 3.48 MB (-78%) via gs 200dpi in 4.0s [gs 200dpi 3.48 MB in 3.7s] -> u/k.pdf
[OPTIMIZER_WARN]: pdf rejected as too-large (best 4.20 MB, cap 3.50 MB): smallest was gs 72dpi (metadata is 11.4 MB of 15.7 MB (73%), so downsampling has almost nothing to remove)
[OPTIMIZER_WARN]: POST /optimize 200 10224ms (file rejected: too-large)
```

The bracket lists each step's result and time, which separates a preset that does not
shrink a file from a run that hit the deadline. A rejection is a `200` (the service did
its job), so its request line is a warning that says why.

## Configuration

See `.env.example`. Give the service its own R2 token: read/write/delete on the staging
bucket and the university buckets (avatars share the same buckets).

## Running it

```bash
corepack pnpm dev:optimizer                                  # needs optimizer/.env and `gs`
corepack pnpm --filter @scriptr/optimizer build              # -> optimizer/dist/server.cjs
corepack pnpm --filter @scriptr/optimizer start
corepack pnpm --filter @scriptr/optimizer test
corepack pnpm --filter @scriptr/optimizer check-types
```

To point the API at it locally, set the same `OPTIMIZER_SECRET` and
`OPTIMIZER_URL=http://localhost:8788` in `hono/.env`.

### Build

esbuild bundles the service into one file. `sharp` (native) is the only
`dependencies` entry; everything else is a devDependency because it is bundled,
including `pdf-lib`. Breaking that ships modules the image never loads.

### Docker

```bash
docker build -f optimizer/Dockerfile -t scriptr-optimizer .   # from the repo root
docker run --rm -p 8788:8788 --env-file optimizer/.env scriptr-optimizer
curl http://localhost:8788/health                             # {"status":"ok"}
```

`node:24-trixie-slim` plus Ghostscript, non-root `node` user, `PORT` (default 8788).
On Apple Silicon add `--platform linux/amd64` — Cloud Run needs amd64.

## Deploying to Cloud Run

Deployed as `optimizer` in the GCP project and region below.

```bash
PROJECT=<gcp-project>; REGION=europe-west2; REPO=scriptr
IMAGE=$REGION-docker.pkg.dev/$PROJECT/$REPO/optimizer:latest

# Once per project
gcloud services enable run.googleapis.com artifactregistry.googleapis.com \
  cloudbuild.googleapis.com secretmanager.googleapis.com
gcloud artifacts repositories create $REPO --repository-format=docker --location=$REGION
# The image is ~480 MB against a 0.5 GB free allowance: keep the last two builds.
cat > /tmp/cleanup-policy.json <<'JSON'
[{ "name": "keep-two", "action": { "type": "Keep" }, "mostRecentVersions": { "keepCount": 2 } }]
JSON
gcloud artifacts repositories set-cleanup-policies $REPO --location=$REGION \
  --policy=/tmp/cleanup-policy.json

# A project created after mid-2024 gives the default compute service account no
# roles, so Cloud Build cannot read its source, push, or write logs.
BUILD_SA=$(gcloud projects describe $PROJECT --format='value(projectNumber)')-compute@developer.gserviceaccount.com
gcloud storage buckets add-iam-policy-binding gs://${PROJECT}_cloudbuild \
  --member="serviceAccount:$BUILD_SA" --role=roles/storage.objectViewer
gcloud projects add-iam-policy-binding $PROJECT \
  --member="serviceAccount:$BUILD_SA" --role=roles/artifactregistry.writer
gcloud projects add-iam-policy-binding $PROJECT \
  --member="serviceAccount:$BUILD_SA" --role=roles/logging.logWriter

# Secrets go in through stdin so they stay out of shell history.
printf '%s' "$OPTIMIZER_SECRET"     | gcloud secrets create optimizer-secret --data-file=-
printf '%s' "$R2_ACCESS_KEY_ID"     | gcloud secrets create optimizer-r2-access-key-id --data-file=-
printf '%s' "$R2_SECRET_ACCESS_KEY" | gcloud secrets create optimizer-r2-secret-access-key --data-file=-
RUN_SA=optimizer-run@$PROJECT.iam.gserviceaccount.com
gcloud iam service-accounts create optimizer-run --display-name="Optimizer Cloud Run"
for s in optimizer-secret optimizer-r2-access-key-id optimizer-r2-secret-access-key; do
  gcloud secrets add-iam-policy-binding $s --member="serviceAccount:$RUN_SA" \
    --role=roles/secretmanager.secretAccessor --quiet
done

gcloud builds submit --config optimizer/cloudbuild.yaml --substitutions _IMAGE=$IMAGE .
gcloud run deploy optimizer --image $IMAGE --region $REGION \
  --service-account $RUN_SA \
  --allow-unauthenticated \
  --cpu 1 --memory 2Gi --concurrency 2 --timeout 100 --cpu-boost \
  --min-instances 0 --max-instances 3 \
  --set-env-vars R2_ENDPOINT=<r2-endpoint>,OPTIMIZER_MAX_CONCURRENCY=2 \
  --set-secrets OPTIMIZER_SECRET=optimizer-secret:latest,R2_ACCESS_KEY_ID=optimizer-r2-access-key-id:latest,R2_SECRET_ACCESS_KEY=optimizer-r2-secret-access-key:latest

URL=$(gcloud run services describe optimizer --region $REGION --format='value(status.url)')
curl -s -o /dev/null -w "health %{http_code}\n" $URL/health
curl -s -o /dev/null -w "unsigned %{http_code}\n" -X POST $URL/optimize \
  -H 'Content-Type: application/json' -d '{}'
```

Why these settings:

- **`--allow-unauthenticated`**: Cloud Run IAM cannot authenticate the API. The HMAC
  signature is the authentication; max-instances plus a budget alert bound the cost of
  someone hammering the URL.
- **`--concurrency 2`, `--memory 2Gi`**: matches `OPTIMIZER_MAX_CONCURRENCY`; two large
  images can need over 1 GiB, and Cloud Run's `/tmp` is in memory, where Ghostscript
  writes.
- **`--timeout 100`**: above the service's 80 s deadline and the API's 90 s, so the
  service gives up first.
- **`--min-instances 0`**: scale to zero; a cold start is just a Node process.
- **`europe-west2`**: the Supabase project is `eu-west-2` and the Vercel functions run
  in `fra1`, so a US region would add an Atlantic round trip to every call. The registry
  is in the same region so a cold start does not pull the image across an ocean.

### Changing the region

The region is where the image and service live, not configuration the service reads:

1. `REGION=` above and the `_IMAGE` default in [`cloudbuild.yaml`](cloudbuild.yaml).
2. Create the registry there; repositories cannot move.
3. `gcloud run deploy --region …` creates a **new service with a new URL**; delete the
   old one afterwards.
4. Update `OPTIMIZER_URL` in the `scriptr-api` Vercel project and redeploy.
5. Secrets and the service account are project-level — no action.

Then check a real upload.

## Tests

No Ghostscript or R2 needed: the PDF logic takes an injected runner and storage is in
memory. Images run sharp for real; Ghostscript itself is uncovered, so try real PDFs.
