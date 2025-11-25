# Use official Node image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the project
COPY . .

# Build Next.js app
RUN npm run build

# Expose port
EXPOSE 3000

# Run production server
CMD ["npm", "start"]
