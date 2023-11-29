import db from '../../database.js'
import { lastSeenDateToLabel } from '../get-last-seen.js'

export function getInvitedUsers (request, response) {
  const selectStatement = db.prepare(`
    SELECT id, uuid, client_last_seen_at, created_by
    FROM users
    WHERE created_by = @userId OR id = @userId
  `)

  const selectAllStatement = db.prepare(`
    SELECT id, uuid, client_version, client_last_seen_at, created_by
    FROM users
  `)

  const getUserStatement = db.prepare('SELECT id FROM users WHERE uuid = @uuid')

  try {
    let rows
    const isAdmin = process.env.ADMIN_UUID != null && process.env.ADMIN_UUID === request.currentUserUuid

    if (isAdmin) {
      rows = selectAllStatement.all()
    } else {
      const userId = getUserStatement.get({ uuid: request.currentUserUuid })?.id

      rows = selectStatement.all({ userId })
    }

    const parcels = rows.map((row) => ({
      id: row.uuid,
      entryId: row.id,
      clientVersion: isAdmin ? row.client_version : undefined,
      clientLastSeen: lastSeenDateToLabel(row.client_last_seen_at),
      createdBy: row.created_by
    }))

    response.send(parcels)
  } catch (error) {
    console.error(error)
    response.sendStatus(400)
  }
}
