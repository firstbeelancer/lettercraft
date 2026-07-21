# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/package.json
RUN npm install --workspaces --include-workspace-root=false

COPY apps/web ./apps/web
WORKDIR /repo/apps/web
ARG VITE_API_PROXY=
ENV VITE_API_PROXY=${VITE_API_PROXY}
RUN npm run build

# ---------- prod ----------
FROM nginx:1.27-alpine AS prod
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
