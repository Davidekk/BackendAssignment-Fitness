FROM node:20-bookworm-slim AS base

WORKDIR /app

# Install build prerequisites for native node modules like bcrypt
RUN apt-get update \
  && apt-get install -y --no-install-recommends build-essential python3 \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

COPY package.json package-lock.json ./

RUN npm ci --omit=dev

COPY tsconfig.json ./tsconfig.json
COPY src ./src

EXPOSE 8000

CMD ["npm", "run", "start"]
