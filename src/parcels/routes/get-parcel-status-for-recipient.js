import db from '../../database.js'
import { getLastSeen } from '../../account/get-last-seen.js'
import { PARCEL_TYPES } from '../../constants.js'

/**
 * This request can be used by anyone, to check how many undeleted
 * parcels are waiting for the recipient on the inbox server from the user that is requesting.
 *
 * The count may be used by the client as rough estimate of read receipts.
 */
export function getParcelStatusForRecipient (request, response) {
  try {
    const countStatement = db.prepare(`
      SELECT COUNT (*) AS count
      FROM parcels
      WHERE uploaded_by = @uploadedBy
        AND recipient_uuid = @recipientUuid
        AND type = '${PARCEL_TYPES.MEDIA}'
    `)

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
