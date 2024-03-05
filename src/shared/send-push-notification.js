import webpush from 'web-push'
import db from '../database.js'

export async function sendPushNotification (recipientUuid, payload) {
  const vapidDetails = {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY,
    subject: process.env.PUSH_VAPID_CONTACT
  }

  const selectUserStatement = db.prepare(`
    SELECT push_subscription_json FROM users WHERE uuid = @recipientUuid
  `)

  const updatePushSubscriptionStatement = db.prepare(`
    UPDATE users SET push_subscription_json = @subscription
    WHERE uuid = @recipientUuid
  `)

  const user = selectUserStatement.get({ recipientUuid })
  const subscription = parsePushSubscription(user.push_subscription_json)

  if (!subscription) {
    return
  }

  const options = {
    TTL: 60 * 60 * 24 * process.env.PUSH_TIME_TO_LIVE_ON_SERVICE_IN_DAYS,
    vapidDetails,
    contentEncoding: subscription?.encoding
  }

  try {
    await webpush.sendNotification(subscription, payload, options)
  } catch (error) {
    if (error.statusCode === 404 || error.statusCode === 410) {
      updatePushSubscriptionStatement.run({
        subscription: JSON.stringify({}),
        recipientUuid
      })
    } else {
      console.log(`sendPushNotification failed with "${error?.statusCode || error}" with recipient ${recipientUuid.substring(0, 5)}...`)
    }
  }
}

export function parsePushSubscription (pushSubscriptionJson) {
  const subscription = pushSubscriptionJson && JSON.parse(pushSubscriptionJson)

  if (typeof subscription === 'object' && Object.keys(subscription).length > 0) {
    return subscription
  }

  return null
}
