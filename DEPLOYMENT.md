# 🚀 Deployment Guide - Render + GitHub Auto-Deploy

This guide walks you through deploying **The Bean Keeper** to Render with automatic GitHub deployments.

## 📋 Prerequisites

Before you start, make sure you have:

- ✅ GitHub account (free)
- ✅ Render account (free) - Sign up at [render.com](https://render.com)
- ✅ Your environment variables ready (see `.env.example`)

## 🔑 Required Environment Variables

You'll need these API keys from your `.env` file:

```env
GROQ_API_KEY=gsk_...
NOTION_API_KEY=ntn_...
NOTION_DATABASE_ID=...
VITE_GOOGLE_MAPS_API_KEY=AIzaSy...
```

**⚠️ IMPORTANT:** These should NEVER be committed to GitHub! They're already in `.gitignore`.

---

## 📦 Step 1: Push to GitHub

### First Time Setup

```bash
# 1. Initialize git (if not already done)
git init

# 2. Add all files
git add .

# 3. Commit
git commit -m "Initial commit - ready for deployment"

# 4. Create a new repository on GitHub
# Go to https://github.com/new
# Repository name: the-bean-keeper
# Make it Public or Private (your choice)
# Don't add README, .gitignore, or license (we already have them)

# 5. Connect to GitHub (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/the-bean-keeper.git

# 6. Push to GitHub
git branch -M main
git push -u origin main
```

### Verify Upload

Go to your GitHub repository URL and verify:
- ✅ All code is there
- ✅ `.env` file is NOT visible (it should be ignored)
- ✅ `render.yaml` is visible

---

## 🎯 Step 2: Deploy to Render

### 2.1 Create New Web Service

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Click **"Connect account"** under GitHub (authorize Render)
4. Select your repository: `the-bean-keeper`

### 2.2 Configure Service

**Basic Settings:**
```
Name: the-bean-keeper
Region: Oregon (US West) or closest to you
Branch: main
Runtime: Node
```

**Build & Deploy Settings:**
```
Build Command: npm install && npm run build
Start Command: npm start
```

**Instance Type:**
```
Free
```

### 2.3 Add Environment Variables

Click **"Environment"** tab and add these one by one:

| Key | Value | Example |
|-----|-------|---------|
| `NODE_ENV` | `production` | - |
| `PORT` | `10000` | - |
| `GROQ_API_KEY` | Your Groq API key | `gsk_emw2bNqV...` |
| `NOTION_API_KEY` | Your Notion API key | `ntn_31637...` |
| `NOTION_DATABASE_ID` | Your Notion database ID | `a12cbbbc-b1a4...` |
| `VITE_GOOGLE_MAPS_API_KEY` | Your Google Maps key | `AIzaSyA51...` |

**How to add:**
1. Click **"Add Environment Variable"**
2. Enter Key
3. Enter Value
4. Click outside the field (it auto-saves)

### 2.4 Deploy!

1. Click **"Create Web Service"**
2. Watch the build logs in real-time
3. Wait 2-3 minutes for deployment to complete

**You'll see:**
```
==> Building...
> npm install
> npm run build
✓ Build complete

==> Deploying...
✓ Service is live at https://the-bean-keeper.onrender.com
```

---

## 🔄 Step 3: Enable Auto-Deploy (Should be ON by default)

In Render dashboard:
1. Go to your service settings
2. Find **"Auto-Deploy"** section
3. Verify it's set to **"Yes"**

From now on:
```
You push to GitHub → Render automatically deploys
```

---

## ✅ Step 4: Verify Deployment

### 4.1 Check Health Endpoint

Visit: `https://the-bean-keeper.onrender.com/api/health`

You should see:
```json
{
  "status": "ok",
  "timestamp": "2025-01-08T...",
  "uptime": 123.45,
  "environment": "production"
}
```

### 4.2 Test the App

Visit: `https://the-bean-keeper.onrender.com`

You should see The Bean Keeper dashboard!

### 4.3 Test Photo Upload

1. Click "Add Coffee"
2. Upload a coffee bag photo
3. Watch AI extract information
4. Save the entry

---

## 🔄 Your Daily Workflow

After initial setup, deploying updates is automatic:

```bash
# 1. Make changes in Claude Code
# (edit files, add features, etc.)

# 2. Test locally
npm run dev

# 3. Commit changes
git add .
git commit -m "Add new feature X"

# 4. Push to GitHub
git push

# 🎉 Render automatically deploys!
# Check progress at: https://dashboard.render.com
```

**Deployment Status:**
- Building: Yellow dot 🟡
- Live: Green dot 🟢
- Failed: Red dot 🔴

---

## 📧 Get Notifications

### Email Notifications
Render sends emails by default:
- ✅ Build started
- ✅ Build succeeded
- ❌ Build failed

### Webhook Notifications (Optional)
Set up Slack/Discord webhooks:
1. Service Settings → Notifications
2. Add webhook URL
3. Select events to notify

---

## 🐛 Troubleshooting

### Build Failed

**Check build logs:**
1. Go to Render dashboard
2. Click on your service
3. Click "Logs" tab
4. Look for error messages

**Common issues:**
```
Error: Module not found
→ Fix: Check package.json dependencies

Error: Build command failed
→ Fix: Test locally with npm run build

Error: Port already in use
→ Fix: Use PORT env var (already set to 10000)
```

### Service Won't Start

**Check environment variables:**
1. Go to Environment tab
2. Verify all keys are set
3. Check for typos in variable names

**Common missing vars:**
- `GROQ_API_KEY`
- `NOTION_API_KEY`
- `NOTION_DATABASE_ID`

### Slow First Load

**This is normal on free tier!**
- Free services sleep after 15 mins of inactivity
- First request takes ~30 seconds to wake up
- Subsequent requests are instant

**Solution for portfolio:**
- Add a note: "First load may take 30s (free tier waking up)"
- Or upgrade to paid tier ($7/month for always-on)

### Photo Upload Issues

**If GCS doesn't work on Render:**

The Replit GCS sidecar won't work on Render. You'll need to migrate to Cloudinary:

1. Sign up at [cloudinary.com](https://cloudinary.com) (free)
2. Get your credentials
3. Add to Render environment variables:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
4. Update code to use Cloudinary (I can help with this!)

---

## 🎨 Custom Domain (Optional)

Want a custom domain instead of `.onrender.com`?

1. Buy a domain (Namecheap, Google Domains, etc.)
2. In Render dashboard:
   - Settings → Custom Domain
   - Add your domain
   - Follow DNS instructions
3. Update DNS records at your domain registrar
4. Wait for SSL certificate (automatic, takes ~10 mins)

**Example:**
`https://the-bean-keeper.onrender.com` → `https://thebeankeeper.com`

---

## 📊 Monitoring

### View Logs
```
Render Dashboard → Your Service → Logs
```

Shows:
- Server startup
- API requests
- Errors
- Build logs

### Metrics
```
Render Dashboard → Your Service → Metrics
```

Shows:
- CPU usage
- Memory usage
- Request count
- Response times

---

## 💰 Free Tier Limits

**Render Free Tier includes:**
- ✅ 750 hours/month (enough for 1 always-on service)
- ✅ 512 MB RAM
- ✅ Shared CPU
- ✅ Custom domain support
- ✅ Automatic SSL
- ⚠️ Service sleeps after 15 mins inactivity

**Good for:**
- Portfolio projects
- Demos
- Low-traffic apps

**Upgrade needed if:**
- High traffic (>100 requests/min)
- Need always-on service
- Need more RAM/CPU

---

## 🚨 Important Notes

### Never Commit Secrets
Your `.gitignore` already blocks:
- `.env`
- `.env.local`
- `.env.production`

**Always:**
- Keep secrets in Render environment variables
- Use `.env.example` for documentation
- Rotate keys if accidentally committed

### Photo Storage Migration
Replit's GCS sidecar won't work on Render. Options:
1. **Cloudinary** (recommended - 25GB free)
2. **Vercel Blob** (1GB free)
3. **Cloudflare R2** (10GB free)

I can help migrate to any of these!

### Database
You're using Notion as database - this works on Render!
No additional setup needed.

---

## 📝 Checklist

Before going live, verify:

- [ ] `.env` is in `.gitignore`
- [ ] All environment variables added to Render
- [ ] Health check works: `/api/health`
- [ ] App loads: homepage works
- [ ] Photo upload works (or Cloudinary ready)
- [ ] AI extraction works (test with sample photo)
- [ ] Notion sync works (create/read/update/delete)
- [ ] Auto-deploy enabled

---

## 🆘 Need Help?

**Build logs show errors:**
- Copy full error message
- Test same command locally
- Check environment variables

**Can't access app:**
- Check Render status: https://status.render.com
- Verify service is "Live" (green dot)
- Check health endpoint first

**Photo upload failing:**
- Need to migrate from GCS to Cloudinary
- I can help update the code!

---

## 🎉 Success!

Once deployed, you'll have:
- ✅ Public URL: `https://the-bean-keeper.onrender.com`
- ✅ Auto-deploys on `git push`
- ✅ Free SSL certificate
- ✅ Build logs & monitoring
- ✅ Custom domain support
- ✅ Portfolio-ready demo!

**Share your URL on:**
- Resume
- LinkedIn
- GitHub README
- Portfolio website
- Notion portfolio page

---

## 📚 Resources

- [Render Docs](https://render.com/docs)
- [Render Node.js Guide](https://render.com/docs/deploy-node-express-app)
- [Render Free Tier](https://render.com/pricing)
- [Render Status](https://status.render.com)

---

**Ready to deploy? Follow Step 1 above!** 🚀
