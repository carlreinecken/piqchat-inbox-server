import Database from 'better-sqlite3'
import * as dotenv from 'dotenv'

dotenv.config()

export default new Database(process.env.DATABASE_PATH)
