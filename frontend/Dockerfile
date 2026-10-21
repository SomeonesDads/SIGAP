FROM node:20-alpine

WORKDIR /app

# Install dependencies needed by node-gyp if any native bindings are needed
RUN apk add --no-cache libc6-compat

# Copy dependency manifests
COPY package.json package-lock.json* ./

# Install npm dependencies
RUN npm install

# Copy application code
COPY . .

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
EXPOSE 3000

CMD ["npm", "run", "dev"]
