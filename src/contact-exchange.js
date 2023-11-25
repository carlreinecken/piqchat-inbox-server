import db from './database.js'
import crypto from 'crypto'
import { CONTACT_EXCHANGE_STATE } from './constants.js'
import { calculateTimeToAcceptUntil } from './contact-exchange/calculate-time-to-live.js'

export { acceptContactExchange } from './contact-exchange/accept-exchange.js'

function getUserId (currentUserUuid) {
  const getUserStatement = db.prepare('SELECT id FROM users WHERE uuid = @uuid AND created_at IS NOT NULL')

  return getUserStatement.get({ uuid: currentUserUuid })?.id
}

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
      return response.sendStatus(400)
    }

    response.sendStatus(200)
  } catch (error) {
    console.error(error)
    response.sendStatus(400)
  }
}

export function getContactExchange (request, response) {
  const select = db.prepare(`
    SELECT *
    FROM contact_exchanges
    WHERE created_by = @current_user_id
      AND one_time_token = @one_time_token
  `)

  try {
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
