FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm ci

# Install NestJS CLI globally
RUN npm install -g @nestjs/cli

# Copy source code
COPY . .

EXPOSE 3000

# Health check for development
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start in development mode
CMD ["npm", "run", "start:dev"]