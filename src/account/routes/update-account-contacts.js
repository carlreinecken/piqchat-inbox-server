import db from '../../database.js'

export function updateAccountContacts (request, response) {
  const updateStatement = db.prepare(`
    UPDATE users SET contacts_json = @contacts
    WHERE uuid = @uuid
  `)

  try {
    updateStatement.run({
      uuid: request.currentUserUuid,
      contacts: JSON.stringify(request.body.contacts)
    })

    response.sendStatus(204)
  } catch (error) {
    console.error(error)
    response.sendStatus(400)
  }
}
