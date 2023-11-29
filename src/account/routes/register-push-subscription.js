import db from '../../database.js'

export function registerPushSubscription (request, response) {
  const updateStatement = db.prepare(`
    UPDATE users SET push_subscription_json = @subscription
    WHERE uuid = @uuid
  `)

  try {
    updateStatement.run({
      subscription: JSON.stringify({
        endpoint: request.body.endpoint,
        keys: request.body.keys
      }),
      uuid: request.currentUserUuid
    })

    response.sendStatus(204)
  } catch (error) {
    console.error(error)
    response.sendStatus(400)
  }
}
