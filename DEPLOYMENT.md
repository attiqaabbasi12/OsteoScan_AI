# 🚀 OsteoScan AI — Deployment Guide

Backend  → Hugging Face Spaces (Docker)
Frontend → Vercel (React Static Site)

---

## PART 1 — Deploy Backend on Hugging Face Spaces

### Step 1 — Create HuggingFace Account
```
Go to: https://huggingface.co
Sign up with your email (free)
```

### Step 2 — Create a New Space
```
1. Click your profile → "New Space"
2. Fill in:
   Space name : osteoporosis-fyp
   License    : MIT
   SDK        : Docker          ← IMPORTANT
   Visibility : Public
3. Click "Create Space"
```

### Step 3 — Push Backend Code to HF Space
```bash
# In your project root, clone the HF space repo
git clone https://huggingface.co/spaces/YOUR-USERNAME/osteoporosis-fyp

# Copy backend files into it
cp -r backend/* osteoporosis-fyp/

# Go into the folder
cd osteoporosis-fyp

# Add and commit
git add .
git commit -m "Deploy OsteoScan AI backend"
git push
```

### Step 4 — Upload Model Weights
```
Your best_swin_model.pth is 105MB — too large for git push.
Upload it directly through HuggingFace UI:

1. Go to your Space page
2. Click "Files" tab
3. Click "Add file" → "Upload file"
4. Upload: best_swin_model.pth
5. Place it at: model/best_swin_model.pth
6. Commit the file
```

### Step 5 — Set Environment Variables on HuggingFace
```
1. Go to your Space → Settings tab
2. Scroll to "Repository secrets"
3. Add:
   Name  : JWT_SECRET_KEY
   Value : (generate a long random string — use a password generator)

4. Add:
   Name  : FRONTEND_URL
   Value : https://YOUR-APP.vercel.app   (add after Vercel deploy)

5. Add:
   Name  : FLASK_ENV
   Value : production
```

### Step 6 — Watch Build Logs
```
After push, HuggingFace will:
1. Pull your Dockerfile
2. Build the Docker image (~5-10 minutes first time)
3. Start the container
4. Show "Running" status when ready

Your backend URL will be:
https://YOUR-USERNAME-osteoporosis-fyp.hf.space
```

### Step 7 — Test Backend
```bash
# Test health check
curl https://YOUR-USERNAME-osteoporosis-fyp.hf.space/api/health

# Expected response:
# {"app": "OsteoScan AI", "status": "ok", "version": "1.0.0"}
```

---

## PART 2 — Deploy Frontend on Vercel

### Step 1 — Update Backend URL in Frontend
```
Edit: frontend/.env.production

Replace this line:
REACT_APP_API_URL=https://YOUR-HF-USERNAME-osteoporosis-fyp.hf.space/api

With your actual HuggingFace URL:
REACT_APP_API_URL=https://attiqaabbasi12-osteoporosis-fyp.hf.space/api
```

### Step 2 — Create Vercel Account
```
Go to: https://vercel.com
Sign up with GitHub (recommended)
```

### Step 3 — Deploy via Vercel Dashboard (Easiest)
```
Option A — GitHub Integration (Recommended):
1. Push your project to GitHub
2. Go to vercel.com → "New Project"
3. Import your GitHub repo
4. Configure:
   Framework Preset : Create React App
   Root Directory   : frontend
   Build Command    : npm run build
   Output Directory : build
5. Add Environment Variable:
   Name  : REACT_APP_API_URL
   Value : https://YOUR-HF-USERNAME-osteoporosis-fyp.hf.space/api
6. Click "Deploy"
```

```
Option B — Vercel CLI:
npm install -g vercel
cd frontend
vercel --prod
```

### Step 4 — Get Your Vercel URL
```
After deployment:
Your app is live at: https://osteoporosis-fyp.vercel.app
(or similar auto-generated URL)
```

### Step 5 — Update CORS on HuggingFace
```
Go back to HuggingFace Space → Settings → Secrets
Update or add:
   Name  : FRONTEND_URL
   Value : https://osteoporosis-fyp.vercel.app

Then edit backend/config.py to include your Vercel URL:
CORS_ORIGINS = [
    "http://localhost:3000",
    "https://osteoporosis-fyp.vercel.app",   ← your actual URL
]

Commit and push to HF — it will auto-redeploy.
```

---

## PART 3 — Test Full Deployment

```bash
# 1. Test backend health
curl https://YOUR-HF-USERNAME-osteoporosis-fyp.hf.space/api/health

# 2. Test backend auth
curl -X POST https://YOUR-HF-USERNAME-osteoporosis-fyp.hf.space/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"lab_id":"LAB001","name":"Dr Test","email":"test@lab.com","password":"test123"}'

# 3. Open frontend
# Go to: https://osteoporosis-fyp.vercel.app
# Register → Login → New Scan → Upload X-Ray → Full flow
```

---

## Troubleshooting

### Backend not starting
```
Check HuggingFace Space logs:
Space page → Logs tab → look for Python errors

Common issues:
- Missing model file → upload best_swin_model.pth via Files tab
- Import error → check all requirements are in requirements.txt
- Port error → make sure app.py uses port 7860
```

### CORS errors in browser
```
Check browser console for:
"Access-Control-Allow-Origin" errors

Fix:
1. Add your Vercel URL to CORS_ORIGINS in config.py
2. Commit and push to HuggingFace
3. Wait for redeploy (~2 minutes)
```

### Model not loading
```
Check HF logs for:
"best_swin_model.pth not found"

Fix:
Go to Space → Files tab → upload best_swin_model.pth
Make sure it is at: model/best_swin_model.pth
```

### Frontend shows blank page
```
Check Vercel deployment logs
Common fix: make sure Root Directory is set to "frontend"
and Build Command is "npm run build"
```

---

## Final URLs (fill these in after deployment)

```
Backend  (HuggingFace) : https://_________________.hf.space
Frontend (Vercel)      : https://_________________.vercel.app
GitHub Repo            : https://github.com/attiqaabbasi12/osteoporosis_fyp
```

---

## Architecture Summary

```
User Browser
     ↓
Vercel (React Frontend)
     ↓  HTTPS API calls
HuggingFace Spaces (Flask + PyTorch)
     ↓
SQLite DB + File Storage (inside container)
```

> ⚠️ Note: HuggingFace free Spaces reset storage on restart.
> Uploaded X-rays, heatmaps, and PDFs are lost on container restart.
> For permanent storage, consider HuggingFace Datasets or upgrade to paid plan.
