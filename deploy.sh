#!/bin/bash

# Real-Time Communication App - Vercel Deployment Script

echo "🚀 Starting deployment to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel:"
    vercel login
fi

echo "📦 Building frontend..."
npm run build

echo "🌐 Deploying frontend to Vercel..."
vercel --prod

echo "📡 Deploying backend to Vercel..."
cd server
vercel --prod
cd ..

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set up MongoDB Atlas"
echo "2. Configure environment variables in Vercel dashboard"
echo "3. Test your deployed application"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"
