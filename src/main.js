import express from 'express'
import cors from 'cors'
import path from 'path'
import * as dotenv from 'dotenv'
import routes from './routes.js'

dotenv.config()

const app = express()

app.use(express.json())
app.use(express.static('public'))
app.use(cors())

app.get('/', (_, response) => {
  response.sendFile(path.join(__dirname, '/index.html'))
})

app.use('/api/', routes)

const listener = app.listen(process.env.PORT, () => {
  console.log(`Listening on port ${listener.address().port}`)
})
