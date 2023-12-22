# piqchat-inbox-server
**piqchat** ([piqchat.net](https://piqchat.net)) is a web app optimized for iOS and Android that allows you to **share self-destructing images** with your friends. The images are **end-to-end encrypted** and you have the freedom to choose which inbox server you rely on to receive images. The goal of piqchat is to be an app that is fun, social in a good way, respects its users and hides the complexity of encryption and server federation.

You can host an inbox server yourself with the code provided in this repository.

## Installation
### Docker
#### Requirements
- `docker`
- `docker-compose`

#### Setup
1. `cp example.env .env`
2. Edit `.env`
    - Change `DATABASE_PATH` to `/db/database.sqlite`
    - Change `PARCEL_ATTACHMENTS_UPLOAD_PATH` to `/uploads/parcel_attachments`
    - Add personal information to the admin section
3. Create directories where you want your database and uploads to live
4. Edit `compose.yml`
    - Change both volume paths to point to the directories created in (3)
    - (Optional) Change "HOSTPORT" to where piqchat should run
5. `docker-compose up -d`

### Manual
You'll need git and Node.js.

Checkout the repository with the latest stable version:

```
git clone https://github.com/carlreinecken/piqchat-inbox-server
git checkout $(git tag -l | grep '^v[0-9.]*$' | sort -V | tail -n 1)
```

Save the example.env as .env file and replace the values accordingly. To generate your keys run `node bin/create-keys.js` and copy the output in your .env file.

Next setup the sqlite database with `npm run migrate`.

Afterwards you can start the server with `npm run start` or `node src/main.js`.

Create your first user with `node bin/create-user-signup-token.js <uuid>`, you can get your user uuid when creating a profile in the piqchat app.
