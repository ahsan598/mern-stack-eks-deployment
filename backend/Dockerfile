# Use minimal Node image as a base image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the package.json
COPY package*.json ./

# Install the application's dependencies inside the container
RUN yarn install --production

# Copy the rest of the application code to the container
COPY . .

# Run as non-root user (node user exists in alpine)
USER node

# Expose Port to the container
EXPOSE 8080

# Specify the command to run when the container starts
CMD [ "node", "index.js" ]
