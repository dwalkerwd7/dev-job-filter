#!/bin/sh
set -e

# varlock requires a .env file — write one from container environment vars
cat > /app/pipeline/.env <<EOF
MONGODB_URI=${MONGODB_URI}
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
SERPER_API_KEY=${SERPER_API_KEY}
DEMO_SPEED=${DEMO_SPEED:-30}
EOF

cd /app/dashboard
exec node server.js
