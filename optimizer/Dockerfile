# syntax=docker/dockerfile:1

# Build from the repository root, so the workspace and `shared/` are in context:
#
#   docker build -f optimizer/Dockerfile -t scriptr-optimizer .
#
# The service is bundled into one file at build time, so the only runtime
# dependency is `sharp` (a native module). Everything else in
# optimizer/package.json is a devDependency on purpose.

ARG NODE_IMAGE=node:24-trixie-slim

FROM ${NODE_IMAGE} AS build
WORKDIR /repo
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
# Runs the pnpm version pinned by the root package.json's `packageManager`.
RUN corepack enable

# Manifests first, so the install stays cached until a dependency changes. The
# lockfile covers every workspace, so every manifest has to be present.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY hono/package.json hono/
COPY next/package.json next/
COPY sanity/package.json sanity/
COPY shared/package.json shared/
COPY optimizer/package.json optimizer/
RUN pnpm install --frozen-lockfile --filter @scriptr/optimizer...

COPY shared shared
COPY optimizer optimizer
RUN pnpm --filter @scriptr/optimizer build
# Just the production dependencies (sharp and what it needs), for the image below.
RUN pnpm --filter @scriptr/optimizer deploy --prod /deploy

FROM ${NODE_IMAGE} AS runtime
# Ghostscript shrinks PDFs. Debian 13 ships a recent release; keep the base image
# current, since this process parses files strangers upload.
RUN apt-get update \
 && apt-get install -y --no-install-recommends ghostscript \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /deploy/node_modules ./node_modules
COPY --from=build /repo/optimizer/dist ./dist
ENV NODE_ENV=production
# Not root: the `node` user comes with the base image. Cloud Run supplies PORT.
USER node
EXPOSE 8788
CMD ["node", "--enable-source-maps", "dist/server.cjs"]
