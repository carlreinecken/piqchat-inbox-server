import * as dotenv from 'dotenv'

// NOTE: This needs to run BEFORE any other code runs `new Database()`
dotenv.config({ path: 'test.env', override: true })
