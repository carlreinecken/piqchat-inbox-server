import tweetnacl from 'tweetnacl'
import tweetnaclUtil from 'tweetnacl-util'
import db from '../src/database.js'

export function createTestUserInDatabase () {
  const insertUserStatement = db.prepare(`
    INSERT INTO users (uuid, push_subscription_json, contacts_json)
    VALUES (@uuid, '{}', '[]')
  `)

  const keyPair = tweetnacl.box.keyPair()
  const userUuid = tweetnaclUtil.encodeBase64(keyPair.publicKey)

  insertUserStatement.run({ uuid: userUuid })

  return keyPair
}
