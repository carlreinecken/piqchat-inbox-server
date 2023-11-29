import express from 'express'
import signatureMiddleware from '../signature-middleware.js'
import { createContactExchange } from './routes/create-contact-exchange.js'
import { acceptContactExchange } from './routes/accept-contact-exchange.js'
import { getContactExchange } from './routes/get-contact-exchange.js'
import { revokeContactExchange } from './routes/revoke-contact-exchange.js'

export const contactExchangeRouter = express.Router()

/**
 * ---------------
 * Unauthenticated
 * ---------------
 */

contactExchangeRouter.post('/:oneTimeToken/accept', acceptContactExchange)

/**
 * -------------
 * Authenticated
 * -------------
 */

contactExchangeRouter.use(signatureMiddleware)

contactExchangeRouter.post('/', createContactExchange)
contactExchangeRouter.get('/:oneTimeToken', getContactExchange)
contactExchangeRouter.delete('/:oneTimeToken', revokeContactExchange)
