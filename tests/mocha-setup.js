import * as fs from 'node:fs'
import express from 'express'
import { beforeEach, afterEach, after } from 'mocha'
import './mocha-setup-env.js' // This needs to run BEFORE any other imports that call `new Database`
import { apiRouter } from '../src/api-router.js'
import db from '../src/database.js'

let server

beforeEach(function (done) {
  const app = express()

  app.use(express.json())

  app.use('/api/', apiRouter)

  fs.readdirSync('./migrations/scripts/').forEach(filename => {
    const sqlScript = fs.readFileSync(`./migrations/scripts/${filename}`, 'utf8')

    db.exec(sqlScript)
  })

  server = app.listen(process.env.PORT, () => {
    done()
  })
})

afterEach(function (done) {
  server.close(() => {
    const tableStatement = db.prepare('SELECT tbl_name FROM sqlite_schema WHERE type = \'table\'')
    const tables = tableStatement.all()

    for (const table of tables) {
      db.exec(`DROP TABLE ${table.tbl_name}`)
    }

    done()
  })
})

after(function () {
  const path = process.env.PARCEL_ATTACHMENTS_UPLOAD_PATH

  fs.rmSync(path, { recursive: true })
})
