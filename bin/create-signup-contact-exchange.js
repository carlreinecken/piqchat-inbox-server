import * as dotenv from 'dotenv'
import { createContactExchangeForSignup } from '../src/contact-exchange/create-contact-exchange-for-signup.js'
import { WEB_APP_DOMAIN } from '../src/constants.js'

dotenv.config()

const url = createContactExchangeForSignup()

console.log(`\nAccept this invite link in the ${WEB_APP_DOMAIN} web app (can also be scanned as QR code):\n${url}\n\n`)
