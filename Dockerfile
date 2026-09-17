# Step 1: Build the application
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# Step 2: Create production runner image
FROM node:22-alpine AS runner

WORKDIR /usr/src/app

COPY package*.json ./

# Only install production dependencies to keep the image slim
RUN npm ci --only=production

COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/main"]
