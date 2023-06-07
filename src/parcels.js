import * as fs from 'node:fs'
import crypto from 'crypto'
import webpush from 'web-push'
import db from './database.js'

const vapidDetails = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
  subject: process.env.VAPID_SUBJECT
}

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
  const recipientStatement = db.prepare('SELECT contacts_json FROM users WHERE uuid = @uuid')

  try {
    const recipient = recipientStatement.get({ uuid: request.params.recipient })

    if (!isAcceptingFromContact(recipient, request.currentUserUuid)) {
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

  const selectUserStatement = db.prepare(`
    SELECT push_subscription_json FROM users WHERE uuid = @recipient
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
    const recipient = selectUserStatement.get({ recipient: request.params.recipient })
    const subscription = recipient.push_subscription_json && JSON.parse(recipient.push_subscription_json)

    if (subscription) {
      const parcelPayload = { type: parcelType, sender: request.currentUserUuid }
      const payload = JSON.stringify({ type: 'PARCEL', payload: parcelPayload })

      const options = {
        TTL: 60 * 60 * 24 * process.env.TIME_TO_LIVE_ON_PUSH_SERVICE_IN_DAYS,
        vapidDetails
      }

      webpush.sendNotification(subscription, payload, options)
        .catch(() => { console.log('webpush.sendNotification() failed') })
    }
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
 * This may be used by the client as rough estimate of read receipts.
 */
export function statusParcelInbox (request, response) {
  const countStatement = db.prepare(`
    SELECT COUNT (*) AS count
    FROM parcels
    WHERE uploaded_by = @uploadedBy
      AND recipient_uuid = @recipientUuid
  `)

  // TODO: This is a temporary solution to get the last activity
  const lastActivitiyStatement = db.prepare(`
    SELECT updated_at
    FROM profile_backups
    WHERE user_uuid = @recipientUuid
  `)

  try {
    const count = countStatement.get({
      uploadedBy: request.currentUserUuid,
      recipientUuid: request.params.recipient
    }).count

    const lastActivityDate = lastActivitiyStatement.get({
      recipientUuid: request.params.recipient
    })

    let lastSeen = 'NEVER'

    if (lastActivityDate) {
      const daysSinceLastActivity = Date.now() - new Date(lastActivityDate) / 1000 / 60 / 60 / 24

      if (daysSinceLastActivity > 31) {
        lastSeen = 'LONG_TIME'
      } else if (daysSinceLastActivity > 7) {
        lastSeen = 'WITHIN_MONTH'
      } else if (daysSinceLastActivity > 2) {
        lastSeen = 'WITHIN_WEEK'
      } else {
        lastSeen = 'RECENTLY'
      }
    }

    response.send({ count, lastSeen })
  } catch (error) {
    console.error(error)
    response.sendStatus(400)
  }
}

export function statusParcelAccepts (request, response) {
  const selectUserStatement = db.prepare(`
    SELECT contacts_json FROM users WHERE uuid = @recipientUuid
  `)

  try {
    const recipient = selectUserStatement.get({ recipientUuid: request.params.recipient })

    if (!isAcceptingFromContact(recipient, request.currentUserUuid)) {
      response.sendStatus(403)
      return
    }

    response.sendStatus(200)
  } catch (error) {
    console.error(error)
    response.sendStatus(400)
  }
}

function isAcceptingFromContact (recipient, currentUserUuid) {
  if (!recipient?.contacts_json) {
    return false
  }

  const contactIds = JSON.parse(recipient.contacts_json)

  return contactIds.includes(currentUserUuid)
}
