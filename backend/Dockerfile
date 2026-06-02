FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package info and install dependencies
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Expose backend port
EXPOSE 3000

# Start server
CMD ["npm", "start"]
