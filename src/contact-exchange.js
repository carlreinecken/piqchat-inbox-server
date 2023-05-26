import db from './database.js'
import crypto from 'crypto'

const TIME_TO_ACCEPT_IN_MINUTES = process.env.CONTACT_EXCHANGE_TIME_TO_LIVE_IN_MIN || 10

const STATE = {
  INITIATED: 'INITIATED',
  ACCEPTED: 'ACCEPTED'
}

function calculateTimeToAcceptUntil (createdAt) {
  return new Date(createdAt.getTime() + TIME_TO_ACCEPT_IN_MINUTES * 60 * 1000)
}

export function createContactExchange (request, response) {
  const insert = db.prepare(`
    INSERT INTO contact_exchanges (one_time_token, state, encrypted_contact, allow_signup, created_at, created_by)
    VALUES (@one_time_token, @state, @encrypted_contact, true, @created_at, @created_by)
  `)
  const countUserStatement = db.prepare('SELECT COUNT(*) AS count FROM users WHERE uuid = @uuid')

  const oneTimeToken = crypto.randomUUID()
  const createdAt = new Date()
  const timeToLive = calculateTimeToAcceptUntil(createdAt)

  try {
    const existsAsUser = countUserStatement.get({ uuid: request.currentUserUuid }).count === 1

    if (!existsAsUser) {
      return response.sendStatus(403)
    }

    insert.run({
      one_time_token: oneTimeToken,
      state: STATE.INITIATED,
      encrypted_contact: request.body.encryptedContact,
      created_by: request.currentUserUuid,
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
    WHERE created_by = @current_user_uuid
      AND one_time_token = @one_time_token
  `)

  try {
    const result = deleteStatement.run({
      current_user_uuid: request.currentUserUuid,
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

export function allowSignupForContactExchange (request, response) {
  const update = db.prepare(`
    UPDATE contact_exchanges
    SET allow_signup = true
    WHERE created_by = @current_user_uuid
      AND one_time_token = @one_time_token
  `)

  try {
    const result = update.run({
      current_user_uuid: request.currentUserUuid,
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
    WHERE created_by = @current_user_uuid
      AND one_time_token = @one_time_token
  `)
  // TODO: only get the exchanges that are still active: AND DATETIME(created_at) <

  try {
    const row = select.get({
      current_user_uuid: request.currentUserUuid,
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

    if (row.state === STATE.ACCEPTED) {
      exchange.encryptedContact = row.encrypted_contact
    }

    response.send(exchange)
  } catch (error) {
    console.error(error)
    response.sendStatus(400)
  }
}

/**
 * This one request does A LOT.
 *
 * This request is publicly accessible!
 *
 * - It is only accessible with one-time token, if it is still valid
 * - Is only does anything if the exchange model is still in state INITIATED
 * - Changes the state to ACCEPTED
 * - Expects an encryptedContact as request body and writes that into the table
 * - Creates a new permenant access token, if the requiring user has none yet
 * - Returns in the response the previously encryptedContact from the table
 *   and optionally the access token
 */
export function acceptContactExchange (request, response) {
  const selectStatement = db.prepare(`
    SELECT * FROM contact_exchanges
      WHERE one_time_token = @one_time_token
  `)

  const updateStatement = db.prepare(`
    UPDATE contact_exchanges
      SET state = @state, encrypted_contact = @encrypted_contact
      WHERE one_time_token = @one_time_token
  `)

  const insertUserStatement = db.prepare(`
    INSERT INTO users (uuid, push_subscription_json, contacts_json, created_at, created_by)
    VALUES (@uuid, '{}', '[]', @created_at, @created_by)
  `)
  const countUserStatement = db.prepare('SELECT COUNT(*) AS count FROM users WHERE uuid = @uuid')

  try {
    const row = selectStatement.get({ one_time_token: request.params.oneTimeToken })

    if (!row || row.state !== STATE.INITIATED) {
      response.sendStatus(404)
      return
    }

    const timeToLive = calculateTimeToAcceptUntil(new Date(row.created_at))

    if (timeToLive < new Date()) {
      response.sendStatus(404)
      return
    }

    const responseBody = {
      encryptedContact: row.encrypted_contact,
      timeToLive
    }

    if (request.body.userUuid != null && !row.allow_signup) {
      // If the client sends an Uuid, the exchange MUST HAVE the allowance to create a user
      response.status(403).send('A signup is not allowed. Try again after the offerer has clicked "allow signup".')
      return
    }

    if (row.allow_signup && request.body.userUuid != null) {
      const existsAsUser = countUserStatement.get({ uuid: request.body.userUuid }).count === 1

      if (!existsAsUser) {
        const insertResult = insertUserStatement.run({
          uuid: request.body.userUuid,
          created_at: (new Date()).toISOString(),
          created_by: row.created_by
        })

        if (insertResult.changes === 1) {
          responseBody.createdUserAccount = true
        }
      }
    }

    updateStatement.run({
      one_time_token: request.params.oneTimeToken,
      state: STATE.ACCEPTED,
      encrypted_contact: request.body.encryptedContact
    })

    response.send(responseBody)
  } catch (error) {
    console.error(error)
    response.sendStatus(400)
  }
}
