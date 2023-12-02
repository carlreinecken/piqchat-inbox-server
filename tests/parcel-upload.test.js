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

describe('parcel upload routes', function () {
  const url = `http://localhost:${process.env.PORT}/api/parcels`

  it('send to one recipient', async function () {
    const aliceKeyPair = createTestUserInDatabase()
    const aliceId = tweetnaclUtil.encodeBase64(aliceKeyPair.publicKey)
    const carolKeyPair = createTestUserInDatabase([aliceId])
    const carolId = tweetnaclUtil.encodeBase64(carolKeyPair.publicKey)

    const formData = new FormData()
    formData.append('type', 'MEDIA')
    const carolsContent = JSON.stringify({ secretKey: '$_SECRET_KEY_CAROL', points: {} })
    formData.append('recipient', carolId + ' ' + carolsContent)
    formData.append('attachment', new Blob(['$_MEDIA']))

    const uploadResponse = await fetch(url, {
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

  it('send to one recipient which is forbidden', async function () {
    const aliceKeyPair = createTestUserInDatabase()
    const carolKeyPair = createTestUserInDatabase()
    const carolId = tweetnaclUtil.encodeBase64(carolKeyPair.publicKey)

    const formData = new FormData()
    formData.append('type', 'MEDIA')
    const carolsContent = JSON.stringify({ secretKey: '$_SECRET_KEY_CAROL', points: {} })
    formData.append('recipient', carolId + ' ' + carolsContent)
    formData.append('attachment', new Blob(['$_MEDIA']))

    const uploadResponse = await fetch(url, {
      method: 'POST',
      headers: createAuthorizationHeader(aliceKeyPair),
      body: formData
    })

    const parcelsTableRows = db.prepare('SELECT recipient_uuid, type, content, uploaded_by FROM parcels').all()

    expect(uploadResponse.status).to.equal(403)
    expect(parcelsTableRows).to.have.lengthOf(0)
  })

  it('send to two recipients', async function () {
    const { id: aliceId, keyPair: aliceKeyPair } = createUser()
    const { id: carolId } = createUser([aliceId])
    const { id: florenceId } = createUser([aliceId])

    const formData = new FormData()
    formData.append('type', 'MEDIA')
    const carolsContent = JSON.stringify({ secretKey: '$_SECRET_KEY_CAROL', points: {} })
    const florenceContent = JSON.stringify({ secretKey: '$_SECRET_KEY_FLORENCE', points: {} })
    formData.append('recipient', carolId + ' ' + carolsContent)
    formData.append('recipient', florenceId + ' ' + florenceContent)
    formData.append('attachment', new Blob(['$_MEDIA']))

    const uploadResponse = await fetch(url, {
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

  it('send to two recipients of which one is forbidden', async function () {
    const { id: aliceId, keyPair: aliceKeyPair } = createUser()
    const { id: carolId } = createUser()
    const { id: florenceId } = createUser([aliceId])

    const formData = new FormData()
    formData.append('type', 'MEDIA')
    const carolsContent = JSON.stringify({ secretKey: '$_SECRET_KEY_CAROL', points: {} })
    const florenceContent = JSON.stringify({ secretKey: '$_SECRET_KEY_FLORENCE', points: {} })
    formData.append('recipient', carolId + ' ' + carolsContent)
    formData.append('recipient', florenceId + ' ' + florenceContent)
    formData.append('attachment', new Blob(['$_MEDIA']))

    const uploadResponse = await fetch(url, {
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
