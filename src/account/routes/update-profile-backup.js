import db from '../../database.js'

export function updateProfileBackup (request, response) {
  const updateStatement = db.prepare(`
    UPDATE profile_backups
    SET content = @content, updated_at = @updated_at
    WHERE user_uuid = @user_uuid
  `)

  const insertStatement = db.prepare(`
    INSERT INTO profile_backups (user_uuid, content, updated_at)
    VALUES (@user_uuid, @content, @updated_at)
  `)

  try {
    const values = {
      user_uuid: request.currentUserUuid,
      content: request.body.backup,
      updated_at: (new Date()).toISOString()
    }

    const updateResult = updateStatement.run(values)

    if (updateResult.changes === 0) {
      insertStatement.run(values)
    }

    response.sendStatus(204)
  } catch (error) {
    console.error(error)
    response.sendStatus(400)
  }
}
