@echo off
echo 🚀 Starting deployment to Vercel...

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Vercel CLI not found. Installing...
    npm install -g vercel
)

REM Check if user is logged in to Vercel
vercel whoami >nul 2>&1
if errorlevel 1 (
    echo 🔐 Please login to Vercel:
    vercel login
)

echo 📦 Building frontend...
npm run build

echo 🌐 Deploying frontend to Vercel...
vercel --prod

echo 📡 Deploying backend to Vercel...
cd server
vercel --prod
cd ..

echo ✅ Deployment complete!
echo.
echo 📋 Next steps:
echo 1. Set up MongoDB Atlas
echo 2. Configure environment variables in Vercel dashboard
echo 3. Test your deployed application
echo.
echo 📖 See DEPLOYMENT.md for detailed instructions
pause
