import webpush from 'web-push'
import tweetnacl from 'tweetnacl'
import tweetnaclUtil from 'tweetnacl-util'

const vapidKeys = webpush.generateVAPIDKeys()
const keyPair = tweetnacl.box.keyPair()

console.log(`API_PUBLIC_KEY="${tweetnaclUtil.encodeBase64(keyPair.publicKey)}"`)
console.log(`API_PRIVATE_KEY="${tweetnaclUtil.encodeBase64(keyPair.secretKey)}"`)
console.log('')
console.log(`VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"`)
console.log(`VAPID_PRIVATE_KEY="${vapidKeys.privateKey}"`)
