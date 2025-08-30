# 🚀 Deployment Guide

Quick reference for deploying your Note-Taking App to various platforms.

## 📦 Pre-Deployment Checklist

- [ ] Environment variables are properly configured
- [ ] MongoDB Atlas is set up with production credentials
- [ ] Google OAuth is configured for production domains
- [ ] Email service is working
- [ ] All dependencies are installed
- [ ] Application builds successfully
- [ ] Tests are passing

## 🌐 Frontend Deployment

### Vercel (Recommended)

1. **Connect Repository**:
   ```bash
   # Push to GitHub first
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com/)
   - Import your GitHub repository
   - Select `frontend` as root directory
   - Set environment variables:
     ```
     VITE_API_URL=https://your-backend-url.com/api
     VITE_GOOGLE_CLIENT_ID=your-google-client-id
     ```

3. **Build Settings**:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`

### Netlify

1. **Deploy**:
   - Connect GitHub repository
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`

2. **Environment Variables**:
   ```
   VITE_API_URL=https://your-backend-url.com/api
   VITE_GOOGLE_CLIENT_ID=your-google-client-id
   ```

## 🖥️ Backend Deployment

### Railway (Recommended)

1. **Deploy**:
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login and deploy
   railway login
   railway link
   railway up
   ```

2. **Environment Variables**:
   Set in Railway dashboard:
   ```
   NODE_ENV=production
   PORT=3001
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
   JWT_SECRET=your-production-jwt-secret
   JWT_EXPIRES_IN=7d
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   FRONTEND_URL=https://your-frontend-url.vercel.app
   ```

### Heroku

1. **Setup**:
   ```bash
   # Install Heroku CLI
   heroku login
   heroku create your-app-name
   ```

2. **Configure**:
   ```bash
   # Set environment variables
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI="your-mongodb-uri"
   heroku config:set JWT_SECRET="your-jwt-secret"
   # ... add all other environment variables
   ```

3. **Deploy**:
   ```bash
   git subtree push --prefix backend heroku main
   ```

### Render

1. **Create Web Service**:
   - Connect GitHub repository
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

2. **Environment Variables**:
   Add all required environment variables in Render dashboard

## 🗄️ Database Setup

### MongoDB Atlas (Production)

1. **Security**:
   - Create production database user
   - Update IP Access List for production servers
   - Enable connection string authentication

2. **Performance**:
   - Choose appropriate cluster tier
   - Set up monitoring and alerts
   - Configure backup policies

## 🔐 Security Configuration

### Environment Variables

**Never commit these to Git:**
```env
# Production values
JWT_SECRET=complex-random-string-for-production
MONGODB_URI=mongodb+srv://produser:complexpassword@cluster.mongodb.net/
EMAIL_PASS=gmail-app-specific-password
GOOGLE_CLIENT_SECRET=google-oauth-secret
```

### Google OAuth Production

1. **Update Authorized Redirect URIs**:
   ```
   https://your-frontend-domain.vercel.app
   https://your-frontend-domain.netlify.app
   ```

2. **Update JavaScript Origins**:
   ```
   https://your-frontend-domain.vercel.app
   ```

## 🧪 Post-Deployment Testing

### Health Checks

1. **Backend Health**:
   ```bash
   curl https://your-backend-url.com/api/health
   ```

2. **Frontend Access**:
   - Visit your frontend URL
   - Test sign up flow
   - Test Google OAuth
   - Test note creation

### API Testing

```bash
# Test authentication
curl -X POST https://your-backend-url.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Test note creation (with valid JWT)
curl -X POST https://your-backend-url.com/api/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{"title":"Test Note","content":"This is a test note"}'
```

## 🔄 Continuous Deployment

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./frontend

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        uses: bervProject/railway-deploy@v1.3.0
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: ${{ secrets.RAILWAY_SERVICE_ID }}
```

## 🐛 Common Deployment Issues

1. **CORS Errors**:
   - Update `FRONTEND_URL` in backend environment
   - Check CORS configuration in Express app

2. **Environment Variables Not Loading**:
   - Verify all variables are set in deployment platform
   - Check variable names match exactly

3. **Database Connection Issues**:
   - Verify MongoDB URI format
   - Check IP whitelist in MongoDB Atlas
   - Ensure database user has proper permissions

4. **Google OAuth Fails**:
   - Update authorized domains in Google Console
   - Verify client ID matches frontend environment

## 📊 Monitoring (Optional)

### Error Tracking
- **Sentry**: For error monitoring
- **LogRocket**: For session replay

### Performance Monitoring
- **Vercel Analytics**: Frontend performance
- **Railway Metrics**: Backend performance

---

**Your app is now ready for production! 🎉**
