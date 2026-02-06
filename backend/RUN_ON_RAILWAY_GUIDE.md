# Running on Railway Guide

This guide explains how to properly configure your Todo App backend on Railway.

## Environment Variables Configuration

### Required Variables

1. **DATABASE_URL** (Required)
   - For PostgreSQL: `postgresql://username:password@host:port/database`
   - For Neon PostgreSQL: Use your Neon dashboard connection string
   - For Railway PostgreSQL: Use Railway's managed database service

2. **SECRET_KEY** (Required)
   - Your JWT secret key
   - Example: `4fca6c8e639aaad8d373ac05b64b18c792a6d7375fdebe4c09765f9b31c2a1d7`

### Optional Variables

3. **OAuth Configuration** (Optional)
   - `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID
   - `GOOGLE_CLIENT_SECRET`: Your Google OAuth Client Secret
   - `GITHUB_CLIENT_ID`: Your GitHub OAuth Client ID
   - `GITHUB_CLIENT_SECRET`: Your GitHub OAuth Client Secret

4. **AI Assistant Configuration** (Optional)
   - `GROQ_API_KEY`: Your GROQ API key for AI assistant functionality

5. **URL Configuration**
   - `FRONTEND_URL`: Your deployed frontend URL (e.g., `https://your-frontend.onrender.com`)
   - `BACKEND_URL`: Your deployed backend URL (Railway will set this automatically as `https://your-app.up.railway.app`)

6. **Sentry Configuration** (Optional)
   - `SENTRY_DSN`: Your Sentry DSN for error tracking

## Setting Up Environment Variables on Railway

1. Go to your Railway project dashboard
2. Click on your application
3. Go to the "Settings" tab
4. Scroll down to "Environment Variables"
5. Add the following variables:

```
DATABASE_URL=your_postgresql_connection_string
SECRET_KEY=your_jwt_secret_key
GOOGLE_CLIENT_ID=your_google_client_id (optional)
GOOGLE_CLIENT_SECRET=your_google_client_secret (optional)
GITHUB_CLIENT_ID=your_github_client_id (optional)
GITHUB_CLIENT_SECRET=your_github_client_secret (optional)
GROQ_API_KEY=your_groq_api_key (optional)
FRONTEND_URL=https://your-frontend-url.com
```

## Setting Up PostgreSQL on Railway

1. In your Railway dashboard, click "New" and select "Database"
2. Choose PostgreSQL
3. Connect it to your backend service
4. Railway will automatically populate the `DATABASE_URL` variable

## Health Checks

The application provides health check endpoints:
- `/health` - General health check
- `/health/db` - Database connectivity check

## Troubleshooting

### Common Issues

1. **Database Connection Issues**:
   - Ensure `DATABASE_URL` is properly set
   - Check that the database service is running
   - Verify the connection string format

2. **OAuth Not Working**:
   - Ensure all OAuth environment variables are set
   - Check that OAuth callback URLs match your deployment URL
   - Register your callback URLs with Google/GitHub OAuth apps

3. **Port Issues**:
   - Railway automatically sets the PORT environment variable
   - The app will use the PORT variable or default to 8000

### Debugging Steps

1. Check the Railway logs for specific error messages
2. Verify all required environment variables are set
3. Test database connectivity with `/health/db` endpoint
4. Ensure your frontend is configured to use the correct backend URL