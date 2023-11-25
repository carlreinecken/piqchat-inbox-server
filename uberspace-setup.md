## server

https://manual.uberspace.de/en/lang-nodejs/#run-node-application-in-the-background

in file `/home/<user>/etc/services.d/piqchat-inbox-server.ini`:

```
[program:piqchat-inbox-server]
directory=/home/piqchat/piqchat-inbox-server
command=node main.js
autostart=true
autorestart=true
environment=NODE_ENV=production
# `startsecs` is set by Uberspace monitoring team, to prevent a broken service from looping
startsecs=30
```

then

```
supervisorctl reread
supervisorctl update
```

then setup the domain and the web backend

```
uberspace web domain add piqchat.reinecken.net

uberspace web backend set piqchat.reinecken.net --http --port 1025
```

```
mkdir piqchat-inbox-server
git clone repositories/piqchat-inbox-server piqchat-inbox-server

sqlite3 database.sqlite < migrations/all.sql
```

don't forget the .env file 

```
PORT=1025 # same port as in the backend specified

...

# for keys use the bin/create-keys.js script

...
```

for deploying you can use this bash script

```
cd piqchat-inbox-server
git pull ../repositories/piqchat-inbox-server
npm install --no-save
echo "run migrations!"
supervisorctl restart piqchat-inbox-server
```

- `tail -f ~/logs/supervisord.log`
- `supervisorctl tail -f piqchat-inbox-server`

## web app

```
mkdir tmp/web-app-build
git clone repositories/piqchat-web-app tmp/web-app-build
```

deploy-web-app.sh

```
cd tmp/web-app-build
git pull ../../repositories/piqchat-web-app
npm install --no-save
npm run build
cd ../..
cp -r tmp/web-app-build/public/. html/
```
