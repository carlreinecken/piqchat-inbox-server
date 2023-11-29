import express from 'express'
import multer from 'multer'
import signatureMiddleware from '../signature-middleware.js'
import {
  uploadParcelForOne,
  uploadParcelGroup,
  uploadParcelAuthorizationForOne,
  uploadParcelGroupAuthorization
} from './upload.js'
import { getParcels } from './routes/get-parcels.js'
import { getParcelStatusForRecipient } from './routes/get-parcel-status-for-recipient.js'
import { downloadParcel } from './routes/download-parcel.js'
import { deleteParcel } from './routes/delete-parcel.js'

export const parcelsRouter = express.Router()

parcelsRouter.use(signatureMiddleware)

const parseFile = multer({ dest: process.env.PARCEL_ATTACHMENTS_UPLOAD_PATH })

/**
 * --------------
 * For the sender
 * --------------
 */
parcelsRouter.post('/:recipient', uploadParcelAuthorizationForOne, parseFile.single('attachment'), uploadParcelForOne)
parcelsRouter.post('/group/:recipients', uploadParcelGroupAuthorization, parseFile.single('attachment'), uploadParcelGroup)
parcelsRouter.get('/:recipient/accepts', uploadParcelAuthorizationForOne, (_, response) => response.sendStatus(200))
parcelsRouter.get('/:recipient/status', getParcelStatusForRecipient)

/**
 * -----------------
 * For the recipient (who is signed up on this inbox server)
 * -----------------
 */
parcelsRouter.get('/', getParcels)
parcelsRouter.get('/:uuid/attachment', downloadParcel)
parcelsRouter.delete('/:uuid', deleteParcel)
