import db from '../database.js'
import { CLEANUP_INACTIVE_USERS_AFTER_DAYS } from '../constants.js'
import { deleteUserAndEverythingAttached } from './delete-user-and-everything-attached.js'

export function cleanupInactiveUsers () {
  const selectUsersStatement = db.prepare(`
    SELECT uuid
    FROM users
    WHERE uuid IS NOT NULL
      AND (
        client_last_seen_at < date('now', @dateModifier)
        OR (client_last_seen_at IS NULL AND created_at < date('now', @dateModifier))
      )
  `)

  const userRows = selectUsersStatement.all({
    dateModifier: `-${CLEANUP_INACTIVE_USERS_AFTER_DAYS} days`
  })

  let successCount = 0

  for (const user of userRows) {
    if (deleteUserAndEverythingAttached(user.uuid)) {
      successCount++
    }
  }

  if (successCount > 0) {
    console.log(`Cleanup deleted ${successCount} user(s) which were not active in the last ${CLEANUP_INACTIVE_USERS_AFTER_DAYS} days`)
  }
}
