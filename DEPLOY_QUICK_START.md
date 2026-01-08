# 🚀 Quick Start - Deploy in 10 Minutes

A condensed guide to get The Bean Keeper live on Render ASAP.

## ✅ Pre-Flight Checklist

Before starting, grab these from your `.env` file:
- `GROQ_API_KEY`
- `NOTION_API_KEY`
- `NOTION_DATABASE_ID`
- `VITE_GOOGLE_MAPS_API_KEY`

---

## Step 1: Push to GitHub (2 mins)

```bash
# If first time
git init
git add .
git commit -m "Ready for deployment"

# Create repo on GitHub: https://github.com/new
# Name it: the-bean-keeper

# Connect and push (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/the-bean-keeper.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy to Render (5 mins)

### 2.1 Create Service
1. Go to [render.com](https://render.com) → Sign up/Login
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub → Select `the-bean-keeper` repo

### 2.2 Configure
```
Name: the-bean-keeper
Region: Oregon (or closest)
Branch: main
Build Command: npm install && npm run build
Start Command: npm start
Instance Type: Free
```

### 2.3 Add Environment Variables

Click **"Environment"** and add:

```
NODE_ENV=production
PORT=10000
GROQ_API_KEY=<your-groq-key>
NOTION_API_KEY=<your-notion-key>
NOTION_DATABASE_ID=<your-database-id>
VITE_GOOGLE_MAPS_API_KEY=<your-maps-key>
```

### 2.4 Deploy
Click **"Create Web Service"** → Wait 2-3 mins

---

## Step 3: Verify (1 min)

**Health Check:**
```
https://the-bean-keeper.onrender.com/api/health
```

Should return:
```json
{"status": "ok", "timestamp": "...", "uptime": 123}
```

**App:**
```
https://the-bean-keeper.onrender.com
```

Should show The Bean Keeper dashboard!

---

## 🔄 Future Updates

```bash
# Make changes
git add .
git commit -m "Add feature"
git push

# Render auto-deploys! ✨
```

---

## ⚠️ Important Notes

1. **Free tier sleeps** after 15 mins → First load takes ~30s
2. **GCS photos won't work** on Render → Migrate to Cloudinary (I can help!)
3. **Never commit `.env`** → Already in .gitignore ✅

---

## 🆘 Troubleshooting

**Build failed?**
- Check Render logs tab
- Verify all env vars are set

**Can't load app?**
- Check health endpoint first
- Wait 30s (free tier waking up)

**Photos not working?**
- Need Cloudinary setup (see DEPLOYMENT.md)

---

## 🎉 Done!

Your URL: `https://the-bean-keeper.onrender.com`

**Next Steps:**
- Add to your portfolio
- Share on LinkedIn/resume
- Consider custom domain
- Migrate to Cloudinary for photos

See `DEPLOYMENT.md` for full guide!
