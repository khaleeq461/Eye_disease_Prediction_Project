FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy backend source code
COPY . .

# Ensure uploads directory structure exists
RUN mkdir -p uploads/heatmaps uploads/reports

EXPOSE 5000

ENV PORT=5000 \
    NODE_ENV=production

CMD ["node", "server.js"]
