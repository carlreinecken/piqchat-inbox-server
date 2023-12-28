FROM node:lts-alpine3.18

# Copy app to container (see .dockerignore for exceptions)
COPY . /app
RUN mkdir /uploads
RUN mkdir /database

# Install & run
WORKDIR /app
RUN npm install
ENTRYPOINT ["/bin/sh", "docker-entrypoint.sh"]
