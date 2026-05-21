# ── Ink Flow Manager Deploy ──

# 1. Build frontend
echo "=== Building frontend ==="
cd D:/ink-flow-manager
npm run build

# 2. Deploy backend Worker
echo "=== Deploying backend Worker ==="
cd D:/ink-flow-backend

# Set secrets first (only needed once):
# npx wrangler secret put API_SECRET
# npx wrangler secret put TWILIO_SID
# npx wrangler secret put TWILIO_TOKEN
# npx wrangler secret put TWILIO_FROM
# npx wrangler secret put BREVO_API_KEY

npx wrangler deploy

echo "=== Deploy complete ==="
echo "Frontend dist: D:/ink-flow-manager/dist"
echo "Upload to Cloudflare Pages manually or setup Git integration."
