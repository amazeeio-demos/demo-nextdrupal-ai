# Install dependencies only when needed
FROM node:18.17-alpine3.18 AS builder
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat 

# Add build dependencies for HNSWLib
ENV PYTHONUNBUFFERED=1
RUN apk add --no-cache make g++
RUN apk add --update --no-cache python3 && ln -sf python3 /usr/bin/python
RUN python3 -m ensurepip
RUN pip3 install --no-cache --upgrade pip setuptools

WORKDIR /app
COPY . .
RUN yarn install --frozen-lockfile

# If using npm with a `package-lock.json` comment out above and use below instead
# RUN npm ci

ENV NEXT_TELEMETRY_DISABLED 1

# Add `ARG` instructions below if you need `NEXT_PUBLIC_` variables
# then put the value on your fly.toml
# Example:
# ARG NEXT_PUBLIC_EXAMPLE="value here"

RUN yarn build

# If using npm comment out above and use below instead
# RUN npm run build

# Production image, copy all the files and run next
FROM node:18.17-alpine3.18 AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app ./

USER nextjs

CMD ["yarn", "start"]

# If using npm comment out above and use below instead
# CMD ["npm", "run", "start"]
