import db from '../database.js'
import { PARCEL_TYPES } from '../constants.js'

export function getInfo (_, response) {
  try {
    response.send({
      publicKey: process.env.API_PUBLIC_KEY,
      vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
      adminDisplayName: process.env.ADMIN_DISPLAY_NAME,
      adminMessage: process.env.ADMIN_MESSAGE,
      privacyPolicyUrl: process.env.ADMIN_PRIVACY_POLICY_URL,
      statistics: calculateStatistics()
    })
  } catch (error) {
    console.error(error)
    response.sendStatus(400)
  }
}

function calculateStatistics () {
  const usersTotalStatement = db.prepare('SELECT COUNT(*) as count FROM users WHERE uuid IS NOT NULL')
  const usersActiveLastDaysStatement = db.prepare(`
    SELECT COUNT(*) as count
    FROM users
    WHERE client_last_seen_at > date('now', @dateModifier)`
  )
  const mediaParcelsWaitingStatement = db.prepare(`
    SELECT COUNT(*) as count
    FROM parcels WHERE type = '${PARCEL_TYPES.MEDIA}'
  `)
  const mediaParcelsReceivedLast7DaysStatement = db.prepare(`
    SELECT COUNT(*) as count
    FROM parcels_count
    WHERE date > date('now', '-7 days')
  `)

  return {
    userTotal: usersTotalStatement.get().count,
    userActiveLast7Days: usersActiveLastDaysStatement.get({ dateModifier: '-7 days' }).count,
    userActiveLast30Days: usersActiveLastDaysStatement.get({ dateModifier: '-30 days' }).count,
    mediaParcelsWaiting: mediaParcelsWaitingStatement.get().count,
    mediaParcelsReceivedLast7Days: mediaParcelsReceivedLast7DaysStatement.get().count
  }
}
