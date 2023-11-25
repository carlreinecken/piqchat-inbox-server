import db from '../database.js'
import { CONTACT_EXCHANGE_STATE } from '../constants.js'
import { calculateTimeToAcceptUntil } from './calculate-time-to-live.js'

/**
 * This one request does A LOT.
 *
 * First: this request is publicly accessible!
 *
 * - It is only accessible with one-time token, if it is still valid
 * - Is only does anything if the exchange model is still in state INITIATED
 * - Changes the state to ACCEPTED
 * - Expects an encryptedContact as request body and writes that into the table
 * - Creates a new permenant access token, if the requiring user has none yet
 * - Returns in the response the previously encryptedContact from the table
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
  const reactivateUserStatement = db.prepare(`
    UPDATE users SET
      created_at = @created_at
    WHERE uuid = @uuid
      AND created_at IS NULL
  `)
  const countUserStatement = db.prepare('SELECT COUNT(*) AS count FROM users WHERE uuid = @uuid')

  try {
    const row = selectStatement.get({ one_time_token: request.params.oneTimeToken })

    if (!row || row.state !== CONTACT_EXCHANGE_STATE.INITIATED) {
      response.status(404).send('The friend invite can not be found or was already used.')
      return
    }

    const timeToLive = calculateTimeToAcceptUntil(new Date(row.created_at))

    if (timeToLive < new Date()) {
      response.status(404).send('The friend invite is expired and can not be used anymore.')
      return
    }

    const responseBody = {
      encryptedContact: row.encrypted_contact,
      timeToLive
    }

    if (request.body.userUuid != null) {
      const existsAsUser = countUserStatement.get({ uuid: request.body.userUuid }).count === 1
      const parameters = {
        uuid: request.body.userUuid,
        created_at: (new Date()).toISOString(),
        created_by: row.created_by
      }

      if (existsAsUser) {
        // Reactivate old user
        reactivateUserStatement.run(parameters)
      } else {
        const insertResult = insertUserStatement.run(parameters)

        if (insertResult.changes === 1) {
          responseBody.createdUserAccount = true
        }
      }
    }

    updateStatement.run({
      one_time_token: request.params.oneTimeToken,
      state: CONTACT_EXCHANGE_STATE.ACCEPTED,
      encrypted_contact: request.body.encryptedContact
    })

    response.send(responseBody)
  } catch (error) {
    console.error(error)
    response.sendStatus(400)
  }
}