import { describe, it } from 'mocha'
import { expect } from 'chai'
import db from '../src/database.js'
import { cleanupParcels } from '../src/parcels/cleanup-parcels.js'

describe('cleanup parcels', function () {
  it('cleanup parcel', async function () {
    const insertParcelStatement = db.prepare(`
      INSERT INTO parcels (uuid, recipient_uuid, type, content, attachment_filename, uploaded_by, uploaded_at)
      VALUES (@uuid, @recipient_uuid, @type, @content, @attachment_filename, @uploaded_by, @uploaded_at)
    `)
    const countParcelsStatement = db.prepare('SELECT COUNT(*) as count FROM parcels')

    insertParcelStatement.run({
      uuid: crypto.randomUUID(),
      recipient_uuid: 'abc',
      type: 'MEDIA',
      content: 'foobar1',
      attachment_filename: 'barfoo1',
      uploaded_by: 'abc',
      uploaded_at: (new Date()).toISOString()
    })

    insertParcelStatement.run({
      uuid: crypto.randomUUID(),
      recipient_uuid: 'abc',
      type: 'MEDIA',
      content: 'foobar2',
      attachment_filename: 'barfoo2',
      uploaded_by: 'abc',
      uploaded_at: '2023-05-01'
    })

    expect(countParcelsStatement.get().count).to.equal(2)

    cleanupParcels()

    // TODO: test if attachment files were properly deleted
    expect(countParcelsStatement.get().count).to.equal(1)
  })
})
