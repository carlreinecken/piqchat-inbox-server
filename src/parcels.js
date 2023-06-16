import * as fs from 'node:fs'
import crypto from 'crypto'
import db from './database.js'
import { sendPushNotification } from './account/send-push-notification.js'
import { updateClient } from './account/update-client.js'
import { getLastSeen } from './account/get-last-seen.js'
import { isAcceptingFromContact } from './account/is-accepting-from-contact.js'

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

export function uploadParcelAuthorization (request, response, next) {
  try {
    if (!isAcceptingFromContact(request.params.recipient, request.currentUserUuid)) {
      response.sendStatus(403)
      return
    }

    next()
  } catch (error) {
    console.error(error)
    response.sendStatus(400)
  }
}

export function uploadParcel (request, response) {
  const insert = db.prepare(`
    INSERT INTO parcels (uuid, recipient_uuid, type, content, attachment_filename, uploaded_by, uploaded_at)
    VALUES (@uuid, @recipient, @type, @content, @attachment_filename, @uploaded_by, @uploaded_at)
  `)

  const parcelType = 'IMAGE'

  try {
    insert.run({
      uuid: crypto.randomUUID(),
      recipient: request.params.recipient,
      type: parcelType,
      content: request.body.content,
      attachment_filename: request.file.filename,
      uploaded_by: request.currentUserUuid,
      uploaded_at: (new Date()).toISOString()
    })
  } catch (error) {
    console.error(error)
    response.sendStatus(400)
    return
  }

  response.sendStatus(201)

  /**
   * After this point nothing is send to the client anymore.
   * Because the sender couldn't care less if the notification fails...
   */
  try {
    const parcelPayload = { type: parcelType, sender: request.currentUserUuid }
    const payload = JSON.stringify({ type: 'PARCEL', payload: parcelPayload })

    sendPushNotification(request.params.recipient, payload)
  } catch (error) {
    console.error(error)
  }
}

export function deleteParcel (request, response) {
  const deleteStatement = db.prepare(`
    DELETE FROM parcels
    WHERE recipient_uuid = @recipientUuid
      AND uuid = @uuid
  `)

  const select = db.prepare(`
    SELECT attachment_filename
    FROM parcels
    WHERE recipient_uuid = @recipientUuid
      AND uuid = @uuid
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

    deleteStatement.run(parameters)

    const path = process.env.PARCEL_ATTACHMENTS_UPLOAD_PATH + parcel.attachment_filename

    if (fs.existsSync(path)) {
      fs.unlinkSync(path)
    }

    response.sendStatus(204)
  } catch (error) {
    console.error(error)
    response.sendStatus(400)
  }
}

/**
 * This request can be used by anyone, to check how many undeleted
 * parcels are waiting for the recipient on the inbox server _from them_.
 *
 * The count may be used by the client as rough estimate of read receipts.
 */
export function statusParcelInbox (request, response) {
  const countStatement = db.prepare(`
    SELECT COUNT (*) AS count
    FROM parcels
    WHERE uploaded_by = @uploadedBy
      AND recipient_uuid = @recipientUuid
  `)

  try {
    const count = countStatement.get({
      uploadedBy: request.currentUserUuid,
      recipientUuid: request.params.recipient
    }).count

    const lastSeen = getLastSeen(request.params.recipient)

    response.send({ count, lastSeen })
  } catch (error) {
    console.error(error)
    response.sendStatus(400)
  }
}
