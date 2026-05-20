import { Router } from 'express'

export const webhooksRouter = Router()

// Incoming webhook endpoint for external integrations
webhooksRouter.post('/:workspaceId/:channelId', async (req, res) => {
  try {
    const { text, username, icon_emoji } = req.body
    if (!text) return res.status(400).json({ error: 'text required' })

    // Store message as bot/webhook user
    const { db } = await import('../services/firebase')
    const admin = (await import('../services/firebase')).default

    await db().collection('messages').add({
      channelId: req.params.channelId,
      workspaceId: req.params.workspaceId,
      userId: 'webhook-bot',
      text,
      botName: username ?? 'Webhook',
      botEmoji: icon_emoji ?? '🤖',
      isBot: true,
      attachments: [],
      reactions: [],
      replyCount: 0,
      replyUserIds: [],
      threadId: null,
      parentId: null,
      isEdited: false,
      editedAt: null,
      isPinned: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: 'Webhook failed' })
  }
})
