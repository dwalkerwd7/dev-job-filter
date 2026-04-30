# Stage 1: Build Next.js dashboard (standalone output)
FROM node:20-slim AS dashboard-builder
WORKDIR /build
COPY dashboard/package*.json .
RUN npm ci
COPY dashboard/ .
ENV NEXT_PUBLIC_BASE_PATH=/dev-job-filter
RUN npm run build

# Stage 2: Runtime — Node + Playwright Chromium
FROM node:20
WORKDIR /app

ENV PORT=5002
ENV HOSTNAME=0.0.0.0

# Install pipeline deps + Playwright browser + system deps
COPY pipeline/package*.json ./pipeline/
RUN cd pipeline && npm ci
RUN cd pipeline && npx playwright install --with-deps chromium

# Copy pipeline source
COPY --chown=node:node pipeline/ ./pipeline/

# Copy Next.js standalone build
COPY --chown=node:node --from=dashboard-builder /build/.next/standalone ./dashboard/
COPY --chown=node:node --from=dashboard-builder /build/.next/static ./dashboard/.next/static
#COPY --chown=node:node --from=dashboard-builder /build/public ./dashboard/public

EXPOSE ${PORT}

USER node
ENTRYPOINT ["node", "dashboard/server.js"]
