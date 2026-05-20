import admin from 'firebase-admin'

let initialized = false

export function initFirebase() {
  if (initialized) return

  const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS
    ? undefined
    : process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    : undefined

  admin.initializeApp({
    credential: serviceAccount
      ? admin.credential.cert(serviceAccount)
      : admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  })

  initialized = true
  console.log('Firebase Admin initialized')
}

export const db = () => admin.firestore()
export const auth = () => admin.auth()
export const storage = () => admin.storage()
export default admin
