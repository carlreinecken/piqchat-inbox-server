import db from '../database.js'
import { deleteParcelsAndAttachmentForUser } from '../parcels/delete-parcel-and-attachment.js'

export function deleteUserAndEverythingAttached (userUuid) {
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

  deleteParcelsAndAttachmentForUser(userUuid)

  deleteBackupStatement.run({ userUuid })

  const result = updateUserStatement.run({ userUuid })

  return result.changes !== 0
}
