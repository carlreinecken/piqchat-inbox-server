import express from 'express'
import multer from 'multer'
import signatureMiddleware from '../signature-middleware.js'
import {
  uploadParcelForOne,
  uploadParcelGroup,
  uploadParcelAuthorizationForOne,
  uploadParcelGroupAuthorization
} from './deprecated-parcel-upload-functions.js'
import { getParcels } from './routes/get-parcels.js'
import { getAcceptStatusForRecipient } from './routes/get-accept-status-for-recipient.js'
import { getParcelStatusForRecipient } from './routes/get-parcel-status-for-recipient.js'
import { downloadParcel } from './routes/download-parcel.js'
import { deleteParcel } from './routes/delete-parcel.js'
import { uploadParcel } from './routes/upload-parcel.js'

export const parcelsRouter = express.Router()

parcelsRouter.use(signatureMiddleware)

const parseFile = multer({ dest: process.env.PARCEL_ATTACHMENTS_UPLOAD_PATH, limits: { fieldSize: 100000 } })

/**
 * --------------
 * For the sender
 * --------------
 */
parcelsRouter.post('/', parseFile.single('attachment'), uploadParcel)
parcelsRouter.get('/:recipient/accepts', getAcceptStatusForRecipient)
parcelsRouter.get('/:recipient/status', getParcelStatusForRecipient)

// both post routes are @deprecated - use POST / instead
parcelsRouter.post('/:recipient', uploadParcelAuthorizationForOne, parseFile.single('attachment'), uploadParcelForOne)
parcelsRouter.post('/group/:recipients', uploadParcelGroupAuthorization, parseFile.single('attachment'), uploadParcelGroup)

/**
 * -----------------
 * For the recipient (who is signed up on this inbox server)
 * -----------------
 */
parcelsRouter.get('/', getParcels)
parcelsRouter.get('/:uuid/attachment', downloadParcel)
parcelsRouter.delete('/:uuid', deleteParcel)
