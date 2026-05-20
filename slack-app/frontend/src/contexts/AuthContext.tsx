import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from '@/config/firebase'
import type { User } from '@/types'

interface AuthContextValue {
  user: User | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
  updateUserProfile: (data: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser)
      if (fbUser) {
        const profile = await getOrCreateUserProfile(fbUser)
        setUser(profile)
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function getOrCreateUserProfile(fbUser: FirebaseUser): Promise<User> {
    const ref = doc(db, 'users', fbUser.uid)
    const snap = await getDoc(ref)

    if (snap.exists()) {
      const data = snap.data()
      await setDoc(ref, { lastSeen: serverTimestamp(), status: 'online' }, { merge: true })
      return { ...data, uid: fbUser.uid } as User
    }

    const newUser: Omit<User, 'uid'> = {
      email: fbUser.email ?? '',
      displayName: fbUser.displayName ?? fbUser.email?.split('@')[0] ?? 'User',
      photoURL: fbUser.photoURL,
      status: 'online',
      createdAt: new Date(),
      lastSeen: new Date(),
    }

    await setDoc(ref, { ...newUser, createdAt: serverTimestamp(), lastSeen: serverTimestamp() })
    return { ...newUser, uid: fbUser.uid }
  }

  async function signInWithGoogle() {
    await signInWithPopup(auth, googleProvider)
  }

  async function signInWithEmail(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function signUpWithEmail(email: string, password: string, displayName: string) {
    const { user: fbUser } = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(fbUser, { displayName })
  }

  async function logout() {
    if (user) {
      await setDoc(doc(db, 'users', user.uid), { status: 'offline', lastSeen: serverTimestamp() }, { merge: true })
    }
    await signOut(auth)
  }

  async function updateUserProfile(data: Partial<User>) {
    if (!user) return
    await setDoc(doc(db, 'users', user.uid), data, { merge: true })
    setUser((prev) => (prev ? { ...prev, ...data } : null))
  }

  return (
    <AuthContext.Provider
      value={{ user, firebaseUser, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, logout, updateUserProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
