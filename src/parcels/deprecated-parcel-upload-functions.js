import crypto from 'crypto'

import db from '../database.js'
import { sendPushNotification } from '../account/send-push-notification.js'
import { isAcceptingFromContact } from '../account/is-accepting-from-contact.js'
import { countReceivedParcels } from './count-received-parcels.js'

const PARCEL_TYPES = {
  IMAGE: 'IMAGE',
  MEDIA: 'MEDIA'
}

/**
 * @deprecated
 */
export function uploadParcelGroupAuthorization (request, response, next) {
  try {
    const allRecipientIds = request.params.recipients.split(',')

    const authorizedRecipientIds = []
    const forbiddenRecipientIds = []

    for (const recipientId of allRecipientIds) {
      if (isAcceptingFromContact(recipientId, request.currentUserUuid)) {
        authorizedRecipientIds.push(recipientId)
      } else {
        forbiddenRecipientIds.push(recipientId)
      }
    }

    if (authorizedRecipientIds.length === 0) {
      // If no one of the recipients exist or won't accept a parcel from the current user,
      // it should abort here and also prevent the attachment upload
      response.sendStatus(403)
      return
    }

    request.authorizedRecipientUserIds = authorizedRecipientIds
    request.forbiddenRecipientUserIds = forbiddenRecipientIds

    next()
  } catch (error) {
    console.error(error)
    response.sendStatus(400)
  }
}

/**
 * @deprecated
 */
export function uploadParcelGroup (request, response) {
  const parcelType = request.body.type
  const contents = JSON.parse(request.body.contents)

  try {
    insertParcel(request.authorizedRecipientUserIds, parcelType, contents, request.file?.filename, request.currentUserUuid)
  } catch (error) {
    console.error(error)
    response.sendStatus(400)
    return
  }

  response.send({
    forbiddenRecipientIds: request.forbiddenRecipientUserIds
  })

  /**
   * After this point nothing is send to the client anymore.
   * Because the sender couldn't care less if the notification fails...
   */
  try {
    if (parcelType === PARCEL_TYPES.MEDIA) {
      const parcelPayload = { type: parcelType, sender: request.currentUserUuid }
      const payload = JSON.stringify({ type: 'PARCEL', payload: parcelPayload })

      for (const recipientUserId of request.authorizedRecipientUserIds) {
        sendPushNotification(recipientUserId, payload)
      }
    }

    countReceivedParcels(request.authorizedRecipientUserIds.length, parcelType)
  } catch (error) {
    console.error(error)
  }
}

function insertParcel (recipientUserIds, parcelType, content, filename, currentUserUuid) {
  const insert = db.prepare(`
    INSERT INTO parcels (uuid, recipient_uuid, type, content, attachment_filename, uploaded_by, uploaded_at)
    VALUES (@uuid, @recipient_uuid, @type, @content, @attachment_filename, @uploaded_by, @uploaded_at)
  `)

  for (const recipientUserId of recipientUserIds) {
    let contentString = content

    if (typeof content === 'object' && content[recipientUserId] != null) {
      contentString = content[recipientUserId]
    }

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

/**
 * @deprecated
 */
export function uploadParcelAuthorizationForOne (request, response, next) {
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

/**
 * @deprecated
 */
export function uploadParcelForOne (request, response) {
  const parcelType = request.body.type ?? PARCEL_TYPES.IMAGE

  try {
    insertParcel([request.params.recipient], parcelType, request.body.content, request.file?.filename, request.currentUserUuid)
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
    if (parcelType === PARCEL_TYPES.IMAGE) {
      const parcelPayload = { type: parcelType, sender: request.currentUserUuid }
      const payload = JSON.stringify({ type: 'PARCEL', payload: parcelPayload })

      sendPushNotification(request.params.recipient, payload)
    }

    countReceivedParcels(1, parcelType)
  } catch (error) {
    console.error(error)
  }
}
