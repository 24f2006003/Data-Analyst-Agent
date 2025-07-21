#!/bin/bash

# Deploy script for Data Analyst Agent
echo "🚀 Deploying Data Analyst Agent to Vercel..."

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found. Please create it based on .env.example"
    echo "📋 Required environment variables:"
    echo "   - OPENAI_API_KEY"
    echo "   - OPENAI_BASE_URL"
    exit 1
fi

# Load environment variables
source .env.local

# Check if required environment variables are set
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ OPENAI_API_KEY is not set in .env.local"
    exit 1
fi

if [ -z "$OPENAI_BASE_URL" ]; then
    echo "❌ OPENAI_BASE_URL is not set in .env.local"
    exit 1
fi

echo "✅ Environment variables validated"

# Run tests before deployment
echo "🧪 Running tests..."
npm test
if [ $? -ne 0 ]; then
    echo "❌ Tests failed. Deployment aborted."
    exit 1
fi

echo "✅ Tests passed"

# Deploy to Vercel
echo "📦 Starting deployment..."
vercel --prod

# Set environment variables on Vercel if this is the first deployment
echo "🔧 Setting environment variables..."
vercel env add OPENAI_API_KEY production <<< "$OPENAI_API_KEY"
vercel env add OPENAI_BASE_URL production <<< "$OPENAI_BASE_URL"

echo "🎉 Deployment complete!"
echo "📋 Your API endpoint is now available at:"
vercel --prod --confirm 2>&1 | grep -o 'https://[^[:space:]]*' | head -1
echo ""
echo "📊 Test your deployment with:"
echo "curl -X POST \"$(vercel --prod --confirm 2>&1 | grep -o 'https://[^[:space:]]*' | head -1)/api/\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d \"What is 2 + 2?\""