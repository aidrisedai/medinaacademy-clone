import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { usersRouter } from './routes/users'
import { channelsRouter } from './routes/channels'
import { messagesRouter } from './routes/messages'
import { searchRouter } from './routes/search'
import { webhooksRouter } from './routes/webhooks'
import { initFirebase } from './services/firebase'

const app = express()
const PORT = process.env.PORT ?? 4000

// Initialize Firebase Admin
initFirebase()

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}))

app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  credentials: true,
}))

// Request parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Logging
app.use(morgan('combined'))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api/', limiter)

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' })
})

// API routes
app.use('/api/users', usersRouter)
app.use('/api/channels', channelsRouter)
app.use('/api/messages', messagesRouter)
app.use('/api/search', searchRouter)
app.use('/api/webhooks', webhooksRouter)

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`🚀 SlackApp Backend running on port ${PORT}`)
})

export default app
