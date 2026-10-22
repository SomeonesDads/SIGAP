FROM node:20-alpine

WORKDIR /app

# Install dependencies needed by node-gyp if any native bindings are needed
RUN apk add --no-cache libc6-compat

# Copy dependency manifests
COPY package.json package-lock.json* ./

# Install npm dependencies
RUN npm install

# Copy application code and build production Next.js bundle
COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"
EXPOSE 8080

CMD ["sh", "-c", "npx next start -H 0.0.0.0 -p ${PORT:-8080}"]
