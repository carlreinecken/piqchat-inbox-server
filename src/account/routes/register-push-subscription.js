import db from '../../database.js'

export function registerPushSubscription (request, response) {
  try {
    const updateStatement = db.prepare(`
      UPDATE users SET push_subscription_json = @subscription
      WHERE uuid = @uuid
    `)

    const result = updateStatement.run({
      subscription: JSON.stringify({
        endpoint: request.body.endpoint,
        keys: request.body.keys
      }),
      uuid: request.currentUserUuid
    })

    if (result.changes === 0) {
      response.sendStatus(403)
      return
    }

    response.sendStatus(204)
  } catch (error) {
    console.error(error)
    response.sendStatus(400)
  }
}
