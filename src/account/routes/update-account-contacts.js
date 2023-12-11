import db from '../../database.js'

export function updateAccountContacts (request, response) {
  try {
    const updateStatement = db.prepare(`
      UPDATE users SET contacts_json = @contacts
      WHERE uuid = @uuid
    `)

    const result = updateStatement.run({
      uuid: request.currentUserUuid,
      contacts: JSON.stringify(request.body.contacts)
    })

    if (result.changes === 0) {
      return response.sendStatus(403)
    }

    response.sendStatus(204)
  } catch (error) {
    console.error(error)
    response.sendStatus(400)
  }
}
