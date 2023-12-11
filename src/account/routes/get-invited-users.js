import db from '../../database.js'
import { lastSeenDateToLabel } from '../../shared/get-user-last-seen.js'
import { getUserId } from '../../shared/get-user-id.js'

export function getInvitedUsers (request, response) {
  try {
    const selectStatement = db.prepare(`
      SELECT id, uuid, client_last_seen_at, created_by
      FROM users
      WHERE created_by = @userId OR id = @userId
    `)

    const selectAllStatement = db.prepare(`
      SELECT id, uuid, client_version, client_last_seen_at, created_by
      FROM users
    `)

    let rows
    const isAdmin = process.env.ADMIN_UUID != null && process.env.ADMIN_UUID === request.currentUserUuid
    const userId = getUserId(request.currentUserUuid)

    if (!userId) {
      return response.sendStatus(403)
    }

    if (isAdmin) {
      rows = selectAllStatement.all()
    } else {
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
