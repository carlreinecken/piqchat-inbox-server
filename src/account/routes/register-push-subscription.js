import db from '../../database.js'

export function registerPushSubscription (request, response) {
  try {
    const updateStatement = db.prepare(`
      UPDATE users SET push_subscription_json = @subscription
      WHERE uuid = @uuid
    `)

    updateStatement.run({
      subscription: JSON.stringify({
        endpoint: request.body.endpoint,
        keys: request.body.keys
      }),
      uuid: request.currentUserUuid
    })

    if (updateStatement.changes === 0) {
      return response.sendStatus(403)
    }

    response.sendStatus(204)
  } catch (error) {
    console.error(error)
    response.sendStatus(400)
  }
}
