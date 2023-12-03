import express from 'express'
import cors from 'cors'
import path from 'path'
import * as dotenv from 'dotenv'
import { apiRouter } from './api-router.js'
import { startScheduler, stopScheduler } from './scheduler.js'

dotenv.config()

const app = express()

app.use(express.json())
app.use(express.static('public'))
app.use(cors())

app.get('/', (_, response) => {
  response.sendFile(path.join(__dirname, '/index.html'))
})

app.use('/api/', apiRouter)

const server = app.listen(process.env.PORT, () => {
  console.log(`Listening on port ${server.address().port} with pid ${process?.pid}`)
})

startScheduler()

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

function shutdown () {
  const port = server?.address()?.port

  console.log(`Closing server that is listening on port ${port}`)

  server.close(() => {
    console.log(`No longer listening on port ${port}`)
  })

  stopScheduler()
  console.log('Stopped scheduler tasks')
}
