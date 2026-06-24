import { initializeApp, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'

let _auth: Auth | null = null
let _db: Firestore | null = null

try {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
  if (apiKey && apiKey !== 'undefined' && apiKey !== '') {
    const app: FirebaseApp = initializeApp({
      apiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    })
    _auth = getAuth(app)
    _db = getFirestore(app)
  }
} catch (err) {
  console.warn('Firebase init skipped:', err)
}

export const auth = _auth
export const db = _db
