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

ARG SCOOPS_SERVER_APP_MODE
ARG SENTRY_ORG
ARG SENTRY_PROJECT
ARG SCOOPS_RELEASE_SHA

COPY . .

RUN --mount=type=secret,id=sentry_auth_token,env=SENTRY_AUTH_TOKEN,required=false \
  pnpm --filter server build

FROM base AS runtime

ARG SCOOPS_RELEASE_SHA

ENV NODE_ENV=production
ENV SCOOPS_RELEASE_SHA=$SCOOPS_RELEASE_SHA

COPY --from=build /app /app

WORKDIR /app/apps/server
USER node

EXPOSE 8080

CMD ["node", "dist/main.js"]

FROM runtime AS release

CMD ["corepack", "pnpm", "db:migration:apply"]
