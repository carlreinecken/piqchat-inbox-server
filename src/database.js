import Database from 'better-sqlite3'
import * as dotenv from 'dotenv'

dotenv.config()

// db.pragma('journal_mode = WAL');
export default new Database(process.env.DATABASE_PATH)
