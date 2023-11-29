import { describe, it } from 'mocha'
import { expect } from 'chai'
import tweetnacl from 'tweetnacl'
import tweetnaclUtil from 'tweetnacl-util'
import db from '../src/database.js'
import fetch from 'node-fetch'
import { createTestUserInDatabase } from './create-test-user-in-database.js'
import { createAuthorizationHeader } from './create-authorization-header.js'

describe('contact exchange routes', function () {
  const url = `http://localhost:${process.env.PORT}/api/contact-exchange`

  it('create contact exchange', async function () {
    const keyPair = createTestUserInDatabase()

    const headers = createAuthorizationHeader(keyPair)
    headers['Content-Type'] = 'application/json'

    const response = await fetch(`${url}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ encryptedContact: '$encryptedContact' })
    })

    const body = await response.json()

    expect(response.status).to.equal(201)

    expect(body.oneTimeToken).to.have.lengthOf(36)
    expect(body.acceptUrl).to.have.string(`${url}/${body.oneTimeToken}/accept`)
    expect(new Date(body.timeToLive)).to.be.instanceof(Date)
  })

  it('create and get contact exchange', async function () {
    const keyPair = createTestUserInDatabase()

    const headers = createAuthorizationHeader(keyPair)
    headers['Content-Type'] = 'application/json'

    const createResponse = await fetch(`${url}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ encryptedContact: '$encryptedContact' })
    })

    const createBody = await createResponse.json()

    const getResponse = await fetch(`${url}/${createBody.oneTimeToken}`, { headers })

    const getBody = await getResponse.json()

    expect(getResponse.status).to.equal(200)

    expect(getBody.state).to.equal('INITIATED')
    expect(getBody.timeToLive).to.equal(createBody.timeToLive)
    /* eslint-disable-next-line no-unused-expressions */
    expect(getBody.encryptedContact).to.be.undefined
  })

  it('create and delete contact exchange', async function () {
    const keyPair = createTestUserInDatabase()

    const headers = createAuthorizationHeader(keyPair)
    headers['Content-Type'] = 'application/json'

    const createResponse = await fetch(`${url}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ encryptedContact: '$encryptedContact' })
    })

    const createBody = await createResponse.json()

    const deleteResponse = await fetch(`${url}/${createBody.oneTimeToken}`, { method: 'DELETE', headers })

    const getResponse = await fetch(`${url}/${createBody.oneTimeToken}`, { headers })

    expect(deleteResponse.status).to.equal(200)
    expect(getResponse.status).to.equal(404)
  })

  it('create and accept contact exchange', async function () {
    const keyPair = createTestUserInDatabase()

    const headers = createAuthorizationHeader(keyPair)
    headers['Content-Type'] = 'application/json'

    const createResponse = await fetch(`${url}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ encryptedContact: '$encryptedContact_offer' })
    })
    const createBody = await createResponse.json()

    const acceptResponse = await fetch(`${createBody.acceptUrl}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ encryptedContact: '$encryptedContact_answer' })
    })
    const acceptBody = await acceptResponse.json()

    const getResponse = await fetch(`${url}/${createBody.oneTimeToken}`, { headers })
    const getBody = await getResponse.json()

    expect(acceptResponse.status).to.equal(200)
    expect(acceptBody.timeToLive).to.equal(createBody.timeToLive)
    expect(acceptBody.encryptedContact).to.equal('$encryptedContact_offer')

    expect(getResponse.status).to.equal(200)
    expect(getBody.state).to.equal('ACCEPTED')
    expect(getBody.timeToLive).to.equal(createBody.timeToLive)
    expect(getBody.encryptedContact).to.equal('$encryptedContact_answer')
  })

  it('create and accept contact exchange which creates a new user', async function () {
    const keyPair = createTestUserInDatabase()

    const headers = createAuthorizationHeader(keyPair)
    headers['Content-Type'] = 'application/json'

    const createResponse = await fetch(`${url}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ encryptedContact: '$encryptedContact_offer' })
    })
    const createBody = await createResponse.json()

    const userUuid = tweetnaclUtil.encodeBase64(tweetnacl.randomBytes(tweetnacl.box.publicKeyLength))
    const acceptResponse = await fetch(`${createBody.acceptUrl}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        encryptedContact: '$encryptedContact_answer',
        userUuid
      })
    })

    const newUserTableRow = db
      .prepare('SELECT * FROM users WHERE uuid = @uuid')
      .get({ uuid: userUuid })

    expect(acceptResponse.status).to.equal(200)
    /* eslint-disable-next-line no-unused-expressions */
    expect(newUserTableRow).to.exist
  })
})
