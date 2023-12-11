import db from '../database.js'

export function updateUserClient (userUuid, headers) {
  const updateStatement = db.prepare(`
    UPDATE users SET
      client_version = @client_version,
      client_last_seen_at = @client_last_seen_at
    WHERE uuid = @uuid
  `)

  try {
    updateStatement.run({
      uuid: userUuid,
      client_version: headers['x-client-version'],
      client_last_seen_at: (new Date()).toISOString()
    })
  } catch (error) {
    console.error(error)
  }
}
