FROM node:18-alpine # use small Node image for faster downloads

# Set working directory
WORKDIR /app # set container working directory

# Add package files
COPY package*.json ./ # copy package manifests to leverage Docker cache

# Install dependencies
RUN npm ci --only=production # install only production dependencies

# Copy application code
COPY . . # copy application source

# Create non-root user
RUN addgroup -g 1001 -S nodejs # create group for app user
RUN adduser -S nodejs -u 1001 # add non-root user for security

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app # give app user ownership of files
USER nodejs # run as non-root user

# Expose port
EXPOSE 3000 # expose application port

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \ # check app health regularly
  CMD node -e "const http = require('http'); \
    const options = { host: 'localhost', port: 3000, path: '/health', timeout: 2000 }; \
    const request = http.request(options, (res) => { \
      process.exit(res.statusCode === 200 ? 0 : 1); \
    }); \
    request.on('error', () => process.exit(1)); \
    request.end();"

# Start application
CMD ["node", "index.js"] # launch application entry point
