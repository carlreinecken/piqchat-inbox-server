import { CONTACT_EXCHANGE_STATE, CONTACT_EXCHANGE_HOST_PLACEHOLDER, WEB_APP_DOMAIN } from './../constants.js'
import db from './../database.js'
import { createAcceptUrl } from './create-accept-url.js'

export function createContactExchangeForSignup () {
  const insertStatement = db.prepare(`
    INSERT INTO contact_exchanges (one_time_token, state, encrypted_contact, created_at)
    VALUES (@one_time_token, @state, @encrypted_contact, @created_at)
  `)

  const { acceptUrl, oneTimeToken } = createAcceptUrl(CONTACT_EXCHANGE_HOST_PLACEHOLDER)

  insertStatement.run({
    one_time_token: oneTimeToken,
    state: CONTACT_EXCHANGE_STATE.INITIATED,
    encrypted_contact: '',
    created_at: (new Date()).toISOString()
  })

  const url = new URL(`https://${WEB_APP_DOMAIN}`)
  const searchParams = new URLSearchParams()
  searchParams.set('exchange-url', acceptUrl)
  searchParams.set('exchange-key', '')
  url.hash = '?' + searchParams.toString()

  return url.toString()
}

export function createStartupContactExchangeUrl (ignoreCounts) {
  const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get()?.count

  if (userCount > 0 && !ignoreCounts) {
    return
  }

  const contactExchangeCount = db.prepare(`
    SELECT COUNT(*) AS count
    FROM contact_exchanges
    WHERE created_by IS NULL
      AND state = '${CONTACT_EXCHANGE_STATE.INITIATED}'
  `).get()?.count

  if (contactExchangeCount > 0 && !ignoreCounts) {
    return
  }

  const url = createContactExchangeForSignup()

  console.log(`\nAccept this invite link in the ${WEB_APP_DOMAIN} web app (can also be scanned as QR code):\n${url}\n\n`)
}
