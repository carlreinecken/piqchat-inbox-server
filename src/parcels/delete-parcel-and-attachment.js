import * as fs from 'node:fs'
import db from '../database.js'

export function deleteParcelAndAttachment (recipientUuid, parcelUuid, attachmentFilename) {
  const deleteStatement = db.prepare(`
    DELETE FROM parcels
    WHERE recipient_uuid = @recipientUuid
      AND uuid = @uuid
  `)

  const countAttachmentsStatement = db.prepare(`
    SELECT COUNT (*) AS count
    FROM parcels
    WHERE attachment_filename = @attachmentFilename
  `)

  deleteStatement.run({
    recipientUuid, // NOTE: only the recipient of the parcel should be able to delete the parcel
    uuid: parcelUuid
  })

  const attachmentReferenceCount = countAttachmentsStatement.get({ attachmentFilename }).count

  // Only delete the file if no other parcel has a reference to it
  if (attachmentReferenceCount === 0) {
    const path = process.env.PARCEL_ATTACHMENTS_UPLOAD_PATH + attachmentFilename

    if (fs.existsSync(path)) {
      fs.unlinkSync(path)
    }
  }
}

export function deleteParcelsAndAttachmentForUser (recipientUuid) {
  const selectParcels = db.prepare(`
    SELECT uuid, attachment_filename
    FROM parcels
    WHERE recipient_uuid = @recipientUuid
  `)

  const parcels = selectParcels.all({ recipientUuid })

  for (const parcel of parcels) {
    // TODO: Is this too inefficient?
    deleteParcelAndAttachment(recipientUuid, parcel.uuid, parcel.attachment_filename)
  }
}
