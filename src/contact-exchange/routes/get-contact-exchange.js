import db from '../../database.js'
import { CONTACT_EXCHANGE_STATE } from '../../constants.js'
import { calculateTimeToAcceptUntil } from './../calculate-time-to-live.js'
import { getUserId } from '../../shared/get-user-id.js'

export function getContactExchange (request, response) {
  try {
    const select = db.prepare(`
      SELECT *
      FROM contact_exchanges
      WHERE created_by = @current_user_id
        AND one_time_token = @one_time_token
    `)

    const userId = getUserId(request.currentUserUuid)

    const row = select.get({
      current_user_id: userId,
      one_time_token: request.params.oneTimeToken
    })

    if (!row) {
      response.sendStatus(404)
      return
    }

    const timeToLive = calculateTimeToAcceptUntil(new Date(row.created_at))

    if (timeToLive < new Date()) {
      response.sendStatus(404)
      return
    }

    const exchange = { state: row.state, timeToLive }

    if (row.state === CONTACT_EXCHANGE_STATE.ACCEPTED) {
      exchange.encryptedContact = row.encrypted_contact
    }

    response.send(exchange)
  } catch (error) {
    console.error(error)
    response.sendStatus(400)
  }
}
