import * as fs from 'node:fs'
import * as dotenv from 'dotenv'
import Database from 'better-sqlite3'
import { DEPLOYMENT_DEFAULTS } from '../src/constants.js'

/**
 * Migrate the database.sqlite to the latest version.
 * To keep track of the current version the PRAGMA user_version is used.
 *
 * Run all outstanding sql scripts from ./migrations:
 *   npm run migrate
 *
 * Run all scripts from ./migrations to any specified version number, e.g. 4:
 *   npm run migrate -- 4
 *
 * A "0" completely resets the database.
 *
 * All files with the format "{version}-some-name.sql" inside ./migrations/ are read.
 * Any lines of the sql file will be used as "UP" migration, except the lines
 * that are below a "-- DOWN" comment. For better readability the file should
 * also include an "-- UP" comment in its first line.
 */

const IS_IN_CLI = import.meta.url.includes(process.argv[1])

function getAllMigrations (migrationsPath) {
  const migrations = []

  for (const filename of fs.readdirSync(migrationsPath)) {
    // NOTE: 1-foobar.sql -> version: 1, name: 'foobar'
    const matchGroups = filename.match(/^(\d+)-.*?\.sql$/)

    if (!matchGroups) {
      continue
    }

    migrations.push({
      version: parseInt(matchGroups[1]),
      filename: matchGroups[0]
    })
  }

  migrations.sort((a, b) => a.version - b.version)

  return migrations
}

function populateMigrationsWithSql (direction, migrationsPath) {
  return (migration) => {
    const sqlScript = fs.readFileSync(`${migrationsPath}${migration.filename}`, 'utf8')

    const [up, down] = sqlScript.split(/^--\s+?down\b/im)

    if (direction === 'DIRECTION_UP') {
      migration.sql = up.trim()
    } else if (direction === 'DIRECTION_DOWN') {
      migration.sql = down ? down.trim() : ''
    }

    return migration
  }
}

export function migrate (db, targetVersion = null, migrationsPath = './migrations/') {
  let migrations = getAllMigrations(migrationsPath)
  const lastMigrationVersion = migrations[migrations.length - 1].version

  const currentVersion = db.pragma('user_version', { simple: true })
  targetVersion = targetVersion != null ? parseInt(targetVersion) : lastMigrationVersion

  if (currentVersion < targetVersion) {
    migrations = migrations
      .filter((m) => m.version > currentVersion && m.version <= targetVersion)
      .map(populateMigrationsWithSql('DIRECTION_UP', migrationsPath))
  } else if (currentVersion > targetVersion) {
    migrations = migrations
      .filter((m) => m.version <= currentVersion && m.version > targetVersion)
      .map(populateMigrationsWithSql('DIRECTION_DOWN', migrationsPath))
      .reverse()
  } else {
    if (IS_IN_CLI) console.log('No outstanding migrations.')
    return
  }

  if (IS_IN_CLI) console.log(`Moving from version ${currentVersion} to ${targetVersion}.`)

  db.transaction(function (migrations) {
    for (const migration of migrations) {
      if (IS_IN_CLI) console.log(`Running migration ${migration.filename}...`)
      db.exec(migration.sql)
    }
  })(migrations)

  db.pragma(`user_version = ${targetVersion}`)
}

if (IS_IN_CLI) {
  dotenv.config()

  const db = new Database(process.env.DATABASE_PATH ?? DEPLOYMENT_DEFAULTS.DATABASE_PATH)

  migrate(db, process.argv[2])
}
