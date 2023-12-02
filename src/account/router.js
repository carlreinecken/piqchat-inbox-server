import express from 'express'
import signatureMiddleware from '../signature-middleware.js'
import { getAccount } from './routes/get-account.js'
import { updateAccountContacts } from './routes/update-account-contacts.js'
import { registerPushSubscription } from './routes/register-push-subscription.js'
import { getProfileBackup } from './routes/get-profile-backup.js'
import { updateProfileBackup } from './routes/update-profile-backup.js'
import { getInvitedUsers } from './routes/get-invited-users.js'
import { deleteAccount } from './routes/delete-account.js'

export const accountRouter = express.Router()

accountRouter.use(signatureMiddleware)

accountRouter.get('/', getAccount)
accountRouter.post('/contacts', updateAccountContacts)
accountRouter.post('/push-subscriptions', registerPushSubscription)
accountRouter.get('/backup', getProfileBackup)
accountRouter.post('/backup', updateProfileBackup)
accountRouter.get('/invited-users', getInvitedUsers)
accountRouter.delete('/', deleteAccount)

// @deprecated
accountRouter.post('/delete', deleteAccount)
