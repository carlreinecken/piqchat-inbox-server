import tweetnacl from 'tweetnacl'
import tweetnaclUtil from 'tweetnacl-util'
import db from '../src/database.js'

export function createTestUserInDatabase (contacts = []) {
  const insertUserStatement = db.prepare(`
    INSERT INTO users (uuid, push_subscription_json, contacts_json)
    VALUES (@uuid, '{}', @contactsJson)
  `)

  const keyPair = tweetnacl.box.keyPair()
  const userUuid = tweetnaclUtil.encodeBase64(keyPair.publicKey)

  insertUserStatement.run({ uuid: userUuid, contactsJson: JSON.stringify(contacts) })

  return keyPair
}
