import db from '../../database.js'
import crypto from 'crypto'
import { CONTACT_EXCHANGE_STATE } from '../../constants.js'
import { calculateTimeToAcceptUntil } from './../calculate-time-to-live.js'
import { getUserId } from './../get-user-id.js'

export function createContactExchange (request, response) {
  const insert = db.prepare(`
    INSERT INTO contact_exchanges (one_time_token, state, encrypted_contact, created_at, created_by)
    VALUES (@one_time_token, @state, @encrypted_contact, @created_at, @created_by)
  `)

  const oneTimeToken = crypto.randomUUID()
  const createdAt = new Date()
  const timeToLive = calculateTimeToAcceptUntil(createdAt)

  try {
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
  } catch (error) {
    console.error(error)
    response.sendStatus(400)
    return
  }

  const protocol = process.env.NODE_ENV === 'production' ? 'https' : request.protocol

  response.status(201).send({
    oneTimeToken,
    acceptUrl: `${protocol}://${request.get('host')}/api/contact-exchange/${oneTimeToken}/accept`,
    timeToLive
  })
}
