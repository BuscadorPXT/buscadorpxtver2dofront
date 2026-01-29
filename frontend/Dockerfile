FROM node:22-alpine AS builder
WORKDIR /app

# pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

# Instalar deps primeiro para cache de camadas
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# Build (sem cache para garantir versão atualizada)
COPY . .
RUN rm -rf dist node_modules/.vite && pnpm run build

FROM nginx:1.27-alpine AS runner
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
# CMD padrão do nginx já é "nginx -g 'daemon off;'"
