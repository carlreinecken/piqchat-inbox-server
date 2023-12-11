import db from '../database.js'

/**
 * Count for total server usage purposes. After 7 days entries are deleted.
 */
export function countReceivedParcels (amount, type) {
  const insertStatement = db.prepare(`
    INSERT INTO parcels_count (date, type)
    VALUES (date(), @type)
  `)

  const cleanupStatement = db.prepare(`
    DELETE FROM parcels_count WHERE date < date('now', '-7 days')
  `)

  for (let i = 0; amount > i; i++) {
    insertStatement.run({ type })
  }

  cleanupStatement.run()
}
