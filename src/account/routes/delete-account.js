import db from '../../database.js'
import { deleteParcelsAndAttachmentForUser } from '../../parcels/delete-parcel-and-attachment.js'

export function deleteAccount (request, response) {
  const deleteBackupStatement = db.prepare(`
    DELETE FROM profile_backups
    WHERE user_uuid = @userUuid
  `)

  const updateUserStatement = db.prepare(`
    UPDATE users SET
      uuid = null,
      push_subscription_json = '{}',
      contacts_json = '[]',
      client_version = null,
      client_last_seen_at = null,
      created_at = null
    WHERE uuid = @userUuid
  `)

  try {
    deleteParcelsAndAttachmentForUser(request.currentUserUuid)

    deleteBackupStatement.run({ userUuid: request.currentUserUuid })

    const result = updateUserStatement.run({ userUuid: request.currentUserUuid })

    if (result.changes === 0) {
      return response.sendStatus(404)
    }

    // TODO: remove conctact_exchanges? or is the automatic cleanup enough?

    response.sendStatus(204)
  } catch (error) {
    console.error(error)
    response.sendStatus(400)
  }
}
