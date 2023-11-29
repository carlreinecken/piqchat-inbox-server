import * as fs from 'node:fs'
import db from '../../database.js'

export function downloadParcel (request, response) {
  const select = db.prepare(`
    SELECT attachment_filename
    FROM parcels
    WHERE recipient_uuid = @recipientUuid
      AND uuid = @uuid
    ORDER BY uploaded_at ASC
  `)

  try {
    const parameters = {
      recipientUuid: request.currentUserUuid,
      uuid: request.params.uuid
    }

    const parcel = select.get(parameters)

    if (!parcel) {
      response.sendStatus(404)
      return
    }

    const file = fs.readFileSync(process.env.PARCEL_ATTACHMENTS_UPLOAD_PATH + parcel.attachment_filename)

    response.send(file)
  } catch (error) {
    console.error(error)
    response.sendStatus(400)
  }
}
