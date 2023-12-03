import db from '../database.js'
import { CLEANUP_CONTACT_EXCHANGES_AFTER_DAYS } from '../constants.js'

export function cleanupContactExchanges () {
  const deleteStatement = db.prepare(`
    DELETE FROM contact_exchanges
    WHERE created_at < date('now', $dateModifier)
  `)

  const result = deleteStatement.run({
    dateModifier: `-${CLEANUP_CONTACT_EXCHANGES_AFTER_DAYS} days`
  })

  if (result.changes > 0) {
    console.log(`Cleanup deleted ${result.changes} contact_exchange(s)`)
  }
}
