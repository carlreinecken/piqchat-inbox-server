import * as fs from 'node:fs'
import express from 'express'
import { beforeEach, afterEach, after } from 'mocha'
import './mocha-setup-env.js' // This needs to run BEFORE any other imports that call `new Database`
import { apiRouter } from '../src/api-router.js'
import db from '../src/database.js'
import { migrate } from '../bin/migrate.js'

let server

beforeEach(function (done) {
  const app = express()

  app.use(express.json())

  app.use('/api/', apiRouter)

  migrate(db)

  server = app.listen(process.env.PORT, () => {
    done()
  })
})

afterEach(function (done) {
  server.close(() => {
    migrate(db, 0)

    done()
  })
})

after(function () {
  const path = process.env.PARCEL_ATTACHMENTS_UPLOAD_PATH

  fs.rmSync(path, { recursive: true })
})
