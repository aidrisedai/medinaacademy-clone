import { Router } from 'express'
import { db } from '../services/firebase'
import { requireAuth, AuthRequest } from '../middleware/auth'

export const searchRouter = Router()

// Full-text search across messages
searchRouter.get('/messages', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { q, workspaceId, channelId, limit = '25' } = req.query
    if (!q || typeof q !== 'string') return res.status(400).json({ error: 'Query required' })

    const query = q.toLowerCase().trim()

    // Firestore doesn't have full-text search natively.
    // This is a simple prefix/contains search. For production, use Algolia or Elasticsearch.
    let dbQuery = db().collection('messages').where('workspaceId', '==', workspaceId ?? 'demo-workspace')

    if (channelId) dbQuery = dbQuery.where('channelId', '==', channelId)

    const snap = await dbQuery.orderBy('createdAt', 'desc').limit(200).get()

    const results = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((m: { text?: string }) => m.text?.toLowerCase().includes(query))
      .slice(0, Number(limit))

    res.json(results)
  } catch (err) {
    res.status(500).json({ error: 'Search failed' })
  }
})

// Search channels
searchRouter.get('/channels', requireAuth, async (req, res) => {
  try {
    const { q, workspaceId } = req.query
    if (!q || typeof q !== 'string') return res.status(400).json({ error: 'Query required' })

    const snap = await db()
      .collection('channels')
      .where('workspaceId', '==', workspaceId ?? 'demo-workspace')
      .where('isArchived', '==', false)
      .get()

    const query = q.toLowerCase()
    const results = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((c: { name?: string; description?: string }) =>
        c.name?.toLowerCase().includes(query) || c.description?.toLowerCase().includes(query)
      )

    res.json(results)
  } catch (err) {
    res.status(500).json({ error: 'Search failed' })
  }
})

// Search users
searchRouter.get('/users', requireAuth, async (req, res) => {
  try {
    const { q } = req.query
    if (!q || typeof q !== 'string') return res.status(400).json({ error: 'Query required' })

    const snap = await db().collection('users').get()
    const query = q.toLowerCase()

    const results = snap.docs
      .map((d) => ({ uid: d.id, ...d.data() }))
      .filter((u: { displayName?: string; email?: string }) =>
        u.displayName?.toLowerCase().includes(query) || u.email?.toLowerCase().includes(query)
      )

    res.json(results)
  } catch (err) {
    res.status(500).json({ error: 'Search failed' })
  }
})
