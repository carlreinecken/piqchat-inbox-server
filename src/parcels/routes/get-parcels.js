import db from '../../database.js'
import { updateClient } from '../../account/update-client.js'

export function getParcels (request, response) {
  const select = db.prepare(`
    SELECT uuid, type, content, uploaded_by, uploaded_at
    FROM parcels
    WHERE recipient_uuid = @recipientUuid
    ORDER BY uploaded_at ASC
  `)

  try {
    const rows = select.all({ recipientUuid: request.currentUserUuid })

    const parcels = rows.map((row) => ({
      id: row.uuid,
      type: row.type,
      content: row.content,
      uploadedBy: row.uploaded_by,
      uploadedAt: row.uploaded_at
    }))

    response.send(parcels)
  } catch (error) {
    console.error(error)
    response.sendStatus(400)
  }

  /**
   * After this point nothing is send to the client anymore.
   */

  try {
    updateClient(request.currentUserUuid, request.headers)
  } catch (error) {
    console.error(error)
  }
}
