import express from 'express'
import cors from 'cors'
import path from 'path'
import * as dotenv from 'dotenv'
import { apiRouter } from './api-router.js'

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
  console.log(`Listening on port ${server.address().port}`)
})

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server')

  const port = server.address().port

  server.close(() => {
    console.log(`No longer listening on port ${port}`)
  })
})
