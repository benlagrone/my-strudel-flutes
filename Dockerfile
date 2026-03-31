FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json build.mjs docs-rag.mjs main.js index.html server.mjs ./
COPY songs ./songs

RUN npm ci
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=build /app/index.html ./
COPY --from=build /app/app.js ./
COPY --from=build /app/docs-rag.mjs ./
COPY --from=build /app/server.mjs ./
COPY --from=build /app/songs ./songs

ENV HOST=0.0.0.0
ENV PORT=8008

EXPOSE 8008

CMD ["node", "server.mjs"]
