# 🚀 Complete Deployment Guide - MERN to Production

## 📋 Pre-Deployment Checklist

### Backend Ready? ✅
- [ ] `.env` file created with all values
- [ ] `npm install` runs without errors
- [ ] `npm run dev` starts server on port 10000
- [ ] MongoDB connection working
- [ ] CORS configured
- [ ] `.env` added to `.gitignore`

### Frontend Ready? ✅
- [ ] `npm install` runs without errors
- [ ] `npm run dev` works on `localhost:5173`
- [ ] Landing page displays correctly
- [ ] No console errors
- [ ] `.env.local` has `VITE_API_URL`

### Git Ready? ✅
- [ ] Repository initialized and pushed to GitHub
- [ ] `.env` files NOT committed
- [ ] All code changes committed

---

## 🔧 Step 1: Final Local Testing

### Test Backend Locally
```bash
cd backend
npm run dev
```
Expected output:
```
✅ TCFS backend running on port 10000
✅ MongoDB Connected: cluster0.xxx.mongodb.net
```

### Test Frontend Locally
```bash
cd tcfs-frontend
npm run dev
```
Expected:
- Page loads at `http://localhost:5173`
- Landing page visible
- No console errors (F12)

### Test API Connection
In browser console:
```javascript
fetch('http://localhost:10000/').then(r => r.text()).then(console.log)
// Should log: "TCFS Backend is running"
```

---

## 🌍 Step 2: Deploy Backend to Render

### 2.1 Prepare Backend for Production

Ensure `backend/.env` has production values:
```env
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://your_user:your_pass@cluster.mongodb.net/tcfs_db
CLIENT_URL=https://YOUR_FRONTEND_URL.vercel.app
JWT_SECRET=your_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
OPENAI_API_KEY=sk-proj-...
GOOGLE_API_KEY=AIzaSy...
```

### 2.2 Commit to GitHub

```bash
# From root or backend directory
git add backend/
git commit -m "Backend production ready"
git push
```

**IMPORTANT:** Do NOT commit `.env` file!

### 2.3 Create Render Web Service

