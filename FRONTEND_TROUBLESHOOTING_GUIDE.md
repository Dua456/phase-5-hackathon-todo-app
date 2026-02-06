# Frontend Troubleshooting Guide for Deployed App

## Common Issues & Solutions for https://phase-5-hackathon-todo-app.vercel.app

### 1. API Connection Issues
**Symptoms**:
- Cannot load tasks
- Cannot login/signup
- AI assistant not responding
- User info not loading

**Solution**:
- Verify NEXT_PUBLIC_API_URL is set correctly in Vercel environment
- Should be: `NEXT_PUBLIC_API_URL=https://web-production-3d8a1.up.railway.app`

### 2. Authentication Issues
**Symptoms**:
- Login fails
- Cannot retrieve user data after login
- OAuth redirects to wrong URL

**Solutions**:
- Ensure backend has correct FRONTEND_URL: `https://phase-5-hackathon-todo-app.vercel.app`
- Check that Google OAuth is configured with correct redirect URIs:
  - `https://phase-5-hackathon-todo-app.vercel.app/auth/callback`
  - `https://phase-5-hackathon-todo-app-git-main.your-vercel-team.vercel.app/auth/callback`

### 3. CORS Issues
**Symptoms**:
- Browser console shows CORS errors
- API requests fail with "Access-Control-Allow-Origin" errors
- OPTIONS requests failing

**Solution**:
- Backend CORS configuration should include your Vercel domain
- Already fixed in the CORS configuration update

### 4. Static Assets Not Loading
**Symptoms**:
- Missing images
- CSS not loading properly
- Icons not showing

**Solutions**:
- Check that image domains are configured in next.config.js
- Verify public assets are properly deployed

### 5. Build-Time Issues
**Symptoms**:
- Blank page on load
- JavaScript errors on initial load
- Components not rendering

**Solutions**:
- Check Vercel deployment logs for build errors
- Verify all environment variables are set correctly

## How to Diagnose Issues

### Step 1: Open Browser Developer Tools
1. Press F12 to open DevTools
2. Go to "Console" tab
3. Look for any error messages
4. Go to "Network" tab
5. Refresh the page and look for failed requests (red entries)

### Step 2: Common Error Patterns
Look for these common errors:
- `Failed to fetch` - API connection issues
- `CORS` errors - Cross-origin issues
- `401 Unauthorized` - Authentication issues
- `404 Not Found` - Missing resources
- `TypeError` - JavaScript errors

### Step 3: Check API Connectivity
1. In Console, try: `fetch('https://web-production-3d8a1.up.railway.app/health')`
2. Should return a success response
3. Check if API endpoints are accessible

## Environment Variables Checklist for Vercel

Ensure these are set in your Vercel dashboard (Settings > Environment Variables):

```
NEXT_PUBLIC_API_URL=https://web-production-3d8a1.up.railway.app
NEXT_PUBLIC_GOOGLE_CLIENT_ID=209046205664-lf0jn9n2ls29rtucl8aofhd2tiis1q9f.apps.googleusercontent.com
```

Optional:
```
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
```

## Backend Configuration Checklist

Ensure your backend on Railway has these environment variables:
```
FRONTEND_URL=https://phase-5-hackathon-todo-app.vercel.app
BACKEND_URL=https://web-production-3d8a1.up.railway.app
GROQ_API_KEY=your_groq_api_key
DATABASE_URL=your_postgres_url
SECRET_KEY=your_secret_key
GOOGLE_CLIENT_ID=209046205664-lf0jn9n2ls29rtucl8aofhd2tiis1q9f.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_secret
```

## Quick Fix Steps

1. **Redeploy Backend** (already updated with CORS fixes)
2. **Verify Vercel Environment Variables**
3. **Check Browser Console for specific errors**
4. **Test API endpoints directly**

## Testing Checklist

- [ ] Homepage loads without errors
- [ ] Login/Signup works
- [ ] User info displays after login
- [ ] Task CRUD operations work
- [ ] AI assistant responds
- [ ] OAuth flows work correctly
- [ ] Dashboard loads properly
- [ ] All navigation works

## Need Specific Help?

If you're seeing specific error messages, please share:
1. The exact error message from browser console
2. The URL where the error occurs
3. Steps to reproduce the error
4. Screenshot of the error if possible

This will help identify the exact issue and provide a targeted solution.