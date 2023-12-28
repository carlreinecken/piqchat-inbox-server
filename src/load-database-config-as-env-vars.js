import * as dotenv from 'dotenv'
import webpush from 'web-push'
import tweetnacl from 'tweetnacl'
import tweetnaclUtil from 'tweetnacl-util'
import db from './database.js'

export function loadDatabaseConfigAsEnvVars () {
  const insertConfig = db.prepare('INSERT INTO config (name, value) VALUES (@name, @value)')

  const configValues = db.prepare('SELECT * FROM config')
    .all()
    .reduce((map, config) => {
      map[config.name] = config.value
      return map
    }, {})

  if (configValues.API_PRIVATE_KEY) {
    const keyPair = tweetnacl.box.keyPair.fromSecretKey(tweetnaclUtil.decodeBase64(configValues.API_PRIVATE_KEY))

    configValues.API_PUBLIC_KEY = tweetnaclUtil.encodeBase64(keyPair.publicKey)
  } else {
    console.log('Generate api keys and persist to database...')

    const keyPair = tweetnacl.box.keyPair()
    const secretKey = tweetnaclUtil.encodeBase64(keyPair.secretKey)

    insertConfig.run({ name: 'API_PRIVATE_KEY', value: secretKey })

    configValues.API_PRIVATE_KEY = secretKey
    configValues.API_PUBLIC_KEY = tweetnaclUtil.encodeBase64(keyPair.publicKey)
  }

  if (!configValues.VAPID_PUBLIC_KEY || !configValues.VAPID_PRIVATE_KEY) {
    console.log('Generate VAPID keys and persist to database...')
    const vapidKeys = webpush.generateVAPIDKeys()

    insertConfig.run({ name: 'VAPID_PUBLIC_KEY', value: vapidKeys.publicKey })
    insertConfig.run({ name: 'VAPID_PRIVATE_KEY', value: vapidKeys.privateKey })

    configValues.VAPID_PUBLIC_KEY = vapidKeys.publicKey
    configValues.VAPID_PRIVATE_KEY = vapidKeys.privateKey
  }

  dotenv.populate(process.env, configValues)
}
