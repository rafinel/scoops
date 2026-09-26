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

ARG VITE_SCOOPS_SERVER_APP_URL
ARG VITE_SCOOPS_SERVER_API_PREFIX
ARG VITE_SCOOPS_WEB_APP_MODE
ARG VITE_SENTRY_DSN
ARG VITE_SCOOPS_RELEASE_SHA
ARG SENTRY_ORG
ARG SENTRY_PROJECT
ARG SCOOPS_SERVER_PROXY_URL

ENV VITE_SCOOPS_SERVER_APP_URL=$VITE_SCOOPS_SERVER_APP_URL
ENV VITE_SCOOPS_SERVER_API_PREFIX=$VITE_SCOOPS_SERVER_API_PREFIX
ENV VITE_SCOOPS_WEB_APP_MODE=$VITE_SCOOPS_WEB_APP_MODE
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
ENV VITE_SCOOPS_RELEASE_SHA=$VITE_SCOOPS_RELEASE_SHA
ENV SCOOPS_SERVER_PROXY_URL=$SCOOPS_SERVER_PROXY_URL

COPY . .

RUN --mount=type=secret,id=sentry_auth_token,env=SENTRY_AUTH_TOKEN,required=false \
  pnpm --filter web build

FROM base AS runtime

ARG VITE_SCOOPS_SERVER_APP_URL

ENV NODE_ENV=production
ENV VITE_SCOOPS_SERVER_APP_URL=$VITE_SCOOPS_SERVER_APP_URL

COPY --from=build /app /app

WORKDIR /app/apps/web
USER node

EXPOSE 8080

CMD ["node", ".output/server/index.mjs"]
