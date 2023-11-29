import { describe, it } from 'mocha'
import { expect } from 'chai'
import fetch from 'node-fetch'

describe('top level routes', function () {
  it('server info', async function () {
    const response = await fetch(`http://localhost:${process.env.PORT}/api/info`)

    expect(response.status).to.equal(200)
  })
})
