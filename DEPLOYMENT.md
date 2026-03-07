# Render Deployment Guide

Follow these steps to deploy your **Mindform** project to Render. I have already configured your backend to serve the frontend and performed the initial build.

## What I've Done:
1.  **Built the Frontend**: Generated the production build of your React app with the correct API URL (`/api`).
2.  **Prepared the Backend**: Copied the frontend build into `backend/public`.
3.  **Updated `server.js`**: Added code to serve these static files when the app is in production mode.

---

## 1. Prepare for GitHub
Since you want to "only upload backend", you should ensure your `backend` folder is pushed to GitHub.

If you want to keep the current structure:
*   Push the whole project to GitHub.
*   On Render, set the **Root Directory** to `backend`.

---

## 2. Setup on Render

1.  **Sign in to [Render](https://render.com/)**.
2.  Click **New +** and select **Web Service**.
3.  Connect your GitHub repository.
4.  Configure the following settings:
    *   **Name**: `mindform-app`
    *   **Environment**: `Node`
    *   **Root Directory**: `backend` (Important)
    *   **Build Command**: `npm install`
    *   **Start Command**: `npm start`
    *   **Environment Variables**:
        *   `NODE_ENV`: `production`
        *   `MONGODB_URI`: *Paste your MongoDB Atlas connection string here*
        *   `JWT_SECRET`: *Create a random secret key*
        *   `PORT`: `10000`

---

## 3. Verify Health Check
Once deployed, your app will be available at your Render URL.
*   Frontend: `https://your-app-name.onrender.com/`
*   Backend Health Check: `https://your-app-name.onrender.com/health`

---

## How to update the frontend build in the future
If you make changes to the frontend, you need to rebuild it and move it to `backend/public` again before pushing to GitHub:

1.  `cd frontend`
2.  `$env:VITE_API_URL="/api"; npm run build` (In Windows PowerShell)
3.  `cp -r dist/* ../backend/public/`
4.  Commit and push the `backend` folder.
