import db from '../database.js'
import { CLEANUP_INACTIVE_USERS_AFTER_DAYS } from '../constants.js'
import { deleteUserAndEverythingAttached } from './delete-user-and-everything-attached.js'

export function cleanupInactiveUsers () {
  const selectUsersStatement = db.prepare(`
    SELECT uuid
    FROM users
    WHERE created_at < date('now', @dateModifier)
      AND uuid IS NOT NULL
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
