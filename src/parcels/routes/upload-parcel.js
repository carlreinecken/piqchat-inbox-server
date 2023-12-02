import crypto from 'crypto'
import * as fs from 'node:fs'

import db from '../../database.js'
import { sendPushNotification } from '../../account/send-push-notification.js'
import { isAcceptingFromContact } from '../../account/is-accepting-from-contact.js'
import { PARCEL_TYPES } from '../../constants.js'

export function uploadParcel (request, response) {
  const contentAuthorizedRecipientsMap = new Map()
  const forbiddenRecipientIds = []
  const parcelType = request.body.type

  try {
    const recipientFields = Array.isArray(request.body.recipient) ? request.body.recipient : [request.body.recipient]

    for (const recipientField of recipientFields) {
      const recipientId = recipientField.split(' ', 1)[0]
      const contentString = recipientField.substring(recipientField.indexOf(' ') + 1)

      if (isAcceptingFromContact(recipientId, request.currentUserUuid)) {
        contentAuthorizedRecipientsMap.set(recipientId, contentString)
      } else {
        forbiddenRecipientIds.push(recipientId)
      }
    }

    if (contentAuthorizedRecipientsMap.size === 0) {
      // If no one of the recipients exist or won't accept a parcel from the current user it should abort
      response.sendStatus(403)

      if (fs.existsSync(request.file.path)) {
        fs.unlinkSync(request.file.path)
      }

      return
    }

    insertParcels(contentAuthorizedRecipientsMap, parcelType, request.file?.filename, request.currentUserUuid)

    response.send({ forbiddenRecipientIds })
  } catch (error) {
    console.error(error)
    response.sendStatus(400)
  }

  /**
   * -----
   * After this point nothing is send to the client anymore.
   * Because the sender couldn't care less if the notification fails...
   */
  try {
    if (parcelType === PARCEL_TYPES.MEDIA) {
      const parcelPayload = { type: parcelType, sender: request.currentUserUuid }
      const payload = JSON.stringify({ type: 'PARCEL', payload: parcelPayload })

      for (const [recipientUserId] of contentAuthorizedRecipientsMap) {
        sendPushNotification(recipientUserId, payload)
      }
    }
  } catch (error) {
    console.error(error)
  }
}

function insertParcels (contentRecipientsMap, parcelType, filename, currentUserUuid) {
  const insert = db.prepare(`
    INSERT INTO parcels (uuid, recipient_uuid, type, content, attachment_filename, uploaded_by, uploaded_at)
    VALUES (@uuid, @recipient_uuid, @type, @content, @attachment_filename, @uploaded_by, @uploaded_at)
  `)

  for (const [recipientUserId, contentString] of contentRecipientsMap) {
    insert.run({
      uuid: crypto.randomUUID(),
      recipient_uuid: recipientUserId,
      type: parcelType,
      content: contentString,
      attachment_filename: filename,
      uploaded_by: currentUserUuid,
      uploaded_at: (new Date()).toISOString()
    })
  }
}
