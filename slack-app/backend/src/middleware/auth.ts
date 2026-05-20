import { Request, Response, NextFunction } from 'express'
import { auth } from '../services/firebase'

export interface AuthRequest extends Request {
  userId?: string
  userEmail?: string
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const token = header.slice(7)
  try {
    const decoded = await auth().verifyIdToken(token)
    req.userId = decoded.uid
    req.userEmail = decoded.email
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}
