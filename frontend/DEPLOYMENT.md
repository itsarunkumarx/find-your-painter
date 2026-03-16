# Frontend Deployment Guide (Vercel)

## Deployment Settings
- **Root Directory**: `frontend`
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

## Environment Variables
Ensure the following variables are set in Vercel:
- `VITE_API_URL`: `https://your-backend-domain.onrender.com` (NO /api at the end)
- `VITE_SOCKET_URL`: `https://your-backend-domain.onrender.com` (NO /api at the end)
- `VITE_GOOGLE_CLIENT_ID`: Your Google OAuth Client ID.
- `VITE_VAPID_PUBLIC_KEY`: Your VAPID public key.

## Deployment Steps
1. Create a new Project on Vercel.
2. Connect your GitHub repository.
3. Set the Root Directory to `frontend`.
4. Add the environment variables listed above.
5. Deploy!
