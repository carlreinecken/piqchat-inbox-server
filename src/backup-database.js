import { exec } from 'child_process'
import dotenv from 'dotenv'
dotenv.config()

export function backupDatabase () {
  const date = (new Date()).toISOString().split('T')[0]
  const databaseBackupPathPrefix = 'backup/database-backup-'

  const backupCommand = `sqlite3 ${process.env.DATABASE_PATH} ".backup ${databaseBackupPathPrefix}${date}.sqlite"`

  executeCommand(backupCommand)

  const cleanupCommand = `find ./${databaseBackupPathPrefix}*.sqlite -mtime +7 -type f -delete`

  executeCommand(cleanupCommand)
}

function executeCommand (command) {
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(error)
      return
    }

    if (stdout) {
      console.log(stdout)
    }

    if (stderr) {
      console.error(stderr)
    }
  })
}

backupDatabase()
