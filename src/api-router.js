import express from 'express'

import { getInfo } from './routes/get-info.js'
import { contactExchangeRouter } from './contact-exchange/router.js'
import { parcelsRouter } from './parcels/router.js'
import { accountRouter } from './account/router.js'

export const apiRouter = express.Router()

apiRouter.get('/info', getInfo)

apiRouter.use('/contact-exchange/', contactExchangeRouter)
apiRouter.use('/parcels/', parcelsRouter)
apiRouter.use('/account/', accountRouter)
