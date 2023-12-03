import Database from 'better-sqlite3'
import * as dotenv from 'dotenv'

dotenv.config()

if (!process.argv[2]) {
  console.log('Please pass as first argument the uuid of the user to create.')
  process.exit()
}

const db = new Database(process.env.DATABASE_PATH)

const insertUserStatement = db.prepare(`
  INSERT INTO users (uuid, push_subscription_json, contacts_json, created_at)
  VALUES (@uuid, '{}', '[]', @created_at)
`)

const userUuid = process.argv[2]

insertUserStatement.run({
  uuid: userUuid,
  created_at: (new Date()).toISOString()
})

console.log('Paste the following text when asked for the friend invite:')
console.log('INPUT_INBOX_SERVER_HOST:<host>')
