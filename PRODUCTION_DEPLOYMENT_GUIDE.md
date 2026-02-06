# Phase 5: Final Polish & Production Deployment Guide

This guide provides step-by-step instructions to complete Phase 5 of the hackathon todo app project, focusing on production deployment and final polish.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Set up GitHub Actions for CI/CD](#set-up-github-actions-for-cicd)
3. [Deploy Backend to Railway](#deploy-backend-to-railway)
4. [Deploy Frontend to Vercel](#deploy-frontend-to-vercel)
5. [Add Monitoring (Sentry)](#add-monitoring-sentry)
6. [Add PWA Support](#add-pwa-support)
7. [Write Final README and Demo Script](#write-final-readme-and-demo-script)
8. [Test Production Deployment](#test-production-deployment)
9. [Security Considerations](#security-considerations)

## Prerequisites

Before starting, ensure you have:

- GitHub account with access to your repository
- Railway account (https://railway.app/)
- Vercel account (https://vercel.com/)
- Sentry account (https://sentry.io/) - optional but recommended
- A domain name (optional but recommended)

## Set up GitHub Actions for CI/CD

### Step 1: Create GitHub Actions Workflow

The workflow file has already been created at `.github/workflows/deploy.yml`. This workflow will:

- Deploy the backend to Railway on push to main branch
- Deploy the frontend to Vercel on push to main branch
- Run tests after deployment

### Step 2: Configure GitHub Secrets

In your GitHub repository settings, add the following secrets:

For Railway deployment:
- `RAILWAY_TOKEN`: Your Railway API token (generate from Railway dashboard)

For Vercel deployment:
- `VERCEL_TOKEN`: Your Vercel API token (generate from Vercel dashboard)
- `VERCEL_PROJECT_ID`: Your Vercel project ID
- `VERCEL_ORG_ID`: Your Vercel organization ID

Optional for monitoring:
- `NEXT_PUBLIC_SENTRY_DSN`: Your Sentry DSN for frontend
- `SENTRY_DSN`: Your Sentry DSN for backend
- `SENTRY_ORG`: Your Sentry organization slug
- `SENTRY_PROJECT`: Your Sentry project name

### Step 3: Test GitHub Actions

Push changes to the main branch to trigger the workflow:

```bash
git add .
git commit -m "Configure GitHub Actions for CI/CD"
git push origin main
```

Monitor the Actions tab in GitHub to ensure deployment succeeds.

## Deploy Backend to Railway

### Step 1: Create Railway Account and Project

1. Sign up at [Railway](https://railway.app/)
2. Create a new project by clicking "New Project"
3. Choose "Deploy from GitHub" and select your repository
4. Select the `backend` directory or specify the backend service

### Step 2: Configure Environment Variables

In the Railway dashboard, go to the "Variables" section and add:

Required variables:
- `DATABASE_URL`: Your NeonDB connection string
- `SECRET_KEY`: 4fca6c8e639aaad8d373ac05b64b18c792a6d7375fdebe4c09765f9b31c2a1d7
- `GROQ_API_KEY`: Your Groq API key for AI features
- `FRONTEND_URL`: Your Vercel frontend URL (e.g., https://your-app.vercel.app)
- `BACKEND_URL`: Your Railway backend URL (e.g., https://your-app.up.railway.app)

OAuth variables (if using social login):
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `GITHUB_CLIENT_ID`: GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET`: GitHub OAuth client secret

Optional monitoring:
- `SENTRY_DSN`: Your Sentry DSN for backend error tracking

### Step 3: Configure Database

If using NeonDB:
1. Create a NeonDB project
2. Get the connection string from the Neon dashboard
3. Use it as the `DATABASE_URL` in Railway variables

### Step 4: Deploy

1. In Railway, go to the "Settings" tab
2. Click "Generate Domain" to get your backend URL
3. Click "Deploy Now" to manually trigger deployment
4. Monitor the "Logs" tab to ensure successful deployment

## Deploy Frontend to Vercel

### Step 1: Create Vercel Account and Project

1. Sign up at [Vercel](https://vercel.com/)
2. Import your GitHub repository
3. In the project settings, ensure the root directory is set to `/frontend`

### Step 2: Configure Build Settings

In Vercel project settings:
- Framework Preset: Select "Next.js"
- Build Command: `npm run build` (should auto-detect)
- Output Directory: `out` (for static export) or leave empty for server-side rendering
- Root Directory: `/frontend`

### Step 3: Configure Environment Variables

In Vercel project settings, go to "Environment Variables" and add:

Required variables:
- `NEXT_PUBLIC_BACKEND_URL`: Your Railway backend URL (e.g., https://your-app.up.railway.app)

OAuth redirect URLs (if using social login):
- `NEXT_PUBLIC_GOOGLE_CALLBACK_URL`: `${NEXT_PUBLIC_BACKEND_URL}/auth/google/callback`
- `NEXT_PUBLIC_GITHUB_CALLBACK_URL`: `${NEXT_PUBLIC_BACKEND_URL}/auth/github/callback`

Optional monitoring:
- `NEXT_PUBLIC_SENTRY_DSN`: Your Sentry DSN for frontend error tracking

### Step 4: Deploy

1. Click "Deploy" in the Vercel dashboard
2. Monitor the deployment logs to ensure success
3. Once deployed, you'll get a Vercel URL (e.g., https://your-app.vercel.app)

## Add Monitoring (Sentry)

### Step 1: Create Sentry Account

1. Sign up at [Sentry](https://sentry.io/)
2. Create a new project for your frontend (Framework: Next.js)
3. Create another project for your backend (Framework: Python/FastAPI)

### Step 2: Configure Frontend Sentry

Sentry is already configured in:
- `frontend/src/app/layout.tsx` - Initializes Sentry for error tracking
- `frontend/sentry.client.config.js` - Client-side configuration
- `frontend/sentry.server.config.js` - Server-side configuration
- `frontend/next.config.js` - Integration with Next.js build

### Step 3: Configure Backend Sentry

Sentry is already configured in:
- `backend/main.py` - Initializes Sentry for FastAPI
- `backend/requirements.txt` - Added Sentry SDK dependency

### Step 4: Set Up Alerts

In Sentry dashboard:
1. Create alerts for critical errors
2. Configure notification channels (email, Slack, etc.)
3. Set up performance monitoring
4. Configure anomaly detection

## Add PWA Support

### Step 1: Manifest Configuration

The PWA manifest is already configured in:
- `frontend/public/manifest.json` - Contains PWA configuration

Key features included:
- App name and icons
- Theme colors
- Display mode (standalone)
- Orientation settings

### Step 2: Service Worker

The service worker is already configured in:
- `frontend/public/sw.js` - Handles caching and offline functionality

Features included:
- Caching of static assets
- Offline fallback
- Cache management

### Step 3: Test PWA Features

1. Visit your deployed application
2. Open browser DevTools → Application → Manifest
3. Verify PWA properties are correctly loaded
4. Test installation on desktop/mobile
5. Test offline functionality

## Write Final README and Demo Script

### Step 1: Update README.md

The README has been updated with production deployment information. Key sections include:

- Project overview
- Local setup instructions
- Production deployment instructions
- Environment variables
- Architecture overview
- Contributing guidelines

### Step 2: Create Demo Script

Demo script should cover:

1. **Introduction** (30 seconds)
   - Welcome and app overview
   - Key features to be demonstrated

2. **Registration/Login** (1 minute)
   - Show registration form
   - Demonstrate login with email/password
   - Show OAuth options (Google/GitHub if configured)

3. **Task Management** (2 minutes)
   - Create a new task with title, description, priority
   - Show task list with different priorities
   - Edit an existing task
   - Mark task as complete/incomplete
   - Delete a task

4. **AI Chat Assistant** (2 minutes)
   - Navigate to AI assistant page
   - Show conversation interface
   - Demonstrate AI-powered task creation
   - Show AI-generated summaries

5. **Dashboard & Profile** (1 minute)
   - Show dashboard with statistics
   - Navigate to profile settings
   - Update profile information

6. **PWA Features** (30 seconds)
   - Show install prompt
   - Demonstrate offline functionality
   - Show mobile experience

7. **Conclusion** (30 seconds)
   - Recap key features
   - Mention production readiness
   - Thank viewers

## Test Production Deployment

### Step 1: Verify Backend Deployment

1. Visit your Railway backend URL
2. Navigate to `/docs` to verify FastAPI documentation is accessible
3. Test the health check endpoint: `/health`
4. Verify all API endpoints are working

### Step 2: Verify Frontend Deployment

1. Visit your Vercel frontend URL
2. Verify the application loads without errors
3. Test all UI components and navigation
4. Verify all features work as expected

### Step 3: End-to-End Testing

1. Register a new user
2. Create and manage tasks
3. Test AI chat functionality
4. Verify user authentication works
5. Test OAuth login if configured

### Step 4: Performance Testing

1. Use browser DevTools to check load times
2. Verify service worker is working (Application tab)
3. Check for console errors
4. Test on different devices/network conditions

### Step 5: Security Testing

1. Verify HTTPS is enforced
2. Check that all resources are served over HTTPS
3. Verify CORS policies are correctly configured
4. Test authentication and authorization

## Security Considerations

### HTTPS Enforcement
- Both Railway and Vercel provide HTTPS by default
- Ensure all environment variables containing secrets are properly masked

### Rate Limiting
- Implement rate limiting in your API endpoints
- Consider using tools like SlowAPI for FastAPI
- Configure at the application level or CDN level

### Secrets Management
- Never commit secrets to the repository
- Use platform-specific secret management (Railway Variables, Vercel Environment Variables)
- Rotate secrets regularly
- Use strong, randomly generated secrets

### Input Validation
- Validate all user inputs on both frontend and backend
- Sanitize data before storing in the database
- Use parameterized queries to prevent SQL injection

### Monitoring and Logging
- Set up proper error monitoring (Sentry configured)
- Log security-relevant events
- Set up alerts for suspicious activities
- Regularly review logs

## Production Checklist

- [ ] All environment variables configured in production
- [ ] HTTPS enabled and enforced
- [ ] Monitoring and error tracking configured
- [ ] PWA features working
- [ ] All tests passing in production
- [ ] Performance benchmarks met
- [ ] Security measures implemented
- [ ] Documentation updated
- [ ] Demo script prepared
- [ ] Backup and recovery procedures documented
- [ ] Rollback plan established

## Troubleshooting

### Common Issues:

1. **Environment Variables Not Loading**
   - Check that variables are correctly set in Railway/Vercel
   - Verify variable names match exactly
   - Restart deployment after changing variables

2. **Database Connection Issues**
   - Verify DATABASE_URL is correct
   - Check that database is accessible from Railway
   - Confirm database credentials are valid

3. **Frontend-Backend Communication**
   - Verify NEXT_PUBLIC_BACKEND_URL is correct
   - Check CORS settings in backend
   - Confirm both URLs are using HTTPS

4. **OAuth Configuration**
   - Ensure callback URLs match exactly what's registered with providers
   - Verify OAuth credentials are correct
   - Check that OAuth redirects are properly configured

## Conclusion

Once all steps are completed, your application will be fully deployed to production with:
- Backend on Railway
- Frontend on Vercel
- Comprehensive monitoring with Sentry
- PWA capabilities
- Security best practices implemented
- Complete documentation and demo materials

Your Phase 5 is now complete and production-ready!