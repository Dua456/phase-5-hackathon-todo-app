# Phase 5 Hackathon Todo App

A modern, AI-powered todo application with authentication, chat interface, and production-ready deployment.

## 🚀 Features

- **Authentication**: Email/password and OAuth (Google, GitHub)
- **Task Management**: Create, update, delete, and track tasks with priorities
- **AI Assistant**: Natural language task management with Groq AI integration
- **Real-time Chat**: Conversational interface for task management
- **Progressive Web App**: Installable, offline-capable, responsive design
- **Production Ready**: Deployed with Railway (backend) and Vercel (frontend)
- **Monitoring**: Sentry error tracking and performance monitoring
- **Mobile Optimized**: Responsive design for all device sizes

## 🏗️ Tech Stack

### Backend
- **Framework**: FastAPI
- **Database**: Neon Serverless PostgreSQL with SQLModel ORM
- **Authentication**: JWT tokens with OAuth support
- **AI Integration**: Groq API for natural language processing
- **Monitoring**: Sentry for error tracking
- **Hosting**: Railway

### Frontend
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with neon gradient and glassmorphism effects
- **State Management**: React Context API
- **Monitoring**: Sentry for error tracking
- **PWA**: Service worker and manifest for offline functionality
- **Hosting**: Vercel

## 🛠️ Local Setup

### Prerequisites
- Node.js 18+ for frontend
- Python 3.9+ for backend
- PostgreSQL (or NeonDB account for cloud database)
- Git

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the backend directory with the following variables:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/todo_app
SECRET_KEY=4fca6c8e639aaad8d373ac05b64b18c792a6d7375fdebe4c09765f9b31c2a1d7
GROQ_API_KEY=your-groq-api-key
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
SENTRY_DSN=your-sentry-dsn-if-enabled
```

5. Run the backend:
```bash
uvicorn main:app --reload --port 8000
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the frontend directory with the following variables:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn-if-enabled
```

4. Run the frontend:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## ☁️ Production Deployment

### Backend (Railway)

1. Create a Railway account at [railway.app](https://railway.app/)
2. Create a new project and connect your GitHub repository
3. Configure the following environment variables in Railway:
   - `DATABASE_URL`: Your NeonDB connection string
   - `SECRET_KEY`: A secure JWT secret key
   - `GROQ_API_KEY`: Your Groq API key
   - `FRONTEND_URL`: Your Vercel frontend URL
   - `BACKEND_URL`: Your Railway backend URL
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (if using Google OAuth)
   - `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` (if using GitHub OAuth)
   - `SENTRY_DSN` (if using Sentry)

4. Deploy and monitor the logs for successful deployment

### Frontend (Vercel)

1. Create a Vercel account at [vercel.com](https://vercel.com/)
2. Import your GitHub repository
3. Configure the following environment variables in Vercel:
   - `NEXT_PUBLIC_BACKEND_URL`: Your Railway backend URL
   - `NEXT_PUBLIC_SENTRY_DSN` (if using Sentry)

4. Deploy and verify the live URL

## 🔐 OAuth Setup

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://YOUR_BACKEND_URL/auth/google/callback`

### GitHub OAuth
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth application
3. Add homepage URL: Your frontend URL
4. Add authorization callback URL:
   - `https://YOUR_BACKEND_URL/auth/github/callback`

## 📱 PWA Features

The application is built as a Progressive Web App with the following features:
- Installable on mobile and desktop devices
- Offline functionality for task viewing
- Background sync for task updates
- Responsive design for all screen sizes
- Push notification support (coming soon)

## 🚀 CI/CD Pipeline

The application uses GitHub Actions for continuous integration and deployment:
- Automated testing on pull requests
- Automatic deployment to Railway and Vercel on merge to main
- Security scanning and code quality checks
- Preview deployments for pull requests

Workflow configuration is located in `.github/workflows/deploy.yml`.

## 📊 Monitoring

The application includes Sentry for error tracking and performance monitoring:
- Frontend errors are captured and reported to Sentry
- Backend errors and performance metrics are monitored
- Real-time alerts for critical errors
- Performance tracing for API endpoints

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📹 Demo Video Script

### Introduction (30 seconds)
Welcome to the Phase 5 Hackathon Todo App! This AI-powered task management application combines modern web technologies with intelligent features to help you stay organized and productive.

### Registration/Login (1 minute)
- Show registration form with email, password, and profile fields
- Demonstrate login with email/password
- Briefly show OAuth options (Google/GitHub login)

### Task Management (2 minutes)
- Create a new task with title, description, priority, and tags
- Show task list with different priority levels (low, medium, high)
- Edit an existing task to update its details
- Mark task as complete/incomplete with the toggle
- Delete a task and confirm removal

### AI Chat Assistant (2 minutes)
- Navigate to the AI assistant page
- Show the conversational interface
- Demonstrate AI-powered task creation: "Create a task to buy groceries"
- Show AI-generated summaries and task suggestions
- Interact with the chat to manage tasks naturally

### Dashboard & Profile (1 minute)
- View dashboard with statistics cards showing task metrics
- Navigate to profile settings
- Update profile information (name, bio, location)
- Change theme preference between light and dark mode

### PWA Features (30 seconds)
- Show the install prompt in browser
- Demonstrate offline functionality by turning off network
- Show the installed app experience on mobile/desktop

### Conclusion (30 seconds)
This production-ready application showcases modern development practices with secure authentication, AI integration, and robust deployment. Thank you for watching!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please make sure to update tests as appropriate and follow the existing code style.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, please open an issue in the GitHub repository or contact the development team.

## 🙏 Acknowledgments

- FastAPI for the excellent web framework
- Next.js for the React framework
- NeonDB for the serverless PostgreSQL
- Groq for the AI API
- Vercel and Railway for hosting solutions
- Sentry for error monitoring
- All the open-source contributors who made this possible