# piqchat-inbox-server

**piqchat** ([piqchat.net](https://piqchat.net)) is a web app optimized for iOS Safari and Chrome on Android that allows you to **share self-destructing images** with your friends. The images are **end-to-end encrypted** and you have the **freedom to choose which inbox server** you rely on to receive images. The goal of piqchat is to be an app that is fun, social in a good way, respects its users and hides the complexity of encryption and server federation.

A piqchat user needs to sign up to an inbox server to be able to receive images. You can host an inbox server yourself with the code provided in this repository.

## Deployment

### Docker

TODO

### Manual

You'll need git and Node.js.

Get the [latest release of this repository](https://github.com/carlreinecken/piqchat-inbox-server/releases/latest) and unpack it.

Run `npm install` inside the project repository.

Copy the example.env file and save it as .env file and replace the values accordingly. Values with an empty string are required.

Next setup the sqlite database with `npm run migrate`.

Afterwards you can start the server with `npm run start` or `node src/main.js`.

The server will print an "invite link" that you can use in the piqchat web app to create your first user on your new server. The app will ask you to enter the domain of your inbox server. Note that this user won't have any special rights.

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
