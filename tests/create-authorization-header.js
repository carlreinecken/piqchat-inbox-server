import tweetnacl from 'tweetnacl'
import tweetnaclUtil from 'tweetnacl-util'

export function createAuthorizationHeader (keyPair) {
  const keyId = tweetnaclUtil.encodeBase64(keyPair.publicKey)

  const nonce = tweetnacl.randomBytes(tweetnacl.box.nonceLength)
  const date = (new Date()).toISOString()

  const signature = tweetnacl.box(
    new TextEncoder('utf-8').encode(date),
    nonce,
    tweetnaclUtil.decodeBase64(process.env.API_PUBLIC_KEY),
    keyPair.secretKey
  )

  const signatureAndNonce = new Uint8Array(signature.length + nonce.length)
  signatureAndNonce.set(nonce)
  signatureAndNonce.set(signature, nonce.length)

  const nonceAndSignature = tweetnaclUtil.encodeBase64(signatureAndNonce)

  return {
    Authorization: `Signature keyId="${keyId}",headers="x-date",signature="${nonceAndSignature}"`,
    'X-Date': date
  }
}
