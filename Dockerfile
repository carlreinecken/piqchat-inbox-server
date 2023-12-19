FROM node:lts-alpine3.18

# Copy app to container (see .dockerignore for exceptions)
COPY . /app

# Create directories for volumes
RUN mkdir /db
RUN mkdir /uploads

# install & run
WORKDIR /app
RUN npm install
RUN npm run migrate
CMD ["src/main.js"]
