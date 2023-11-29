import db from '../../database.js'
import { deleteParcelAndAttachment } from '../delete-parcel-and-attachment.js'

export function deleteParcel (request, response) {
  const selectStatement = db.prepare(`
    SELECT attachment_filename
    FROM parcels
    WHERE recipient_uuid = @recipientUuid
      AND uuid = @uuid
  `)

  try {
    const parcel = selectStatement.get({
      recipientUuid: request.currentUserUuid,
      uuid: request.params.uuid
    })

    if (!parcel) {
      response.sendStatus(404)
      return
    }

    deleteParcelAndAttachment(request.currentUserUuid, request.params.uuid, parcel.attachment_filename)

    response.sendStatus(204)
  } catch (error) {
    console.error(error)
    response.sendStatus(400)
  }
}
