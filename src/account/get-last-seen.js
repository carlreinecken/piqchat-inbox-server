import db from '../database.js'

export function getLastSeen (userUuid) {
  const lastSeenStatement = db.prepare(`
    SELECT client_last_seen_at
    FROM users
    WHERE uuid = @userUuid
      AND created_at IS NOT NULL
  `)

  const lastSeenDate = lastSeenStatement.get({ userUuid })?.client_last_seen_at

  return lastSeenDateToLabel(lastSeenDate)
}

export function lastSeenDateToLabel (date) {
  let lastSeen = 'NEVER'

  if (date) {
    const daysSinceLastActivity = (Date.now() - (new Date(date))) / 1000 / 60 / 60 / 24

    if (daysSinceLastActivity > 31) {
      lastSeen = 'LONG_TIME'
    } else if (daysSinceLastActivity > 7) {
      lastSeen = 'WITHIN_MONTH'
    } else if (daysSinceLastActivity > 2) {
      lastSeen = 'WITHIN_WEEK'
    } else {
      lastSeen = 'RECENTLY'
    }
  }

  return lastSeen
}
