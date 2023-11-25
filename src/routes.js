import express from 'express'
import multer from 'multer'
import signatureMiddleware from './signature-middleware.js'

import { getParcels, downloadParcel, deleteParcel, statusParcelInbox } from './parcels.js'
import { uploadParcelForOne, uploadParcelGroup, uploadParcelAuthorizationForOne, uploadParcelGroupAuthorization } from './parcels/upload.js'
import { createContactExchange, acceptContactExchange, getContactExchange, revokeContactExchange } from './contact-exchange.js'
import { getAccount, updateAccountContacts, registerPushSubscription, getProfileBackup, updateProfileBackup, getInvitedUsers, deleteProfile } from './account.js'
import { getInfo } from './meta/controller.js'

const router = express.Router()

router.get('/info', getInfo)
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
router.post('/parcels/group/:recipients', uploadParcelGroupAuthorization, parseFile.single('attachment'), uploadParcelGroup)
router.post('/parcels/:recipient', uploadParcelAuthorizationForOne, parseFile.single('attachment'), uploadParcelForOne)
router.get('/parcels/:recipient/accepts', uploadParcelAuthorizationForOne, (_, response) => response.sendStatus(200))
router.get('/parcels/:recipient/status', statusParcelInbox)
router.get('/parcels/:uuid/attachment', downloadParcel)
router.delete('/parcels/:uuid', deleteParcel)

router.post('/contact-exchange', createContactExchange)
router.get('/contact-exchange/:oneTimeToken', getContactExchange)
router.delete('/contact-exchange/:oneTimeToken', revokeContactExchange)

router.get('/account', getAccount)
router.post('/account/contacts', updateAccountContacts)
router.post('/account/push-subscriptions', registerPushSubscription)
router.get('/account/backup', getProfileBackup)
router.post('/account/backup', updateProfileBackup)
router.get('/account/invited-users', getInvitedUsers)
router.post('/account/delete', deleteProfile)

export default router
