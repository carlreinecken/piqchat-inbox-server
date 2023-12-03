import * as fs from 'node:fs'
import db from '../database.js'
import { CLEANUP_PARCELS_AFTER_DAYS } from '../constants.js'

export function cleanupParcels () {
  const deleteStatement = db.prepare(`
    DELETE FROM parcels
    WHERE uploaded_at < date(@dateNow, @dateModifier)
  `)
  const selectAttachmentFilenamesStatement = db.prepare(`
    SELECT attachment_filename
    FROM parcels
    WHERE uploaded_at < date(@dateNow, @dateModifier)
      AND attachment_filename IS NOT NULL
  `)

  const params = {
    dateNow: (new Date()).toISOString(),
    dateModifier: `-${CLEANUP_PARCELS_AFTER_DAYS} days`
  }

  const attachmentFilenameRows = selectAttachmentFilenamesStatement.all(params)

  const result = deleteStatement.run(params)

  for (const row of attachmentFilenameRows) {
    const path = process.env.PARCEL_ATTACHMENTS_UPLOAD_PATH + row.attachment_filename

    if (fs.existsSync(path)) {
      fs.unlinkSync(path)
    }
  }

  if (result.changes > 0) {
    console.log(`Cleanup deleted ${result.changes} parcel(s)`)
  }
}
