# Backend Deployment Guide (Render)

## Deployment Settings
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

## Environment Variables
Ensure the following variables are set in Render:
- `MONGO_URI`: Your MongoDB connection string.
- `JWT_SECRET`: A secure random string for JWT.
- `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID.
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth Client Secret.
- `VAPID_PUBLIC_KEY`: Your VAPID public key.
- `VAPID_PRIVATE_KEY`: Your VAPID private key.
- `FRONTEND_URL`: `https://your-frontend-domain.vercel.app` (No trailing slash)
- `BACKEND_URL`: `https://your-backend-domain.onrender.com` (No trailing slash, NO /api)
- `NODE_ENV`: `production`

## Deployment Steps
1. Create a new "Web Service" on Render.
2. Connect your GitHub repository.
3. Set the Root Directory to `backend`.
4. Add the environment variables listed above.
5. Deploy!
