import db from './database.js'

function getCredentials (header) {
  if (!header) {
    throw new Error('IncorrectCredentials')
  }

  let token = header.replace('Token ', '')
  token = Buffer.from(token, 'base64').toString()

  const [userUuid, sharedSecret] = token.split(':')

  if (!userUuid || userUuid === '' || !sharedSecret || sharedSecret === '') {
    throw new Error('IncorrectCredentials')
  }

  return { userUuid, sharedSecret }
}

function getAccessByUserUuid (userUuid, sharedSecret) {
  const access = db
    .prepare('SELECT shared_secret, user_uuid FROM accesses WHERE user_uuid = ? AND shared_secret = ?')
    .get(userUuid, sharedSecret)

  if (access == null) {
    throw new Error('IncorrectCredentials')
  }

  return { sharedSecret: access.shared_secret, userUuid: access.user_uuid }
}

function middleware (req, res, next) {
  let credentials, access

  try {
    credentials = getCredentials(req.headers.authorization)
    access = getAccessByUserUuid(credentials.userUuid, credentials.sharedSecret)
  } catch (error) {
    res.status(401).json({ error: 'incorrect-credentials', message: 'Credentials are incorrect' })
    next(error)
  }

  if (access) {
    req.currentUserUuid = access.userUuid

    next()
  }

  res.status(500)
}

export default middleware
