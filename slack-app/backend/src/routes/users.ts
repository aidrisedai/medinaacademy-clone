import { Router } from 'express'
import { z } from 'zod'
import { db } from '../services/firebase'
import { requireAuth, AuthRequest } from '../middleware/auth'

export const usersRouter = Router()

// Get all users in workspace
usersRouter.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const snap = await db().collection('users').get()
    const users = snap.docs.map((d) => ({ uid: d.id, ...d.data() }))
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

// Get current user profile
usersRouter.get('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const doc = await db().collection('users').doc(req.userId!).get()
    if (!doc.exists) return res.status(404).json({ error: 'User not found' })
    res.json({ uid: doc.id, ...doc.data() })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' })
  }
})

// Update user profile
const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(80).optional(),
  statusText: z.string().max(100).optional(),
  statusEmoji: z.string().max(10).optional(),
  status: z.enum(['online', 'away', 'dnd', 'offline']).optional(),
})

usersRouter.patch('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const data = updateProfileSchema.parse(req.body)
    await db().collection('users').doc(req.userId!).update({
      ...data,
      updatedAt: new Date(),
    })
    res.json({ success: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors })
    }
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

// Get user by ID
usersRouter.get('/:userId', requireAuth, async (req, res) => {
  try {
    const doc = await db().collection('users').doc(req.params.userId).get()
    if (!doc.exists) return res.status(404).json({ error: 'User not found' })
    res.json({ uid: doc.id, ...doc.data() })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' })
  }
})
