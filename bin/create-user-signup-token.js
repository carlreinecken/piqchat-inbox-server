import Database from 'better-sqlite3'
import * as dotenv from 'dotenv'

dotenv.config()
const db = new Database(process.env.DATABASE_PATH)

const insertUserStatement = db.prepare(`
  INSERT INTO users (uuid, push_subscription_json, contacts_json, created_at)
  VALUES (@uuid, '{}', '[]', @created_at)
`)

if (!process.argv[2]) {
  console.log('Please pass as first argument the uuid of the user to create.')
  process.exit()
}

const userUuid = process.argv[2]

insertUserStatement.run({
  uuid: userUuid,
  created_at: (new Date()).toISOString()
})

console.log('Paste the following text into the "accept/scan friend invite" box:')
console.log('INPUT_SERVER_INBOX:<host>')
