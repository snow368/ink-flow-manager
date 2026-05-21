# ── Ink Flow Manager Deploy ──
# Requires: wrangler CLI, Cloudflare login, Git

set -e

# 1. Build frontend
echo "=== Building frontend ==="
cd D:/ink-flow-manager
npm run build

# 2. Deploy to Cloudflare Pages
echo "=== Deploying frontend to Cloudflare Pages ==="
npx wrangler pages deploy dist/ --project-name ink-flow

# 3. Deploy backend Worker
echo "=== Deploying backend Worker ==="
cd D:/ink-flow-backend

# First-time setup (uncomment and run once):
# npx wrangler secret put API_SECRET
# npx wrangler secret put TWILIO_SID
# npx wrangler secret put TWILIO_TOKEN
# npx wrangler secret put TWILIO_FROM
# npx wrangler secret put BREVO_API_KEY

npx wrangler deploy

echo "=== Deploy complete ==="
