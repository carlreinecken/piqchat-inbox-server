import { Blob } from 'node:buffer'
import { describe, it } from 'mocha'
import { expect } from 'chai'
import tweetnaclUtil from 'tweetnacl-util'
import fetch from 'node-fetch'
import { FormData } from 'formdata-polyfill/esm.min.js'
import db from '../src/database.js'
import { createTestUserInDatabase } from './create-test-user-in-database.js'
import { createAuthorizationHeader } from './create-authorization-header.js'

function createUser (contacts = []) {
  const keyPair = createTestUserInDatabase(contacts)
  const id = tweetnaclUtil.encodeBase64(keyPair.publicKey)

  return { keyPair, id }
}

describe('parcel deprecated upload routes', function () {
  const url = `http://localhost:${process.env.PORT}/api/parcels`

  it('upload "one" which is forbidden because the sender is not on the whitelist', async function () {
    const aliceKeyPair = createTestUserInDatabase()
    const carolKeyPair = createTestUserInDatabase()

    const formData = new FormData()
    formData.append('type', 'CONTACT')
    formData.append('content', JSON.stringify({ secretKey: '$_SECRET_KEY', contact: '$_ENCRYPTED_CONTACT' }))

    const recipient = encodeURIComponent(tweetnaclUtil.encodeBase64(aliceKeyPair.publicKey))

    const uploadResponse = await fetch(`${url}/${recipient}`, {
      method: 'POST',
      headers: createAuthorizationHeader(carolKeyPair),
      body: formData
    })

    expect(uploadResponse.status).to.equal(403)
  })

  it('upload "one" successfull', async function () {
    const aliceKeyPair = createTestUserInDatabase()
    const aliceId = tweetnaclUtil.encodeBase64(aliceKeyPair.publicKey)
    const carolKeyPair = createTestUserInDatabase([aliceId])
    const carolId = tweetnaclUtil.encodeBase64(carolKeyPair.publicKey)

    const formData = new FormData()
    formData.append('type', 'CONTACT')
    formData.append('content', JSON.stringify({ secretKey: '$_SECRET_KEY', contact: '$_ENCRYPTED_CONTACT' }))

    const recipient = encodeURIComponent(carolId)

    const uploadResponse = await fetch(`${url}/${recipient}`, {
      method: 'POST',
      headers: createAuthorizationHeader(aliceKeyPair),
      body: formData
    })

    expect(uploadResponse.status).to.equal(201)
  })

  it('upload "group" successfull', async function () {
    const aliceKeyPair = createTestUserInDatabase()
    const aliceId = tweetnaclUtil.encodeBase64(aliceKeyPair.publicKey)
    const carolKeyPair = createTestUserInDatabase([aliceId])
    const carolId = tweetnaclUtil.encodeBase64(carolKeyPair.publicKey)

    const formData = new FormData()
    formData.append('type', 'MEDIA')
    const carolsContent = JSON.stringify({ secretKey: '$_SECRET_KEY', points: {} })
    formData.append('contents', JSON.stringify({ [carolId]: carolsContent }))
    formData.append('attachment', new Blob(['$_MEDIA']))

    const recipient = encodeURIComponent(carolId)

    const uploadResponse = await fetch(`${url}/group/${recipient}`, {
      method: 'POST',
      headers: createAuthorizationHeader(aliceKeyPair),
      body: formData
    })

    const uploadBody = await uploadResponse.json()

    const parcelsTableRows = db.prepare('SELECT recipient_uuid, type, content, uploaded_by FROM parcels').all()

    expect(uploadResponse.status).to.equal(200)
    expect(uploadBody.forbiddenRecipientIds).to.eql([])
    expect(parcelsTableRows).to.eql([
      { recipient_uuid: carolId, type: 'MEDIA', content: carolsContent, uploaded_by: aliceId }
    ])
  })

  it('upload "group" successfull for multiple recipients', async function () {
    const { id: aliceId, keyPair: aliceKeyPair } = createUser()
    const { id: carolId } = createUser([aliceId])
    const { id: florenceId } = createUser([aliceId])

    const formData = new FormData()
    formData.append('type', 'MEDIA')
    const carolsContent = JSON.stringify({ secretKey: '$_SECRET_KEY_CAROL', points: {} })
    const florenceContent = JSON.stringify({ secretKey: '$_SECRET_KEY_FLORENCE', points: {} })
    formData.append('contents', JSON.stringify({ [carolId]: carolsContent, [florenceId]: florenceContent }))
    formData.append('attachment', new Blob(['$_MEDIA']))

    const recipient = encodeURIComponent([carolId, florenceId].join(','))

    const uploadResponse = await fetch(`${url}/group/${recipient}`, {
      method: 'POST',
      headers: createAuthorizationHeader(aliceKeyPair),
      body: formData
    })

    const uploadBody = await uploadResponse.json()

    const parcelsTableRows = db.prepare('SELECT recipient_uuid, type, content, uploaded_by FROM parcels').all()

    expect(uploadResponse.status).to.equal(200)
    expect(uploadBody.forbiddenRecipientIds).to.eql([])
    expect(parcelsTableRows).to.eql([
      { recipient_uuid: carolId, type: 'MEDIA', content: carolsContent, uploaded_by: aliceId },
      { recipient_uuid: florenceId, type: 'MEDIA', content: florenceContent, uploaded_by: aliceId }
    ])
  })

  it('upload "group" partially successfull', async function () {
    const { id: aliceId, keyPair: aliceKeyPair } = createUser()
    const { id: carolId } = createUser()
    const { id: florenceId } = createUser([aliceId])

    const formData = new FormData()
    formData.append('type', 'MEDIA')
    const carolsContent = JSON.stringify({ secretKey: '$_SECRET_KEY_CAROL', points: {} })
    const florenceContent = JSON.stringify({ secretKey: '$_SECRET_KEY_FLORENCE', points: {} })
    formData.append('contents', JSON.stringify({ [carolId]: carolsContent, [florenceId]: florenceContent }))
    formData.append('attachment', new Blob(['$_MEDIA']))

    const recipient = encodeURIComponent([carolId, florenceId].join(','))

    const uploadResponse = await fetch(`${url}/group/${recipient}`, {
      method: 'POST',
      headers: createAuthorizationHeader(aliceKeyPair),
      body: formData
    })

    const uploadBody = await uploadResponse.json()

    const parcelsTableRows = db.prepare('SELECT recipient_uuid, type, content, uploaded_by FROM parcels').all()

    expect(uploadResponse.status).to.equal(200)
    expect(uploadBody.forbiddenRecipientIds).to.eql([carolId])
    expect(parcelsTableRows).to.eql([
      { recipient_uuid: florenceId, type: 'MEDIA', content: florenceContent, uploaded_by: aliceId }
    ])
  })
})
