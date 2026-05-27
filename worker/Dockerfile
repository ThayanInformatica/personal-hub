FROM node:20-alpine

RUN apk add --no-cache openssl libc6-compat

WORKDIR /worker

COPY package.json ./
RUN npm install --omit=optional

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src

CMD ["sh", "-c", "npx tsx src/index.ts"]
