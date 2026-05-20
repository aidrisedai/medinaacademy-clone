# SlackApp — Self-Hosted Slack on Google Cloud

A production-ready, feature-complete Slack alternative built with React, Firebase, and Node.js — deployable to Google Cloud Run in minutes.

## ✨ Features

| Category | Features |
|---|---|
| **Messaging** | Real-time channels, Direct messages, Threads, Edit & delete |
| **Reactions** | Emoji picker, Reaction counters, Toggle reactions |
| **Files** | Image uploads, File attachments, Inline previews |
| **Channels** | Public / Private, Create, Archive, Topic & description |
| **Users** | Google Sign-In, Email/password auth, Presence (online/away/DND) |
| **UI** | Typing indicators, Unread badges, Smooth animations, Responsive |
| **Search** | Message search, Channel search, User search |
| **Infrastructure** | Docker, Cloud Run, Cloud Build CI/CD, Firestore, Firebase Storage |

## 🏗 Architecture

```
┌────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│  React + Vite  │────▶│  Express API    │────▶│  Firebase Admin  │
│  (Cloud Run)   │     │  (Cloud Run)    │     │  (Firestore +    │
│  Port 8080     │     │  Port 4000      │     │   Storage)       │
└────────────────┘     └─────────────────┘     └──────────────────┘
        │                                               │
        └───────────────── Firebase SDK ────────────────┘
                        (Auth + Firestore realtime)
```

**Stack:**
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Framer Motion
- **Backend:** Node.js, Express, Firebase Admin SDK
- **Database:** Firebase Firestore (real-time, offline-capable)
- **Auth:** Firebase Authentication (Google + Email/Password)
- **Storage:** Firebase Storage (avatars, attachments)
- **Hosting:** Google Cloud Run (auto-scaling, pay-per-use)
- **CI/CD:** Google Cloud Build

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 20+
- Firebase project ([create one free](https://console.firebase.google.com))
- Google Cloud project (for deployment)

### 2. Firebase Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Create a Firebase project (or use existing)
firebase projects:create your-project-id
```

In Firebase Console:
1. **Authentication** → Sign-in method → Enable **Google** and **Email/Password**
2. **Firestore** → Create database (production mode)
3. **Storage** → Get started
4. **Project Settings** → Add a **Web app** → copy config values

Deploy Firestore rules and indexes:
```bash
cd slack-app
firebase deploy --only firestore:rules,firestore:indexes,storage --project your-project-id
```

### 3. Local Development

```bash
cd slack-app

# Install dependencies
npm install

# Copy and fill environment variables
cp .env.example .env
# Edit .env with your Firebase config

# Start both frontend and backend
npm run dev
```

Visit `http://localhost:3000`

### 4. Deploy to Google Cloud

```bash
# Set your project
export GCP_PROJECT_ID=your-gcp-project-id

# Enable required APIs
gcloud services enable run.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com

# Store Firebase service account as a secret
gcloud secrets create firebase-service-account \
  --data-file=path/to/serviceAccountKey.json

# Run deployment
chmod +x infra/deploy.sh
./infra/deploy.sh --project $GCP_PROJECT_ID --region us-central1
```

### 5. CI/CD with Cloud Build

Connect your GitHub repo to Cloud Build:

```bash
# Submit a manual build
gcloud builds submit --config infra/cloudbuild.yaml \
  --project $GCP_PROJECT_ID \
  --substitutions _FIREBASE_API_KEY=...,_FIREBASE_PROJECT_ID=...
```

Or connect GitHub for automatic builds on every push.

## 📁 Project Structure

```
slack-app/
├── frontend/                 # React SPA
│   └── src/
│       ├── components/
│       │   ├── auth/         # Login page
│       │   ├── chat/         # ChannelView, MessageList, Message, Thread
│       │   ├── layout/       # Sidebar, AppLayout
│       │   ├── modals/       # CreateChannel
│       │   └── ui/           # Avatar, Modal, Tooltip
│       ├── contexts/         # AuthContext, WorkspaceContext
│       ├── hooks/            # useMessages, useUsers
│       └── config/           # firebase.ts
├── backend/                  # Express API
│   └── src/
│       ├── routes/           # users, channels, messages, search, webhooks
│       ├── middleware/        # auth.ts
│       └── services/         # firebase.ts (Admin SDK)
└── infra/                    # Infrastructure
    ├── Dockerfile.frontend
    ├── Dockerfile.backend
    ├── nginx.conf
    ├── cloudbuild.yaml       # Google Cloud Build CI/CD
    ├── firestore.rules
    ├── firestore.indexes.json
    ├── storage.rules
    ├── firebase.json
    └── deploy.sh             # One-click GCP deployment
```

## 🔒 Security

- Firestore security rules enforce auth and ownership
- Firebase Storage rules limit file sizes and types
- Backend validates all requests with Firebase ID tokens
- Rate limiting on all API endpoints (500 req/15min)
- Helmet.js security headers
- Non-root Docker containers
- Secrets managed via Google Secret Manager

## 💰 Google Cloud Cost Estimate

With Cloud Run's generous free tier:

| Service | Free Tier | Typical Cost |
|---|---|---|
| Cloud Run (frontend) | 2M requests/month | ~$0 for small teams |
| Cloud Run (backend) | 2M requests/month | ~$0 for small teams |
| Firestore | 1GB storage, 50K reads/day | $0–$5/month |
| Firebase Storage | 5GB | $0–$1/month |
| Cloud Build | 120 min/day | $0 |

**Total for a 10-person team: ~$0–$10/month**

## 🔧 Incoming Webhooks

Post messages programmatically:

```bash
curl -X POST https://your-backend.run.app/api/webhooks/WORKSPACE_ID/CHANNEL_ID \
  -H "Content-Type: application/json" \
  -d '{"text": "Deploy successful! 🚀", "username": "CI Bot", "icon_emoji": "🤖"}'
```

## 📱 Mobile Support

The app is fully responsive and works on mobile browsers. For native mobile apps, the Firebase SDK supports iOS and Android.
