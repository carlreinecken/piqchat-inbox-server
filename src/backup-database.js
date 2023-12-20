import { exec } from 'child_process'
import db from './database.js'

export async function backupDatabase () {
  const date = (new Date()).toISOString().split('T')[0]
  const databaseBackupPathPrefix = 'backup/database-backup-'

  await db.backup(`${databaseBackupPathPrefix}${date}.sqlite`)
  console.log(`Database backup ${databaseBackupPathPrefix}${date}.sqlite done.`)

  exec(`find ./${databaseBackupPathPrefix}*.sqlite -mtime +7 -type f -delete`)
}
