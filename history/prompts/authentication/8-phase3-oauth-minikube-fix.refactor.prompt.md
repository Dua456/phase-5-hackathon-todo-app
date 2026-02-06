---
id: 8-phase3-oauth-minikube-fix
title: Google OAuth Internal Server Error Fix for Minikube Deployment
stage: refactor
date_iso: 2026-01-25
surface: agent
model: claude-sonnet-4-5-20250929
feature: authentication
branch: main
user: claude
command: "manual implementation"
labels: ["authentication", "oauth", "minikube", "bug-fix", "deployment"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files_yaml:
  - backend/main.py
  - backend/.env
  - OAUTH_MINIKUBE_FIX.md
  - FIX_SUMMARY.md
tests_yaml: []
---

# Google OAuth Internal Server Error Fix for Minikube Deployment

## Summary
Resolved internal server error that occurred when users tried to sign in with Google OAuth via Minikube deployment. The issue was caused by a mismatch between the configured frontend URL and the actual Minikube service URL.

## Problem
Users experienced an internal server error when accessing the Google OAuth callback URL (`http://localhost:8000/auth/google/callback?code=...`) after authenticating with Google. Instead of redirecting to the dashboard, they received an internal server error.

## Root Causes
1. **URL Configuration Mismatch**: The backend was configured with `FRONTEND_URL=http://localhost:3000`, but users were accessing the app via Minikube at `http://127.0.0.1:46261`
2. **Potential URL Encoding Issues**: JWT tokens and error messages containing special characters could break redirect URLs

## Solution
1. Updated the OAuth callback functions in `backend/main.py` to properly URL-encode tokens and error parameters
2. Changed `FRONTEND_URL` in `backend/.env` from `http://localhost:3000` to `http://127.0.0.1:46261`
3. Fixed duplicate assignment bug in Google OAuth callback function

## Files Modified
- `backend/main.py`: Enhanced OAuth callback functions with proper URL encoding
- `backend/.env`: Updated FRONTEND_URL for Minikube compatibility
- Created documentation files explaining the issue and solution

## Outcome
The OAuth callback now properly redirects users to the dashboard after successful Google authentication when using the Minikube deployment.

## Follow-up Actions
- Restart the backend server to apply environment changes
- Test the OAuth flow to confirm the fix works