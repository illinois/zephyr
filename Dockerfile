FROM node:10 AS builder
WORKDIR /build/
COPY . .
RUN npm install --unsafe-perm
RUN npm run build && cd packages/zephyr-grade-server && npx pkg -t node10-alpine -o zephyr-pkg ./lib/index.js

FROM alpine:latest
ENV IN_DOCKER=true
WORKDIR /app/
COPY --from=builder /build/packages/zephyr-grade-server/zephyr-pkg .
CMD ./zephyr-pkg
