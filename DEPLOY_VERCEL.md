# 🚀 Deploying KrishiMitra AI to Vercel

KrishiMitra AI is configured for instant 1-click deployment on **Vercel**.

---

## 📋 Prerequisites

1. A [Vercel account](https://vercel.com)
2. Your project pushed to GitHub (or deployed directly via Vercel CLI)

---

## ⚡ Option 1: Deploy via GitHub (Recommended)

1. **Push your repository to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Import into Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Select your **`KrishiMitra-`** repository.
   - **Framework Preset**: Other (Vercel will automatically read `vercel.json`).
   - **Build Command**: `npm run build` *(auto-detected)*
   - **Output Directory**: `client/dist` *(auto-detected)*

3. **Configure Environment Variables** in Vercel Project Settings:

   | Variable | Value | Description |
   |---|---|---|
   | `AI_PROVIDER` | `gemini` | Enable live Google Gemini AI |
   | `AI_API_KEY` | `YOUR_GEMINI_API_KEY` | Your Google Gemini API Key |
   | `AI_BASE_URL` | `https://generativelanguage.googleapis.com/v1beta` | Gemini API Base |
   | `JWT_SECRET` | *(random 32+ char string)* | Secret for authentication tokens |
   | `ADMIN_EMAIL` | `admin@krishimitra.ai` | Default admin email |
   | `ADMIN_PASSWORD` | `Admin@123` | Default admin password |
   | `CLIENT_ORIGIN` | `https://your-vercel-domain.vercel.app` | Your Vercel deployment URL |
   | `WEATHER_API_KEY` | *(optional)* | OpenWeatherMap API key if available |

4. Click **Deploy**! 🎉

---

## 🛠️ Option 2: Deploy via Vercel CLI

If you have `vercel` CLI installed:

```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Login and deploy
vercel
```

For production deployment:
```bash
vercel --prod
```

---

## 🏗️ How it Works on Vercel:

- **Frontend & Landing Page**: Pre-built Vite React application in `client/dist` and root `index.html` served via global edge CDN.
- **Backend & AI Engine**: Express API served via Vercel Serverless Function at `/api/index.js`.
- **Database**: SQLite initialized automatically with safe `/tmp` path and built-in seed dataset.
