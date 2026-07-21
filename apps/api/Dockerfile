# ---------- deps ----------
FROM node:20-alpine AS deps
WORKDIR /repo
# include workspace root so npm can resolve @lettercraft/api properly
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/package.json
RUN npm install --workspaces --include-workspace-root=false --omit=dev=false

# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY package.json ./
COPY apps/api ./apps/api
WORKDIR /repo/apps/api
RUN npx drizzle-kit generate --config=drizzle.config.ts || true
RUN npm run build

# ---------- prod ----------
FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV STORAGE_ROOT=/data/lettercraft-storage

# Install only production deps
COPY package.json ./
COPY apps/api/package.json ./apps/api/package.json
RUN npm install --workspaces --include-workspace-root=false --omit=dev

# Built artifacts
COPY --from=build /repo/apps/api/dist ./apps/api/dist
COPY --from=build /repo/apps/api/drizzle ./apps/api/drizzle
COPY --from=build /repo/apps/api/drizzle.config.ts ./apps/api/drizzle.config.ts
COPY --from=build /repo/apps/api/src/db/seed.ts ./apps/api/src/db/seed.ts
COPY --from=build /repo/apps/api/src/db/schema.ts ./apps/api/src/db/schema.ts
COPY --from=build /repo/apps/api/src/db/index.ts ./apps/api/src/db/index.ts
COPY --from=build /repo/node_modules/.bin ./node_modules/.bin

# Storage
RUN mkdir -p /data/lettercraft-storage

WORKDIR /app/apps/api

# Auto-migrate + start
CMD sh -c "npx --prefix /app drizzle-kit push --config=drizzle.config.ts && npx tsx src/db/seed.ts && node dist/server.js"
