const TIME_TO_ACCEPT_IN_MINUTES = process.env.CONTACT_EXCHANGE_TIME_TO_LIVE_IN_MIN || 10

export function calculateTimeToAcceptUntil (createdAt) {
  return new Date(createdAt.getTime() + TIME_TO_ACCEPT_IN_MINUTES * 60 * 1000)
}
