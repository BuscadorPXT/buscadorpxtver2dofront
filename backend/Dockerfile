# No BuildKit requirements here
FROM node:22-alpine AS builder

# Cache buster - change this value to force rebuild
ARG CACHEBUST=2025-11-30-19-17
RUN echo "Cache bust: $CACHEBUST"

WORKDIR /app

# pnpm (match your packageManager)
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate

# Install deps (cacheable layer)
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# Build
COPY . .
RUN pnpm run build

# Trim to production deps only
RUN pnpm prune --prod

# ---- Runner ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create cache directory with proper permissions
RUN mkdir -p /app/cache && chmod 777 /app/cache

# Copy production deps and built files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/dist ./dist

# Copy migrations and migration runner
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/run-migrations.js ./run-migrations.js

# Entrypoint that can run the seed once (gated by env var)
COPY docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

COPY ./google-service-account-key.json /app/google-service-account-key.json
ENV GOOGLE_APPLICATION_CREDENTIALS=/app/google-service-account-key.json

# Default Nest port (change if you use another)
EXPOSE 3001

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "dist/main.js"]
