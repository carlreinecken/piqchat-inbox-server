# Uberspace Setup Guide

## Server

https://manual.uberspace.de/en/lang-nodejs/#run-node-application-in-the-background

Create the file `/home/<user>/etc/services.d/piqchat-inbox-server.ini`:

```
[program:piqchat-inbox-server]
directory=/home/piqchat/piqchat-inbox-server
command=node main.js
autostart=true
autorestart=true
environment=NODE_ENV=production
# `startsecs` prevents a broken service from looping
startsecs=30
```

Note that if you specify `command=npm run start` the program needs to include `stopasgroup=true` because the node server starts as child process and can't shutdown properly otherwise.

Then:

```
$ supervisorctl reread
$ supervisorctl update
```

Next setup the domain and the web backend:

```
$ uberspace web domain add <domain>
$ uberspace web backend set <domain> --http --port 1025
```

```
$ git clone repositories/piqchat-inbox-server piqchat-inbox-server
```

Save the example.env as .env file and replace the values accordingly:

```
PORT=1025 # same port as in the backend specified

...

# To generate your keys run `node bin/create-keys.js` and copy the output in here

...
```

Next create the database with:

```bash
$ npm run migrate
```

To deploy and update you can use following bash script:

```
cd piqchat-inbox-server
git pull ../repositories/piqchat-inbox-server
npm install --no-save
supervisorctl stop piqchat-inbox-server
npm run migrate
supervisorctl start piqchat-inbox-server
```

- `tail -f ~/logs/supervisord.log`
- `supervisorctl tail -f piqchat-inbox-server`

## Web app

```
$ mkdir tmp/web-app-build
$ git clone repositories/piqchat-web-app tmp/web-app-build
```

deploy-web-app.sh:

```
cd tmp/web-app-build
git pull ../../repositories/piqchat-web-app
npm install --no-save
npm run build
cd ../..
cp -r tmp/web-app-build/public/. html/
```
