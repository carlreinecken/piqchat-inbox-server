# piqchat-inbox-server

**piqchat** ([piqchat.net](https://piqchat.net)) is a web app optimized for iOS Safari and Chrome on Android that allows you to **share self-destructing images** with your friends. The images are **end-to-end encrypted** and you have the **freedom to choose which inbox server** you rely on to receive images. The goal of piqchat is to be an app that is fun, social in a good way, respects its users and hides the complexity of encryption and server federation.

A piqchat user needs to sign up to an inbox server to be able to receive images. You can host an inbox server yourself with the code provided in this repository.

## Deployment

TLS is a requirement.

### Docker

You'll need `docker` and `docker-compose`.

1. Set up your compose.yml, take the [compose.yml](compose.yml) in this repository as template.
2. Take the [example.env](example.env) as template for your .env file and fill in the empty variables.
3. `docker-compose up`

A sqlite database is created.

### Manual

You'll need `node`.

1. Get the [latest release of this repository](https://github.com/carlreinecken/piqchat-inbox-server/releases/latest) and unpack it.
2. Run `npm install` inside the project repository.
3. Copy the [example.env](example.env) file and save it as .env file and fill in the empty variables.
4. Next setup the sqlite database with `npm run migrate`.

Afterwards you can start the server with `npm run start` or `node src/main.js`.

## Create a user

TL;DR After deployment use the invite link printed out in the server logs in the piqchat web app.

Usually users are created when they accept a friend invite and have not signed up anywhere else.

After the first server startup an "invite link" is printed out in the server logs that you can use in the piqchat web app to create your first user. The app will ask you to enter the domain of your inbox server. Note that this is a standard user and it doesn't have any special rights.

The invite link expires after the duration you specified in the .env file. After restarting it should print out a new invite link if the previous one expired. When deployed with docker, you can force to generate a new invite link on startup with the environment variable `CREATE_SIGN_UP_INVITE=true`. Without a container you can run `node bin/create-signup-contact-exchange.js`.

## What does the server do?

Inbox servers for piqchat are supposed to be lightweight. The server uses a sqlite3 database, and everything is deleted as soon as it's not needed anymore.

A piqchat user needs to sign up to an inbox server to be able to receive images. From a technical perspective, the user doesn't need to be registered on an inbox server if they only want to send images, because images are directly uploaded to the inbox server of the recipient.

User register through a simple invite system. The app doesn't ask for emails, phone numbers or passwords. Authentication is done with the `tweetnacl` asymmetric encryption key pair from the user (which only proves that the user has *an* identity), authorization is done on per route basis.

The piqchat inbox server is responsible for a few very important aspects of the piqchat experience:

- **Contact Exchanges**, called "friend invite" in the app. Used to exchange encrypted contact information between piqchat users, also works when users are on different inbox servers. It registers users and creates them an account that "want to". The piqchat app only asks the user to signup who don't have somewhere else an account. Only registered users can create a contact exchange.
- **Parcels.** Used to exchange any encrypted stuff between users, which have added each other as contact. Used for images, contact suggestions or profile updates.
- **User Accounts.** Only registered users can receive parcels on your inbox server. The primary purpose of an account is to have a contact whitelist, so only the contacts of registered users can upload parcels.
- **Profile Backups.** Registered users upload regularly an encrypted backup of their entire contact list, which they can recover with their key pair, e.g. if they lose their phone.
- **Push Notifications.** Registered users can opt in to receive push notifications. If a user receives a parcel and they opted-in to get notified, the server calls a webhook at the respective push service (depending on the user's browser: Apple, Mozilla, Google, etc.).
