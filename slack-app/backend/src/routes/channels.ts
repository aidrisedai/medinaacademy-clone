import { Router } from 'express'
import { z } from 'zod'
import { db } from '../services/firebase'
import { requireAuth, AuthRequest } from '../middleware/auth'
import admin from 'firebase-admin'

export const channelsRouter = Router()

const createChannelSchema = z.object({
  workspaceId: z.string(),
  name: z.string().min(1).max(80).regex(/^[a-z0-9-_]+$/, 'lowercase letters, numbers, hyphens, underscores only'),
  description: z.string().max(250).optional().default(''),
  isPrivate: z.boolean().optional().default(false),
})

// List channels
channelsRouter.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { workspaceId } = req.query
    if (!workspaceId) return res.status(400).json({ error: 'workspaceId required' })

    const snap = await db()
      .collection('channels')
      .where('workspaceId', '==', workspaceId)
      .where('isArchived', '==', false)
      .orderBy('createdAt', 'asc')
      .get()

    res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch channels' })
  }
})

// Create channel
channelsRouter.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const data = createChannelSchema.parse(req.body)
    const ref = await db().collection('channels').add({
      ...data,
      topic: '',
      isArchived: false,
      createdBy: req.userId,
      members: [req.userId],
      pinnedMessages: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastMessageAt: null,
    })
    const doc = await ref.get()
    res.status(201).json({ id: ref.id, ...doc.data() })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors })
    }
    res.status(500).json({ error: 'Failed to create channel' })
  }
})

// Get channel by ID
channelsRouter.get('/:channelId', requireAuth, async (req, res) => {
  try {
    const doc = await db().collection('channels').doc(req.params.channelId).get()
    if (!doc.exists) return res.status(404).json({ error: 'Channel not found' })
    res.json({ id: doc.id, ...doc.data() })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch channel' })
  }
})

// Update channel
channelsRouter.patch('/:channelId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      name: z.string().min(1).max(80).optional(),
      description: z.string().max(250).optional(),
      topic: z.string().max(250).optional(),
      isArchived: z.boolean().optional(),
    })
    const data = schema.parse(req.body)
    await db().collection('channels').doc(req.params.channelId).update({
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update channel' })
  }
})

// Join channel
channelsRouter.post('/:channelId/join', requireAuth, async (req: AuthRequest, res) => {
  try {
    await db().collection('channels').doc(req.params.channelId).update({
      members: admin.firestore.FieldValue.arrayUnion(req.userId),
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to join channel' })
  }
})

// Leave channel
channelsRouter.post('/:channelId/leave', requireAuth, async (req: AuthRequest, res) => {
  try {
    await db().collection('channels').doc(req.params.channelId).update({
      members: admin.firestore.FieldValue.arrayRemove(req.userId),
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to leave channel' })
  }
})

// Invite user to channel
channelsRouter.post('/:channelId/invite', requireAuth, async (req, res) => {
  try {
    const { userId } = z.object({ userId: z.string() }).parse(req.body)
    await db().collection('channels').doc(req.params.channelId).update({
      members: admin.firestore.FieldValue.arrayUnion(userId),
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to invite user' })
  }
})
