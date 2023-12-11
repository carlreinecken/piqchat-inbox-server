import tweetnacl from 'tweetnacl'
import tweetnaclUtil from 'tweetnacl-util'

/*
 * Expects a header that looks like this:
 *
 *    Authorization: Signature keyId="Base64(<publicKey>)",headers="x-date",signature="Base64(tweetnacl.box(<signing string>)),nonce=Base64(<nonce>)"
 *
 * This tries to be compatible with the IETF draft: https://datatracker.ietf.org/doc/html/draft-cavage-http-signatures-12
 * However the algorithm is hardcoded to always use the tweetnacl box (to use its integrity
 * properties of authenticated encryption).
 *
 * The contents of 'headers' is also hardcoded. X-Date is used, because as far as I understand I can't really use the standard 'Date' header it on the client.
 */
export default function (request, response, next) {
  let signature

  try {
    signature = parseAuthorizationSignatureHeader(request.headers.authorization)

    if (signature && validateSignature(signature, request)) {
      request.currentUserUuid = signature.keyId
    } else {
      throw new Error('Invalid Signature')
    }

    next()
  } catch (error) {
    response.status(401).send('Signature is invalid')
    next(new Error('Invalid Signature'))
  }
}

function parseAuthorizationSignatureHeader (header) {
  if (!header) {
    return
  }

  const parameters = header.replace('Signature ', '').split(',')

  const result = {}

  for (const parameterString of parameters) {
    if (parameterString.includes('keyId="')) {
      result.keyId = parameterString.replace('keyId="', '').replace('"', '')
    } else if (parameterString.includes('signature="')) {
      result.signature = parameterString.replace('signature="', '').replace('"', '')
    }
  }

  return result
}

function validateSignature (signaturePackage, request) {
  const nonceAndSignature = tweetnaclUtil.decodeBase64(signaturePackage.signature)
  const nonce = nonceAndSignature.slice(0, tweetnacl.box.nonceLength)
  const signature = nonceAndSignature.slice(tweetnacl.box.nonceLength, nonceAndSignature.length)

  const secretString = tweetnacl.box.open(
    signature,
    nonce,
    tweetnaclUtil.decodeBase64(signaturePackage.keyId),
    tweetnaclUtil.decodeBase64(process.env.API_PRIVATE_KEY)
  )

  const encoded = new TextDecoder('utf-8').decode(secretString)

  // This check should in theory not be necessary. The contents of X-Date could be easily
  // changed by an attacker... I'm just not really sure that you can authenticate
  // with an empty encryption?! I guess why not, it has a nonce..?
  return request.get('X-Date') === encoded
}
