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
ARG SCOOPS_SERVER_PROXY_URL

ENV VITE_SCOOPS_SERVER_APP_URL=$VITE_SCOOPS_SERVER_APP_URL
ENV VITE_SCOOPS_SERVER_API_PREFIX=$VITE_SCOOPS_SERVER_API_PREFIX
ENV SCOOPS_SERVER_PROXY_URL=$SCOOPS_SERVER_PROXY_URL

COPY . .

RUN pnpm --filter web build

FROM base AS runtime

ENV NODE_ENV=production

COPY --from=build /app /app

WORKDIR /app/apps/web
USER node

EXPOSE 8080

CMD ["node", ".output/server/index.mjs"]
