import crypto from 'crypto'

export function createAcceptUrl (host) {
  const oneTimeToken = crypto.randomUUID()

  // NOTE: The protocol may be replaced by the client
  const acceptUrl = `https://${host}/api/contact-exchange/${oneTimeToken}/accept`

  return { oneTimeToken, acceptUrl }
}
