import { Router } from 'express'
import { z } from 'zod'
import { db } from '../services/firebase'
import { requireAuth, AuthRequest } from '../middleware/auth'
import admin from 'firebase-admin'

export const messagesRouter = Router()

// Get messages for a channel
messagesRouter.get('/', requireAuth, async (req, res) => {
  try {
    const { channelId, limit = '50', before } = req.query

    if (!channelId) return res.status(400).json({ error: 'channelId required' })

    let q = db()
      .collection('messages')
      .where('channelId', '==', channelId)
      .where('parentId', '==', null)
      .orderBy('createdAt', 'desc')
      .limit(Number(limit))

    if (before) {
      const beforeDoc = await db().collection('messages').doc(before as string).get()
      if (beforeDoc.exists) q = q.startAfter(beforeDoc)
    }

    const snap = await q.get()
    const messages = snap.docs.map((d) => ({ id: d.id, ...d.data() })).reverse()
    res.json(messages)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
})

// Send a message
const sendMessageSchema = z.object({
  channelId: z.string(),
  workspaceId: z.string(),
  text: z.string().min(1).max(40000),
  attachments: z.array(z.any()).optional().default([]),
  parentId: z.string().nullable().optional().default(null),
})

messagesRouter.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const data = sendMessageSchema.parse(req.body)
    const ref = await db().collection('messages').add({
      ...data,
      userId: req.userId,
      reactions: [],
      replyCount: 0,
      replyUserIds: [],
      threadId: data.parentId,
      isEdited: false,
      editedAt: null,
      isPinned: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    if (data.parentId) {
      await db().collection('messages').doc(data.parentId).update({
        replyCount: admin.firestore.FieldValue.increment(1),
        replyUserIds: admin.firestore.FieldValue.arrayUnion(req.userId),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    }

    await db().collection('channels').doc(data.channelId).update({
      lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    const doc = await ref.get()
    res.status(201).json({ id: ref.id, ...doc.data() })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors })
    }
    res.status(500).json({ error: 'Failed to send message' })
  }
})

// Edit message
messagesRouter.patch('/:messageId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { text } = z.object({ text: z.string().min(1).max(40000) }).parse(req.body)
    const doc = await db().collection('messages').doc(req.params.messageId).get()

    if (!doc.exists) return res.status(404).json({ error: 'Message not found' })
    if (doc.data()?.userId !== req.userId) return res.status(403).json({ error: 'Forbidden' })

    await db().collection('messages').doc(req.params.messageId).update({
      text,
      isEdited: true,
      editedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to edit message' })
  }
})

// Delete message
messagesRouter.delete('/:messageId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const doc = await db().collection('messages').doc(req.params.messageId).get()
    if (!doc.exists) return res.status(404).json({ error: 'Message not found' })
    if (doc.data()?.userId !== req.userId) return res.status(403).json({ error: 'Forbidden' })

    await db().collection('messages').doc(req.params.messageId).delete()
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete message' })
  }
})

// Toggle reaction
messagesRouter.post('/:messageId/reactions', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { emoji } = z.object({ emoji: z.string().max(10) }).parse(req.body)
    const msgRef = db().collection('messages').doc(req.params.messageId)
    const doc = await msgRef.get()

    if (!doc.exists) return res.status(404).json({ error: 'Message not found' })

    const reactions = doc.data()?.reactions ?? []
    const existing = reactions.find((r: { emoji: string }) => r.emoji === emoji)

    if (existing) {
      if (existing.userIds.includes(req.userId)) {
        const updated = existing.userIds.filter((id: string) => id !== req.userId)
        if (updated.length === 0) {
          await msgRef.update({ reactions: reactions.filter((r: { emoji: string }) => r.emoji !== emoji) })
        } else {
          await msgRef.update({
            reactions: reactions.map((r: { emoji: string; userIds: string[]; count: number }) =>
              r.emoji === emoji ? { ...r, count: updated.length, userIds: updated } : r
            ),
          })
        }
      } else {
        await msgRef.update({
          reactions: reactions.map((r: { emoji: string; userIds: string[]; count: number }) =>
            r.emoji === emoji
              ? { ...r, count: r.count + 1, userIds: [...r.userIds, req.userId] }
              : r
          ),
        })
      }
    } else {
      await msgRef.update({
        reactions: admin.firestore.FieldValue.arrayUnion({ emoji, count: 1, userIds: [req.userId] }),
      })
    }

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle reaction' })
  }
})

// Get thread replies
messagesRouter.get('/:messageId/replies', requireAuth, async (req, res) => {
  try {
    const snap = await db()
      .collection('messages')
      .where('parentId', '==', req.params.messageId)
      .orderBy('createdAt', 'asc')
      .get()

    res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch replies' })
  }
})

// Pin/unpin message
messagesRouter.post('/:messageId/pin', requireAuth, async (req, res) => {
  try {
    const doc = await db().collection('messages').doc(req.params.messageId).get()
    if (!doc.exists) return res.status(404).json({ error: 'Message not found' })

    const isPinned = !doc.data()?.isPinned
    await db().collection('messages').doc(req.params.messageId).update({ isPinned })
    res.json({ isPinned })
  } catch (err) {
    res.status(500).json({ error: 'Failed to pin message' })
  }
})
