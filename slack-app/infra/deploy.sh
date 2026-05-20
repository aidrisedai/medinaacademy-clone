#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# SlackApp — Google Cloud Run deployment script
# Usage: ./infra/deploy.sh [--project <GCP_PROJECT_ID>] [--region <REGION>]
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# Defaults
PROJECT_ID="${GCP_PROJECT_ID:-}"
REGION="${GCP_REGION:-us-central1}"
COMMIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "local")

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --project) PROJECT_ID="$2"; shift 2 ;;
    --region)  REGION="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

if [[ -z "$PROJECT_ID" ]]; then
  echo "Error: GCP_PROJECT_ID not set. Use --project or export GCP_PROJECT_ID=..."
  exit 1
fi

echo "📦 Deploying SlackApp to GCP project: $PROJECT_ID (region: $REGION)"

# Ensure gcloud is authenticated
gcloud auth configure-docker --quiet

# ─── Backend ────────────────────────────────────────────────────────────────
echo ""
echo "🔧 Building & pushing backend..."
docker build \
  -f infra/Dockerfile.backend \
  -t "gcr.io/$PROJECT_ID/slackapp-backend:$COMMIT_SHA" \
  -t "gcr.io/$PROJECT_ID/slackapp-backend:latest" \
  .

docker push "gcr.io/$PROJECT_ID/slackapp-backend:$COMMIT_SHA"
docker push "gcr.io/$PROJECT_ID/slackapp-backend:latest"

echo "🚀 Deploying backend to Cloud Run..."
gcloud run deploy slackapp-backend \
  --image="gcr.io/$PROJECT_ID/slackapp-backend:$COMMIT_SHA" \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --platform=managed \
  --allow-unauthenticated \
  --port=4000 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --concurrency=80 \
  --timeout=60 \
  --set-env-vars="NODE_ENV=production,FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID:-}" \
  --set-secrets="FIREBASE_SERVICE_ACCOUNT_JSON=firebase-service-account:latest" \
  --quiet

BACKEND_URL=$(gcloud run services describe slackapp-backend \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --format="value(status.url)")

echo "✅ Backend deployed: $BACKEND_URL"

# ─── Frontend ───────────────────────────────────────────────────────────────
echo ""
echo "🎨 Building & pushing frontend..."
docker build \
  -f infra/Dockerfile.frontend \
  --build-arg VITE_FIREBASE_API_KEY="${VITE_FIREBASE_API_KEY:-}" \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN="${VITE_FIREBASE_AUTH_DOMAIN:-}" \
  --build-arg VITE_FIREBASE_PROJECT_ID="${VITE_FIREBASE_PROJECT_ID:-}" \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET="${VITE_FIREBASE_STORAGE_BUCKET:-}" \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID="${VITE_FIREBASE_MESSAGING_SENDER_ID:-}" \
  --build-arg VITE_FIREBASE_APP_ID="${VITE_FIREBASE_APP_ID:-}" \
  -t "gcr.io/$PROJECT_ID/slackapp-frontend:$COMMIT_SHA" \
  -t "gcr.io/$PROJECT_ID/slackapp-frontend:latest" \
  .

docker push "gcr.io/$PROJECT_ID/slackapp-frontend:$COMMIT_SHA"
docker push "gcr.io/$PROJECT_ID/slackapp-frontend:latest"

echo "🚀 Deploying frontend to Cloud Run..."
gcloud run deploy slackapp-frontend \
  --image="gcr.io/$PROJECT_ID/slackapp-frontend:$COMMIT_SHA" \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=256Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=5 \
  --concurrency=200 \
  --quiet

FRONTEND_URL=$(gcloud run services describe slackapp-frontend \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --format="value(status.url)")

echo "✅ Frontend deployed: $FRONTEND_URL"

# ─── Setup Load Balancer (optional, for custom domain) ─────────────────────
echo ""
echo "──────────────────────────────────────────────────────"
echo "✅ Deployment complete!"
echo ""
echo "  🌐 Frontend: $FRONTEND_URL"
echo "  🔧 Backend:  $BACKEND_URL"
echo ""
echo "Next steps:"
echo "  1. Update CORS in backend with your frontend URL"
echo "  2. Set up a custom domain via Cloud Run domain mappings"
echo "  3. Configure Firebase Auth authorized domains"
echo "──────────────────────────────────────────────────────"
