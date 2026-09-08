# Stage 1: Builder — install all deps, type-check, and build frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx tsc --noEmit
RUN npm run build

# Stage 2: Runner — production-only runtime
FROM node:20-alpine AS runner
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js
RUN mkdir -p data
EXPOSE 3000
CMD ["node", "server.js"]
