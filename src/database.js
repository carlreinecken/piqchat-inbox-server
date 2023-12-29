import Database from 'better-sqlite3'
import * as dotenv from 'dotenv'
import { DEPLOYMENT_DEFAULTS } from './constants.js'

dotenv.config()

export default new Database(process.env.DATABASE_PATH ?? DEPLOYMENT_DEFAULTS.DATABASE_PATH)
