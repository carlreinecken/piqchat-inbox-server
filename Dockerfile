FROM node:lts-alpine3.18

# Copy app to container (see .dockerignore for exceptions)
COPY . /app

# Install & run
WORKDIR /app
RUN npm install
RUN npm run migrate
CMD ["src/main.js"]
