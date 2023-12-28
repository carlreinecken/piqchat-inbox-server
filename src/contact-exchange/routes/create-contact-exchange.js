import db from '../../database.js'
import { CONTACT_EXCHANGE_STATE } from '../../constants.js'
import { calculateTimeToAcceptUntil } from './../calculate-time-to-live.js'
import { getUserId } from '../../shared/get-user-id.js'
import { createAcceptUrl } from '../create-accept-url.js'

export function createContactExchange (request, response) {
  try {
    const insert = db.prepare(`
      INSERT INTO contact_exchanges (one_time_token, state, encrypted_contact, created_at, created_by)
      VALUES (@one_time_token, @state, @encrypted_contact, @created_at, @created_by)
    `)

    const { acceptUrl, oneTimeToken } = createAcceptUrl(request.get('host'))
    const createdAt = new Date()
    const timeToLive = calculateTimeToAcceptUntil(createdAt)

    const userId = getUserId(request.currentUserUuid)

    if (userId == null) {
      return response.sendStatus(403)
    }

    insert.run({
      one_time_token: oneTimeToken,
      state: CONTACT_EXCHANGE_STATE.INITIATED,
      encrypted_contact: request.body.encryptedContact,
      created_by: userId,
      created_at: createdAt.toISOString()
    })

    response.status(201).send({
      oneTimeToken,
      acceptUrl,
      timeToLive
    })
  } catch (error) {
    console.error(error)
    response.sendStatus(400)
  }
}
