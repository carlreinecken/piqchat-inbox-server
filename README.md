# piqchat-inbox-server

**piqchat** ([piqchat.net](https://piqchat.net)) is a web app optimized for iOS and Android that allows you to **share self-destructing images** with your friends. The images are **end-to-end encrypted** and you have the freedom to choose which server you rely on to receive images. The goal of piqchat is to be an app that is fun, social in a good way, respects its users and hides the complexity of encryption and server federation.

You can host an inbox server yourself with the code provided in this repository.

## Installation

### Docker

TODO

### Manual

You'll need git and Node.js.

```
$ git clone https://github.com/carlreinecken/piqchat-inbox-server
```

Save the example.env as .env file and replace the values accordingly. To generate your keys run `node bin/create-keys.js` and copy the output in your .env file.

Next setup the sqlite database with `npm run migrate`.

Afterwards you can start the server with `npm run start` or `node src/main.js`.

Create your first user with `node bin/create-user-signup-token.js <uuid>`, you can get your user uuid when creating a profile in the piqchat app.
