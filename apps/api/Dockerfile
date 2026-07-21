# ---------- deps ----------
FROM node:20-alpine AS deps
WORKDIR /repo
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/package.json
# Need full deps (including drizzle-kit, tsx) for migration/seed in prod stage
RUN npm install --workspaces --include-workspace-root=false

# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY package.json ./
COPY apps/api ./apps/api
WORKDIR /repo/apps/api
RUN npx drizzle-kit generate --config=drizzle.config.ts || true
RUN npm run build

# ---------- migrate+seed ----------
FROM node:20-alpine AS migrator
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY package.json ./
COPY apps/api ./apps/api
WORKDIR /repo/apps/api
# Run migrations + seed at image build time using DATABASE_URL
ARG DATABASE_URL=postgresql://lettercraft:lettercraft@db:5432/lettercraft
ENV DATABASE_URL=${DATABASE_URL}
RUN npx drizzle-kit push --config=drizzle.config.ts || true
RUN npx tsx src/db/seed.ts || true

# ---------- prod ----------
FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV STORAGE_ROOT=/data/lettercraft-storage

COPY package.json ./
COPY apps/api/package.json ./apps/api/package.json
RUN npm install --workspaces --include-workspace-root=false

# Built artifacts
COPY --from=build /repo/apps/api/dist ./apps/api/dist
COPY --from=build /repo/apps/api/drizzle ./apps/api/drizzle
COPY --from=build /repo/apps/api/drizzle.config.ts ./apps/api/drizzle.config.ts
COPY --from=build /repo/node_modules/.bin ./node_modules/.bin

# Storage
RUN mkdir -p /data/lettercraft-storage

WORKDIR /app/apps/api

CMD ["node", "dist/server.js"]
