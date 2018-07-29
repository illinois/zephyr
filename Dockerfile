FROM node:10 AS builder
WORKDIR /build/
COPY . .
RUN npm install --unsafe-perm
RUN npm run build && cd packages/zephyr-grade-server && npx pkg -t node10-alpine -o zephyr-pkg ./lib/index.js

FROM alpine:latest
ENV IN_DOCKER=true
RUN \
  # Add edge repos
  echo '@edge http://dl-cdn.alpinelinux.org/alpine/edge/main' >> /etc/apk/repositories && \
  echo '@edge http://dl-cdn.alpinelinux.org/alpine/edge/community' >> /etc/apk/repositories && \
  echo '@edge http://dl-cdn.alpinelinux.org/alpine/edge/testing' >> /etc/apk/repositories
WORKDIR /app/
COPY --from=builder /build/packages/zephyr-grade-server/zephyr-pkg .
CMD ./zephyr-pkg
