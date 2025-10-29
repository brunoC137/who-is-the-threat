# Deployment Guide

This guide will help you deploy the Guerreiros do Segundo Lugar application to production.

## Prerequisites

- Node.js 18+ installed locally
- Git repository
- MongoDB Atlas account
- Vercel account (for frontend)
- Render account (for backend)

## Backend Deployment (Render)

### 1. Prepare MongoDB Atlas

1. Create a MongoDB Atlas cluster
2. Create a database user
3. Whitelist your IP addresses (or use 0.0.0.0/0 for all)
4. Get your connection string

### 2. Deploy to Render

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Choose your repository and branch
4. Set the following environment variables:
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A strong random string (at least 32 characters)
   - `JWT_EXPIRE`: `7d`
   - `FRONTEND_URL`: Your Vercel frontend URL (will get this after frontend deployment)

5. Set build and start commands:
   - Build Command: `npm install`
   - Start Command: `npm start`

6. Deploy and note your backend URL

### 3. Create Initial Admin User

After deployment, you'll need to create an admin user. You can do this by:

1. Temporarily modifying the register endpoint to set `isAdmin: true`
2. Or connecting directly to your MongoDB and updating a user
3. Or adding a seed script to create an admin user

## Frontend Deployment (Vercel)

### 1. Deploy to Vercel

1. Connect your GitHub repository to Vercel
2. Import your project
3. Set the Root Directory to `frontend`
4. Set environment variables:
   - `NEXT_PUBLIC_API_URL`: Your Render backend URL

5. Deploy

### 2. Update Backend CORS Settings

After getting your Vercel URL, update the `FRONTEND_URL` environment variable in Render to your actual Vercel URL.

## Local Development Setup

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB connection string and JWT secret
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your backend URL (http://localhost:5000 for local)
npm run dev
```

## Environment Variables

### Backend (.env)
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/guerreiros-do-segundo-lugar
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=Guerreiros do Segundo Lugar
```

## Post-Deployment Checklist

1. ✅ Backend API is accessible and health check returns OK
2. ✅ Frontend loads without errors
3. ✅ User registration works
4. ✅ User login works
5. ✅ Create first admin user
6. ✅ Test deck creation
7. ✅ Test game creation
8. ✅ Test statistics endpoints
9. ✅ Mobile responsiveness works
10. ✅ HTTPS is working on both frontend and backend

## Troubleshooting

### Common Issues

1. **CORS errors**: Check that `FRONTEND_URL` in backend matches your actual frontend URL
2. **Database connection errors**: Verify MongoDB Atlas connection string and IP whitelist
3. **Authentication errors**: Check JWT_SECRET is set and consistent
4. **Build failures**: Check Node.js version compatibility

### Logs

- **Render**: Check the logs in your Render dashboard
- **Vercel**: Check the Function logs in your Vercel dashboard
- **MongoDB**: Check connection logs in MongoDB Atlas

## Monitoring

Consider setting up:
- Error tracking (Sentry)
- Analytics (Google Analytics)
- Uptime monitoring (UptimeRobot)
- Performance monitoring (Vercel Analytics)

## Security Notes

1. Never commit environment variables to git
2. Use strong JWT secrets (generate with `openssl rand -base64 32`)
3. Keep dependencies updated
4. Use HTTPS in production
5. Implement rate limiting (already included)
6. Regular security audits with `npm audit`