# Backend Environment Setup Guide

## 📋 Quick Start

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update all values in `.env` with your actual credentials

3. Never commit `.env` file - it's in `.gitignore`

---

## 🔧 Environment Variables Explanation

### SERVER CONFIGURATION
```env
NODE_ENV=production        # Set to 'production' for Render, 'development' locally
PORT=10000                 # Server port (Render uses dynamic port, this is fallback)
```

---

## 🗄️ MONGODB_URI Setup

### Option 1: MongoDB Atlas (Cloud - Recommended)
1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create free account
3. Create a **Cluster**
4. Click **"Connect"** → **"Drivers"**
5. Copy connection string:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/database_name?retryWrites=true&w=majority
```

6. Replace:
   - `username` → Your database user
   - `password` → Your database password
   - `cluster0.xxxxx` → Your cluster name
   - `database_name` → Your database name (e.g., `tcfs_db`)

### Whitelist IP (Important!)
In MongoDB Atlas Dashboard:
1. Go to **Security → Network Access**
2. Click **"Add IP Address"**
3. Add your IP or click "Allow Access from Anywhere" (0.0.0.0/0)

### Example:
```env
MONGODB_URI=mongodb+srv://admin:MyPassword123@cluster0.abc123.mongodb.net/tcfs_db?retryWrites=true&w=majority
```

---

## 🔑 JWT_SECRET Setup

Generate a secure random string (at least 32 characters):

### Option 1: Online Generator
Go to [randomkeygen.com](https://randomkeygen.com) and copy a "CodeIgniter Encryption Keys" string

### Option 2: Terminal Command
```bash
# Linux/Mac
openssl rand -base64 32

# PowerShell (Windows)
$bytes = New-Object Byte[] 32
$rng = [Security.Cryptography.RNGCryptoServiceProvider]::new()
$rng.GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

### Example:
```env
JWT_SECRET=aB1cD2eF3gH4iJ5kL6mN7oPqRsTuVwXyZ0a+b/c=
```

---

## 📧 EMAIL CONFIGURATION (Gmail + App Password)

### Step 1: Enable 2-Factor Authentication
1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Click **"Security"** (left menu)
3. Enable **"2-Step Verification"**

### Step 2: Generate App Password
1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Select **App**: Mail
3. Select **Device**: Windows/Mac/Other
4. Google will generate a **16-character password**
5. Copy it (remove spaces)

### Example:
```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop  # Remove spaces: abcdefghijklmnop
```

---

## 🤖 AI SERVICE API KEYS

### OpenAI API Key
1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create new API key
3. Copy it immediately (can't view again)

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
```

### Google Generative AI Key
1. Go to [ai.google.dev](https://ai.google.dev)
2. Click **"Get API Key"**
3. Create in new project or existing project
4. Copy the key

```env
GOOGLE_API_KEY=AIzaSyD_xxxxxxxxxxxxxx_xxxxxx
```

---

## 🌐 CLIENT_URL Setup

### For Local Development
```env
CLIENT_URL=http://localhost:5173
```

### For Production (Vercel)
```env
CLIENT_URL=https://your-app-name.vercel.app
```

### For Render (if frontend also on Render)
```env
CLIENT_URL=https://your-frontend-url-on-render.onrender.com
```

---

## ✅ Complete .env Example

```env
# Server
NODE_ENV=production
PORT=10000

# Database
MONGODB_URI=mongodb+srv://admin:MyPassword123@cluster0.abc123.mongodb.net/tcfs_db?retryWrites=true&w=majority

# Frontend
CLIENT_URL=https://your-app.vercel.app

# Authentication
JWT_SECRET=aB1cD2eF3gH4iJ5kL6mN7oPqRsTuVwXyZ0a+b/c=

# Email
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop

# AI Services
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
GOOGLE_API_KEY=AIzaSyD_xxxxxxxxxxxxxx_xxxxxx
```

---

## 🚀 Deployment to Render

1. Create account at [render.com](https://render.com)
2. Create **"New Web Service"**
3. In Render Dashboard:
   - Go to **Environment** tab
   - Add these environment variables:

```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://...
CLIENT_URL=https://your-vercel-app.vercel.app
JWT_SECRET=your_secret
EMAIL_USER=your_email
EMAIL_PASSWORD=your_app_password
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=AIza...
```

---

## 🔒 Security Best Practices

✅ **DO:**
- Use strong, unique passwords
- Store `.env` securely
- Add `.env` to `.gitignore`
- Rotate API keys regularly
- Use different secrets for dev/prod

❌ **DON'T:**
- Commit `.env` to Git
- Share API keys publicly
- Use weak passwords
- Reuse same secret for multiple apps
- Store secrets in code comments

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED
```
**Fix:**
- Check MONGODB_URI is correct
- Verify IP is whitelisted in MongoDB Atlas
- Check internet connection

### Email Sending Failed
```
Error: Invalid login
```
**Fix:**
- Use **App Password**, not main password
- Enable 2FA on Google Account
- Verify EMAIL_USER and EMAIL_PASSWORD

### PORT Already in Use
```
Error: listen EADDRINUSE: address already in use :::10000
```
**Fix:**
```bash
# Find process using port 10000
lsof -i :10000

# Kill process
kill -9 <PID>

# Or use different port
PORT=10001 npm start
```

### CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```
**Fix:**
- Update `CLIENT_URL` in `.env`
- Restart server
- Check browser console for exact origin being blocked

---

## 📝 Notes

- MongoDB Atlas has a 512MB free tier (plenty for development)
- Gmail App Passwords expire in 30 days if 2FA is disabled
- OpenAI and Google API keys have usage limits/pricing
- Render free tier goes to sleep after 15 minutes - use paid tier for production

