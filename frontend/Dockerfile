# ======================================================
# Stage 1: Build Stage
# ------------------------------------------------------
# Uses Node.js to install dependencies and build the
# React application into static files.
# ======================================================
FROM node:20-alpine AS build

# Set working directory inside the container
WORKDIR /app

# Copy dependency definition files first this improves Docker layer caching
COPY package*.json ./

# Install project dependencies
RUN yarn install

# Copy the rest of the application source code
COPY . .

# Build the React application, the output is generated in the /app/build directory
RUN npm run build


# ======================================================
# Stage 2: Serve Stage (Nginx)
# ------------------------------------------------------
# Uses Nginx to serve the built static files efficiently
# and act as a reverse proxy for backend API requests.
# ======================================================
FROM nginx:1.28-alpine

# Copy the build artifacts from the build stage to Nginx's default web directory
COPY --from=build /app/build /usr/share/nginx/html

# Replace the default Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Start Nginx in foreground mode, Required for Docker containers to keep running
CMD ["nginx", "-g", "daemon off;"]