1. Go to [render.com](https://render.com)
2. Sign up/Login with GitHub
3. Click **"New +"** → **"Web Service"**
4. Connect to your **GitHub repository**
5. Select repository

### 2.4 Configure Render Settings

| Setting | Value |
|---------|-------|
| **Name** | `tcfs-backend` |
| **Environment** | `Node` |
| **Region** | `Singapore` or closest to you |
| **Branch** | `main` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Root Directory** | `backend` ⚠️ Important! |

### 2.5 Add Environment Variables

In Render Dashboard → Your Service → **Environment**:

Add these variables:
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://your_user:your_pass@cluster.mongodb.net/tcfs_db
CLIENT_URL=https://YOUR_VERCEL_FRONTEND_URL
JWT_SECRET=your_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
OPENAI_API_KEY=sk-proj-...
GOOGLE_API_KEY=AIzaSy...
```

### 2.6 Deploy

Click **"Create Web Service"**

⏳ Wait 3-5 minutes for deployment...

### 2.7 Get Backend URL

After deployment completes, you'll get a URL like:
```
https://tcfs-backend-xxxxx.onrender.com
```

**Copy this URL** - you'll need it for frontend deployment!

### 2.8 Test Backend Endpoint

```bash
curl https://tcfs-backend-xxxxx.onrender.com/
# Should return: "TCFS Backend is running"
```

---

## 🎨 Step 3: Deploy Frontend to Vercel

### 3.1 Prepare Frontend

Update `tcfs-frontend/.env.local`:
```env
VITE_API_URL=https://tcfs-backend-xxxxx.onrender.com
VITE_SOCKET_URL=https://tcfs-backend-xxxxx.onrender.com
```

### 3.2 Update Backend CORS

Update `backend/.env`:
```env
CLIENT_URL=https://YOUR_VERCEL_URL.vercel.app
```

Then recommit:
```bash
git add backend/.env
git commit -m "Update CORS for production frontend"
git push
```

Render will auto-redeploy with new `CLIENT_URL`

### 3.3 Commit Frontend Changes

```bash
git add tcfs-frontend/
git commit -m "Frontend production ready"
git push
```

### 3.4 Create Vercel Project

1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click **"Add New"** → **"Project"**
4. **Import Git Repository**
5. Select your repository

### 3.5 Configure Vercel Project

| Setting | Value |
|---------|-------|
| **Framework Preset** | `Vite` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |
| **Root Directory** | `tcfs-frontend` ⚠️ Important! |

### 3.6 Add Environment Variables

**Environment Variables** section:
```
VITE_API_URL=https://tcfs-backend-xxxxx.onrender.com
VITE_SOCKET_URL=https://tcfs-backend-xxxxx.onrender.com
```

### 3.7 Deploy

Click **"Deploy"**

⏳ Wait 2-3 minutes...

### 3.8 Get Frontend URL

After deployment, Vercel shows your URL:
```
https://your-project.vercel.app
```

---

## 🔗 Step 4: Final Connection Setup

### 4.1 Update Render Backend

Go to Render Dashboard → tcfs-backend → **Settings** → **Environment Variables**

Update `CLIENT_URL`:
```
CLIENT_URL=https://your-project.vercel.app
```

**Render will auto-redeploy** with new CORS settings

### 4.2 Test Production

Open in browser:
```
https://your-project.vercel.app
```

### 4.3 Verify API Connection

In browser console:
```javascript
fetch('https://tcfs-backend-xxxxx.onrender.com/').then(r => r.text()).then(console.log)
// Should log: "TCFS Backend is running"
```

### 4.4 Check for CORS Errors

If you see CORS errors in console:
1. Check `CLIENT_URL` on Render matches Vercel URL
2. Restart Render service
3. Clear browser cache (Ctrl+Shift+Delete)

---

## ✅ Deployment Checklist

### Backend (Render)
- [ ] GitHub repository connected
- [ ] Root Directory set to `backend`
- [ ] Build Command: `npm install`
- [ ] Start Command: `npm start`
- [ ] All environment variables added
- [ ] Backend URL obtained
- [ ] Test endpoint works

### Frontend (Vercel)
- [ ] GitHub repository connected
- [ ] Root Directory set to `tcfs-frontend`
- [ ] Framework: Vite selected
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] Environment variables added with correct API URL
- [ ] Frontend URL obtained
- [ ] Page loads without errors

### Final Connection
- [ ] Render `CLIENT_URL` updated to Vercel URL
- [ ] Vercel `VITE_API_URL` points to Render backend
- [ ] Both services redeployed
- [ ] No CORS errors in console
- [ ] API calls working

---

## 🚨 Troubleshooting Deployment

### Issue: Render Build Fails
```
npm ERR! code ENOENT
npm ERR! path D:\...\package.json
```
**Fix:** Set **Root Directory** to `backend`

### Issue: Vercel Build Fails
```
Module not found: Can't resolve...
```
**Fix:** 
- Set Root Directory to `tcfs-frontend`
- Check all imports are correct

### Issue: White Screen on Frontend
**Check:**
1. Browser Console (F12) for errors
2. Network tab - see if API calls succeed
3. `VITE_API_URL` environment variable set

### Issue: CORS Errors
```
Access to XMLHttpRequest blocked by CORS policy
```
**Fix:**
1. Verify `CLIENT_URL` on Render exactly matches Vercel URL
2. Wait 5 minutes for Render to restart
3. Hard refresh browser (Ctrl+Shift+F5)

### Issue: MongoDB Connection Error
```
MongoError: connect ECONNREFUSED
```
**Fix:**
1. Check `MONGODB_URI` is correct
2. Verify IP whitelist includes Render's IP
3. In MongoDB Atlas: Security → Network Access → "Allow Access from Anywhere"

### Issue: Email Not Sending
**Check:**
1. `EMAIL_USER` and `EMAIL_PASSWORD` are correct
2. Using Gmail App Password (not main password)
3. 2FA enabled on Google Account

### Issue: Stuck on Loading
**Render might be slow to wake up:**
- Render free tier sleeps after 15 minutes
- First request takes 30-60 seconds
- Use paid tier for always-on server

---

## 📊 Production URLs

After successful deployment, you'll have:

```
🌐 Frontend:  https://your-project.vercel.app
🔙 Backend:   https://tcfs-backend-xxxxx.onrender.com
```

---

## 📝 After Deployment

### Monitor for Errors
1. Check Render logs: Dashboard → Service → Logs
2. Check Vercel logs: Dashboard → Project → Deployments → Logs
3. Check browser console for runtime errors

### Update DNS (Optional)
If you have a custom domain:
1. On Vercel: Add Custom Domain
2. Update DNS records
3. Enable SSL certificate

### Setup Auto-Deploy
Both Render and Vercel auto-deploy on Git push to main branch

### Ongoing Maintenance
- Monitor error logs
- Update dependencies regularly
- Backup MongoDB regularly
- Check API quotas (OpenAI, Google AI)

---

## 🎉 You're Live!

Your MERN app is now deployed to production! 🚀

Visit: `https://your-project.vercel.app`

