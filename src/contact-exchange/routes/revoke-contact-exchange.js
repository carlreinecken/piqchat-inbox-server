import db from '../../database.js'
import { getUserId } from './../get-user-id.js'

export function revokeContactExchange (request, response) {
  const deleteStatement = db.prepare(`
    DELETE FROM contact_exchanges
    WHERE created_by = @current_user_id
      AND one_time_token = @one_time_token
  `)

  const userId = getUserId(request.currentUserUuid)

  try {
    const result = deleteStatement.run({
      current_user_id: userId,
      one_time_token: request.params.oneTimeToken
    })

    if (result.changes === 0) {
      return response.sendStatus(404)
    }

    response.sendStatus(200)
  } catch (error) {
    console.error(error)
    response.sendStatus(400)
  }
}
