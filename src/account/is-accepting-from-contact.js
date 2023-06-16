import db from '../database.js'

export function isAcceptingFromContact (userUuid, contactUuid) {
  const selectUserStatement = db.prepare(`
    SELECT contacts_json FROM users WHERE uuid = @userUuid
  `)

  const user = selectUserStatement.get({ userUuid })

  if (!(user?.contacts_json)) {
    return false
  }

  const contactIds = JSON.parse(user.contacts_json)

  return contactIds.includes(contactUuid)
}
