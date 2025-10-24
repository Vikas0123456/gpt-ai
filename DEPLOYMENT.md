# Vercel Deployment Guide

## 🚀 Deploying Your Real-Time Communication App to Vercel

### Prerequisites
- Vercel account (free tier available)
- MongoDB Atlas account (free tier available)
- Git repository

### Step 1: Prepare Your Application

#### 1.1 Environment Variables
Create a `.env.local` file in your project root:
```env
# MongoDB (use MongoDB Atlas for production)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatapp

# JWT Secret (generate a secure random string)
JWT_SECRET=your_super_secure_jwt_secret_key_here

# Server Configuration
PORT=5000
NODE_ENV=production

# File Upload Configuration
MAX_FILE_SIZE=52428800
UPLOAD_PATH=./uploads

# CORS Configuration (your Vercel domain)
CLIENT_URL=https://your-app-name.vercel.app
```

#### 1.2 MongoDB Atlas Setup
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist all IP addresses (0.0.0.0/0) for Vercel
5. Get your connection string

### Step 2: Deploy to Vercel

#### 2.1 Frontend Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy frontend
vercel --prod
```

#### 2.2 Backend Deployment (Separate Project)
```bash
# Navigate to server directory
cd server

# Deploy backend
vercel --prod
```

### Step 3: Configure Environment Variables in Vercel

#### 3.1 Frontend Environment Variables
In Vercel dashboard, go to your frontend project settings:
- `NODE_ENV` = `production`
- `VITE_API_URL` = `https://your-backend.vercel.app`

#### 3.2 Backend Environment Variables
In Vercel dashboard, go to your backend project settings:
- `MONGODB_URI` = `your_mongodb_atlas_connection_string`
- `JWT_SECRET` = `your_secure_jwt_secret`
- `CLIENT_URL` = `https://your-frontend.vercel.app`
- `NODE_ENV` = `production`

### Step 4: Update Configuration Files

#### 4.1 Update API URLs
The application is already configured to use relative URLs in production.

#### 4.2 Update Socket.IO Configuration
The socket connection is already configured to use the current domain in production.

### Step 5: Test Your Deployment

1. **Frontend**: Visit `https://your-app.vercel.app`
2. **Backend**: Check `https://your-backend.vercel.app/api/health`
3. **Test Features**:
   - User registration/login
   - Real-time messaging
   - Video/audio calls
   - File uploads

### Step 6: Domain Configuration (Optional)

#### 6.1 Custom Domain
1. Go to Vercel dashboard
2. Select your project
3. Go to Settings > Domains
4. Add your custom domain
5. Update DNS records as instructed

#### 6.2 Update Environment Variables
After adding custom domain, update:
- `CLIENT_URL` = `https://your-custom-domain.com`

### Troubleshooting

#### Common Issues:

1. **CORS Errors**
   - Ensure `CLIENT_URL` in backend matches your frontend URL
   - Check that both frontend and backend are deployed

2. **Socket Connection Issues**
   - Verify WebSocket support in Vercel
   - Check that both apps are using HTTPS

3. **Database Connection**
   - Verify MongoDB Atlas connection string
   - Check IP whitelist includes Vercel IPs
   - Ensure database user has proper permissions

4. **File Upload Issues**
   - Vercel has file size limits
   - Consider using cloud storage (AWS S3, Cloudinary)

#### Debug Steps:
1. Check Vercel function logs
2. Test API endpoints directly
3. Verify environment variables
4. Check browser console for errors

### Production Optimizations

#### 1. Performance
- Enable Vercel Analytics
- Use Vercel Edge Functions for better performance
- Optimize images and assets

#### 2. Security
- Use strong JWT secrets
- Enable HTTPS only
- Implement rate limiting
- Add input validation

#### 3. Monitoring
- Set up Vercel Analytics
- Monitor function execution
- Track error rates

### Cost Considerations

#### Free Tier Limits:
- **Vercel**: 100GB bandwidth, 100GB-hours function execution
- **MongoDB Atlas**: 512MB storage, shared clusters

#### Scaling:
- Upgrade to Vercel Pro for more resources
- Use MongoDB Atlas paid plans for production
- Consider CDN for static assets

### Support

If you encounter issues:
1. Check Vercel documentation
2. Review MongoDB Atlas guides
3. Check application logs
4. Test locally first

### Final Checklist

- [ ] MongoDB Atlas cluster created and configured
- [ ] Environment variables set in Vercel
- [ ] Both frontend and backend deployed
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificates active
- [ ] All features tested in production
- [ ] Error monitoring set up
- [ ] Backup strategy in place
