# MERN Project Deployment Guide
## Frontend (Vercel) + Backend (Render)

---

## 📋 Folder Structure
```
Frontend (Root)
├── backend/                 (Backend - Deploy to Render)
│   ├── package.json
│   ├── server.js
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── socket/
│   └── ...
│
└── tcfs-frontend/           (Frontend - Deploy to Vercel)
    ├── package.json
    ├── src/
    ├── vite.config.js
    └── ...
```

---

## 🚀 Step 1: Backend Deployment (Render)

### 1.1 Prepare Backend
1. Navigate to your `backend` folder
2. Update `package.json`:
```json
{
  "name": "tcfs-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "engines": {
    "node": "18"
  }
}
```

### 1.2 Setup Environment Variables
Create a `.env` file in `backend/` folder (keep locally, don't commit):
```env
NODE_ENV=production
PORT=10000
MONGODB_URI=your_mongodb_connection_string
CLIENT_URL=https://your-frontend-url.vercel.app
JWT_SECRET=your_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

### 1.3 Ensure DB Connection Works
Edit `backend/config/db.js` - make sure it handles the MongoDB URI correctly:
```javascript
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};
```

### 1.4 Deploy to Render
1. Go to [render.com](https://render.com)
2. Click **"New" → "Web Service"**
3. Select **"GitHub"** (or upload manually)
4. Choose your repository
5. **Build Settings:**
   - **Name**: `tcfs-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. **Environment Variables** (Add these):
   ```
   NODE_ENV = production
   MONGODB_URI = your_mongodb_uri
   CLIENT_URL = https://your-frontend-url.vercel.app
   JWT_SECRET = your_secret
   EMAIL_USER = your_email
   EMAIL_PASSWORD = your_password
   ```
7. Click **"Create Web Service"**

✅ Your backend URL will be like: `https://tcfs-backend-xxxx.onrender.com`

---

## 🎨 Step 2: Frontend Deployment (Vercel)

### 2.1 Update Frontend Configuration
Edit `tcfs-frontend/vite.config.js`:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:10000',
        changeOrigin: true,
      }
    }
  }
})
```

### 2.2 Update Environment Variables
Create `tcfs-frontend/.env.local` (for local development):
```env
VITE_API_URL=http://localhost:10000
```

### 2.3 Update API Service
Edit `tcfs-frontend/src/services/auth.js`:
```javascript
const API_URL = import.meta.env.VITE_API_URL || "";

function api(path) {
  return `${API_URL}${path}`;
}
```

### 2.4 Verify package.json
Check `tcfs-frontend/package.json`:
```json
{
  "name": "tcfs-frontend",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### 2.5 Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New → Project"**
3. Import your **GitHub repository**
4. **Project Settings:**
   - **Framework**: Select **"Vite"**
   - **Root Directory**: `tcfs-frontend` ⚠️ (Important!)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. **Environment Variables** (Add these):
   ```
   VITE_API_URL = https://tcfs-backend-xxxx.onrender.com
   ```
6. Click **"Deploy"**

✅ Your frontend URL will be like: `https://your-project.vercel.app`

---

## 🔗 Step 3: Connect Frontend to Backend

### 3.1 Update Render Backend
Go to Render dashboard → Your Web Service → **Settings → Environment**
- Update `CLIENT_URL` = `https://your-project.vercel.app`

### 3.2 Update Vercel Frontend
Go to Vercel dashboard → Your Project → **Settings → Environment Variables**
- Update `VITE_API_URL` = `https://tcfs-backend-xxxx.onrender.com`

### 3.3 Fix CORS in Backend
Edit `backend/server.js`:
```javascript
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## ✅ Deployment Checklist

### Backend (Render)
- [ ] `.gitignore` includes `.env`
- [ ] `server.js` uses `process.env.PORT` for port
- [ ] Database connection string in environment variables
- [ ] CORS configured for frontend URL
- [ ] All dependencies in `package.json`

### Frontend (Vercel)
- [ ] Root Directory set to `tcfs-frontend`
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] `VITE_API_URL` environment variable set
- [ ] API calls use `import.meta.env.VITE_API_URL`

---

## 🐛 Troubleshooting

### Issue: "Cannot find module"
**Solution**: Ensure all dependencies are in `package.json` and run `npm install`

### Issue: API calls failing
**Solution**: Check CORS settings and verify `VITE_API_URL` in Vercel environment

### Issue: MongoDB connection error
**Solution**: Verify `MONGODB_URI` format and add your IP to MongoDB whitelist

### Issue: Frontend showing blank page
**Solution**: Check Vercel build logs and ensure root directory is `tcfs-frontend`

---

## 📝 Quick Commands

### Before Deployment
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd tcfs-frontend
npm install
npm run dev
```

### Redeploy
- **Vercel**: Push to GitHub (auto-deploys)
- **Render**: Push to GitHub OR manually redeploy from dashboard

---

## 🔐 Security Notes
- Never commit `.env` files
- Use strong JWT secrets
- Enable HTTPS (both platforms use HTTPS by default)
- Regularly rotate API keys

---

## 📞 Deployment URLs (After Deployment)
- **Backend**: `https://tcfs-backend-xxxx.onrender.com`
- **Frontend**: `https://your-project.vercel.app`
