import db from '../../database.js'
import { parsePushSubscription } from '../send-push-notification.js'

export function getAccount (request, response) {
  const selectStatement = db.prepare(`
    SELECT push_subscription_json
    FROM users
    WHERE uuid = @uuid
  `)

  try {
    const user = selectStatement.get({ uuid: request.currentUserUuid })

    if (!user) {
      response.sendStatus(404)
      return
    }

    const pushSubscription = parsePushSubscription(user.push_subscription_json)

    response.send({
      hasPushSubscription: pushSubscription != null
    })
  } catch (error) {
    console.error(error)
    response.sendStatus(400)
  }
}
