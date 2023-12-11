import { deleteUserAndEverythingAttached } from '../delete-user-and-everything-attached.js'

export function deleteAccount (request, response) {
  try {
    const isSuccessfull = deleteUserAndEverythingAttached(request.currentUserUuid)

    if (!isSuccessfull) {
      return response.sendStatus(403)
    }

    response.sendStatus(204)
  } catch (error) {
    console.error(error)
    response.sendStatus(400)
  }
}
