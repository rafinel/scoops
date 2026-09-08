# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

WORKDIR /app

FROM base AS dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/email/package.json packages/email/package.json
COPY packages/validation/package.json packages/validation/package.json

RUN pnpm install --frozen-lockfile

FROM dependencies AS build

COPY . .

RUN pnpm --filter server build

FROM base AS runtime

ENV NODE_ENV=production

COPY --from=build /app /app

WORKDIR /app/apps/server
USER node

EXPOSE 8080

CMD ["node", "dist/main.js"]

FROM runtime AS release

CMD ["corepack", "pnpm", "db:migration:apply"]
