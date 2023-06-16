export function getInfo (_, response) {
  response.send({
    publicKey: process.env.API_PUBLIC_KEY,
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
    adminDisplayName: process.env.ADMIN_DISPLAY_NAME
  })
}
