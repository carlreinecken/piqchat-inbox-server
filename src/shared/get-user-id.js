import db from '../database.js'

export function getUserId (currentUserUuid) {
  const getUserStatement = db.prepare('SELECT id FROM users WHERE uuid = @uuid')

  return getUserStatement.get({ uuid: currentUserUuid })?.id
}
