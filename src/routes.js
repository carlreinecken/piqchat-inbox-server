import express from 'express'
import multer from 'multer'
import signatureMiddleware from './signature-middleware.js'

import { getParcels, uploadParcel, uploadParcelAuthorization, downloadParcel, deleteParcel, statusParcelInbox, statusParcelAccepts } from './parcels.js'
import { createContactExchange, acceptContactExchange, getContactExchange, allowSignupForContactExchange, revokeContactExchange } from './contact-exchange.js'
import { getAccount, updateAccountContacts, registerPushSubscription, getProfileBackup, updateProfileBackup } from './account.js'

const router = express.Router()

router.get('/info', function (request, response) {
  response.send({
    publicKey: process.env.API_PUBLIC_KEY,
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
    adminDisplayName: process.env.ADMIN_DISPLAY_NAME
  })
})
router.post('/contact-exchange/:oneTimeToken/accept', acceptContactExchange)

/**
 * !!!
 * All routes AFTER the authenticate middleware are authenticated.
 * Everything else before is publicly accessible.
 *
 * TODO: change this in something more explicit instead of just ordering!
 * !!!
 */
router.use(signatureMiddleware)

const parseFile = multer({ dest: process.env.PARCEL_ATTACHMENTS_UPLOAD_PATH })
router.get('/parcels', getParcels)
router.post('/parcels/:recipient', uploadParcelAuthorization, parseFile.single('attachment'), uploadParcel)
router.get('/parcels/:recipient/accepts', statusParcelAccepts)
router.get('/parcels/:recipient/status', statusParcelInbox)
router.get('/parcels/:uuid/attachment', downloadParcel)
router.delete('/parcels/:uuid', deleteParcel)

router.post('/contact-exchange', createContactExchange)
router.get('/contact-exchange/:oneTimeToken', getContactExchange)
router.post('/contact-exchange/:oneTimeToken/allow-signup', allowSignupForContactExchange)
router.delete('/contact-exchange/:oneTimeToken', revokeContactExchange)

router.get('/account', getAccount)
router.post('/account/contacts', updateAccountContacts)
router.post('/account/push-subscriptions', registerPushSubscription)
router.get('/account/backup', getProfileBackup)
router.post('/account/backup', updateProfileBackup)

export default router
