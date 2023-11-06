import db from './database.js'
import { parsePushSubscription } from './account/send-push-notification.js'
import { lastSeenDateToLabel } from './account/get-last-seen.js'
import { deleteParcelsAndAttachmentForUser } from './parcels/delete-parcel.js'

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

    const pushSubscription = parsePushSubscription(user.push_subscription_json)

    response.send({
      hasPushSubscription: pushSubscription != null
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

export function getInvitedUsers (request, response) {
  const selectStatement = db.prepare(`
    SELECT uuid, client_last_seen_at, created_by
    FROM users
    WHERE created_by = @userUuid OR uuid = @userUuid
  `)

  const selectAllStatement = db.prepare(`
    SELECT uuid, client_version, client_last_seen_at, created_by
    FROM users
  `)

  try {
    let rows
    const isAdmin = process.env.ADMIN_UUID != null && process.env.ADMIN_UUID === request.currentUserUuid

    if (isAdmin) {
      rows = selectAllStatement.all()
    } else {
      rows = selectStatement.all({ userUuid: request.currentUserUuid })
    }

    const parcels = rows.map((row) => ({
      id: row.uuid,
      clientVersion: isAdmin ? row.client_version : undefined,
      clientLastSeen: lastSeenDateToLabel(row.client_last_seen_at),
      createdBy: row.created_by
    }))

    response.send(parcels)
  } catch (error) {
    console.error(error)
    response.sendStatus(400)
  }
}

export function deleteProfile (request, response) {
  const deleteBackupStatement = db.prepare(`
    DELETE FROM profile_backups
    WHERE user_uuid = @userUuid
  `)

  const updateUserStatement = db.prepare(`
    UPDATE users SET
      push_subscription_json = '{}',
      contacts_json = '[]',
      client_version = null,
      client_last_seen_at = null,
      created_at = null
    WHERE uuid = @userUuid
  `)

  try {
    deleteParcelsAndAttachmentForUser(request.currentUserUuid)

    deleteBackupStatement.run({ userUuid: request.currentUserUuid })

    // TODO: the users.uuid may count as personal data which also needs to be removed/replaced. however that would currently break the invite tree
    const result = updateUserStatement.run({ userUuid: request.currentUserUuid })

    if (result.changes === 0) {
      return response.sendStatus(404)
    }

    // TODO: remove conctact_exchanges? or is the automatic cleanup enough?

    response.sendStatus(204)
  } catch (error) {
    console.error(error)
    response.sendStatus(400)
  }
}
