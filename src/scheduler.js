import cron from 'node-cron'
import { backupDatabase } from './backup-database.js'
import { cleanupContactExchanges } from './contact-exchange/cleanup-contact-exchanges.js'
// import { cleanupParcels } from './parcels/cleanup-parcels.js'
import { cleanupInactiveUsers } from './account/cleanup-inactive-users.js'

export function startScheduler () {
  stopScheduler()

  cron.schedule('30 3 * * *', function () {
    try {
      backupDatabase()
    } catch (error) {
      console.error(error)
    }
  })

  cron.schedule('0 4 * * *', function () {
    try {
      // TODO: before find out why some parcels don't get delivered
      // cleanupParcels()
    } catch (error) {
      console.error(error)
    }
  })

  cron.schedule('15 4 * * *', function () {
    try {
      cleanupContactExchanges()
    } catch (error) {
      console.error(error)
    }
  })

  cron.schedule('30 4 * * *', function () {
    try {
      cleanupInactiveUsers()
    } catch (error) {
      console.error(error)
    }
  })
}

export function stopScheduler () {
  cron.getTasks().forEach((task) => task.stop())
}
