import db from '../../database.js'

export function getProfileBackup (request, response) {
  try {
    const selectStatement = db.prepare(`
      SELECT content, updated_at, last_read_at
      FROM profile_backups
      WHERE user_uuid = @user_uuid
    `)

    const backup = selectStatement.get({ user_uuid: request.currentUserUuid })

    if (!backup) {
      response.sendStatus(404)
      return
    }

    response.send({
      updatedAt: backup.updated_at,
      lastReadAt: backup.last_read_at,
      backup: backup.content
    })
  } catch (error) {
    console.error(error)
    response.sendStatus(400)
  }
}
