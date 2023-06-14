import db from './database.js'

export function getAccount (request, response) {
  const selectStatement = db.prepare(`
    SELECT push_subscription_json
    FROM users
    WHERE uuid = @uuid
  `)

  try {
    const user = selectStatement.get({ uuid: request.currentUserUuid })

    if (!user) {
      response.sendStatus(404)
      return
    }

    const pushSubscription = user.push_subscription_json && JSON.parse(user.push_subscription_json)
    const hasPushSubscription = typeof pushSubscription === 'object' && Object.keys(pushSubscription).length > 0

    response.send({
      hasPushSubscription
    })
  } catch (error) {
    console.error(error)
    response.sendStatus(400)
  }
}

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

export function registerPushSubscription (request, response) {
  const updateStatement = db.prepare(`
    UPDATE users SET push_subscription_json = @subscription
    WHERE uuid = @uuid
  `)

  try {
    updateStatement.run({
      subscription: JSON.stringify({
        endpoint: request.body.endpoint,
        keys: request.body.keys
      }),
      uuid: request.currentUserUuid
    })

    response.sendStatus(204)
  } catch (error) {
    console.error(error)
    response.sendStatus(400)
  }
}

export function getProfileBackup (request, response) {
  const selectStatement = db.prepare(`
    SELECT content, updated_at, last_read_at
    FROM profile_backups
    WHERE user_uuid = @user_uuid
  `)

  try {
    const backup = selectStatement.get({ user_uuid: request.currentUserUuid })

    if (!backup) {
      response.sendStatus(404)
      return
    }

    response.send({
      updatedAt: backup.updated_at,
      lastReadAt: backup.last_read_at,
      backup: backup.content
    })
  } catch (error) {
    console.error(error)
    response.sendStatus(400)
  }
}

export function updateProfileBackup (request, response) {
  const updateStatement = db.prepare(`
    UPDATE profile_backups
    SET content = @content, updated_at = @updated_at
    WHERE user_uuid = @user_uuid
  `)

  const insertStatement = db.prepare(`
    INSERT INTO profile_backups (user_uuid, content, updated_at)
    VALUES (@user_uuid, @content, @updated_at)
  `)

  try {
    const values = {
      user_uuid: request.currentUserUuid,
      content: request.body.backup,
      updated_at: (new Date()).toISOString()
    }

    const updateResult = updateStatement.run(values)

    if (updateResult.changes === 0) {
      insertStatement.run(values)
    }

    response.sendStatus(204)
  } catch (error) {
    console.error(error)
    response.sendStatus(400)
  }
}
