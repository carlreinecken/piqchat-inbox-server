import { isAcceptingFromContact } from '../../account/is-accepting-from-contact.js'

export function getAcceptStatusForRecipient (request, response) {
  try {
    if (!isAcceptingFromContact(request.params.recipient, request.currentUserUuid)) {
      response.sendStatus(403)
      return
    }

    response.sendStatus(200)
  } catch (error) {
    console.error(error)
    response.sendStatus(400)
  }
}
