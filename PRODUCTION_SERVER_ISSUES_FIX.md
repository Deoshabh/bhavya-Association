# Production Server Issues - Diagnosis & Fix Guide 🔧

## 🚨 **Critical Production Issues Identified**

### **Error Analysis:**
```
❌ CORS Error: Access to XMLHttpRequest at 'https://api.bhavyasangh.com/api/news' 
   from origin 'https://bhavyasangh.com' has been blocked by CORS policy
❌ 502 Bad Gateway: API server not responding
❌ 500 Internal Server Error: Backend API errors
```

## 🎯 **Root Cause: Backend API Server Issues**

The frontend is working correctly, but your **production API server** (`https://api.bhavyasangh.com`) has these problems:

### 1. **API Server Down/Misconfigured** 🔴
- **502 Bad Gateway** = Web server can't reach your Node.js backend
- **500 Internal Server Error** = Backend is crashing or misconfigured

### 2. **CORS Configuration Missing** 🔴
- Backend not sending proper CORS headers for `https://bhavyasangh.com`

### 3. **Possible Database Connection Issues** 🔴
- MongoDB might be down or misconfigured on production

## 🛠️ **Immediate Actions Required**

### **Step 1: Check Backend Server Status**
```bash
# SSH into your VPS
ssh user@your-vps-ip

# Check if Node.js backend is running
ps aux | grep node
pm2 status  # if using PM2
systemctl status your-app-name  # if using systemd

# Check server logs
pm2 logs  # if using PM2
journalctl -f -u your-app-name  # if using systemd
tail -f /var/log/your-app.log  # or wherever logs are stored
```

### **Step 2: Verify Backend Configuration**
Check your production backend files:

#### **A. CORS Configuration** 
Ensure your backend `app.js` has proper CORS setup:
```javascript
const corsOptions = {
  origin: ['https://bhavyasangh.com', 'https://www.bhavyasangh.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-auth-token'],
  credentials: true
};
app.use(cors(corsOptions));
```

#### **B. Environment Variables**
Check your production `.env` file:
```bash
# On your VPS
cat /path/to/your/backend/.env

# Should contain:
MONGODB_URI=mongodb://localhost:27017/bhavya-associates
# OR your MongoDB connection string
JWT_SECRET=your-production-jwt-secret
PORT=5000
NODE_ENV=production
CLIENT_URL=https://bhavyasangh.com
```

#### **C. MongoDB Connection**
```bash
# Check if MongoDB is running
systemctl status mongod
# OR
ps aux | grep mongod

# Test MongoDB connection
mongo
# OR
mongosh
```

### **Step 3: Backend Deployment Check**
```bash
# Navigate to your backend directory on VPS
cd /path/to/your/backend

# Check if all files are present
ls -la

# Check if dependencies are installed
ls node_modules  # should exist

# If not, install dependencies
npm install

# Start/restart the backend
pm2 restart your-app
# OR
npm start
```

## 🔧 **Quick Fixes to Try**

### **Fix 1: Update Backend CORS (High Priority)**
```javascript
// In your backend app.js - update CORS origins
const corsOptions = {
  origin: [
    'https://bhavyasangh.com', 
    'https://www.bhavyasangh.com',
    'http://localhost:3000'  // for development
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'x-auth-token'
  ],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Add explicit OPTIONS handling
app.options('*', cors(corsOptions));
```

### **Fix 2: Check Web Server Configuration**
If using **Nginx** as reverse proxy:
```nginx
# /etc/nginx/sites-available/api.bhavyasangh.com
server {
    listen 80;
    server_name api.bhavyasangh.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' 'https://bhavyasangh.com' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-Requested-With, x-auth-token' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
    }
}
```

### **Fix 3: Restart All Services**
```bash
# Restart backend
pm2 restart all
# OR
systemctl restart your-backend-service

# Restart web server
sudo systemctl restart nginx
# OR
sudo systemctl restart apache2

# Restart MongoDB if needed
sudo systemctl restart mongod
```

## 🔍 **Diagnostic Commands**

### **Check API Server Directly**
```bash
# On your VPS, test the backend locally
curl http://localhost:5000/api/debug
curl http://localhost:5000/api/health

# Check if it responds with JSON
```

### **Check External Access**
```bash
# From your local machine
curl https://api.bhavyasangh.com/api/debug
curl https://api.bhavyasangh.com/api/health
```

### **Check Logs for Errors**
```bash
# Backend logs
pm2 logs your-app-name
tail -f /var/log/your-app.log

# Web server logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# System logs
journalctl -f
```

## 🎯 **Expected Results After Fix**

✅ **CORS Headers Present**: `Access-Control-Allow-Origin: https://bhavyasangh.com`  
✅ **API Responding**: `https://api.bhavyasangh.com/api/debug` returns JSON  
✅ **News Loading**: No more network errors  
✅ **Referrals Working**: Proper authentication responses  

## 🚀 **Quick Test Script**

Save this as `test-api.sh` and run on your VPS:
```bash
#!/bin/bash
echo "=== API Server Diagnostic ==="
echo "1. Testing local backend..."
curl -s http://localhost:5000/api/debug || echo "❌ Local backend not responding"

echo "2. Testing external API..."
curl -s https://api.bhavyasangh.com/api/debug || echo "❌ External API not responding"

echo "3. Checking processes..."
ps aux | grep node || echo "❌ No Node.js processes found"

echo "4. Checking MongoDB..."
systemctl is-active mongod || echo "❌ MongoDB not running"

echo "=== End Diagnostic ==="
```

---

## 🎯 **CRITICAL BUG FOUND & FIXED!** 

### **Root Cause Identified:**
```
Error fetching referral info: TypeError: Class constructor ObjectId cannot be invoked without 'new'
at ReferralSchema.statics.getAnalytics (/app/models/Referral.js:80:49)
```

### **The Issue:**
In newer versions of Mongoose (6.x+), `ObjectId` must be called with the `new` keyword.

**❌ Broken Code (Line 80 in Referral.js):**
```javascript
const matchStage = { referrer: mongoose.Types.ObjectId(userId) };
```

**✅ Fixed Code:**
```javascript  
const matchStage = { referrer: new mongoose.Types.ObjectId(userId) };
```

### **Immediate Fix Required on Production:**

1. **Update your production Referral.js file** on your VPS:
```bash
# SSH into your VPS
ssh user@your-vps-ip

# Navigate to your backend models directory
cd /path/to/your/backend/models

# Edit the Referral.js file
nano Referral.js
# OR
vim Referral.js
```

2. **Find line 80** and change:
```javascript
// CHANGE THIS:
const matchStage = { referrer: mongoose.Types.ObjectId(userId) };

// TO THIS:
const matchStage = { referrer: new mongoose.Types.ObjectId(userId) };
```

3. **Restart your backend:**
```bash
pm2 restart your-app-name
# OR
systemctl restart your-backend-service
```

### **Alternative: Deploy Updated Code**
If you have the fixed code locally, deploy it to production:
```bash
# From your local machine, copy the fixed file
scp backend/models/Referral.js user@your-vps:/path/to/your/backend/models/

# Then restart the backend on VPS
ssh user@your-vps "pm2 restart your-app-name"
```

### **Expected Result After Fix:**
✅ **Referral Dashboard**: Will load without 500 errors  
✅ **API Response**: `/api/referrals/info` will return proper JSON  
✅ **User Experience**: No more TypeError crashes  

---

## 💡 **Most Likely Issue: Backend Server Down**

Based on the 502 errors, your Node.js backend is probably not running or crashed. Start with:

1. **SSH into your VPS**
2. **Check if backend is running**: `pm2 status` or `ps aux | grep node`
3. **Restart backend**: `pm2 restart all` or `npm start`
4. **Check logs**: `pm2 logs` for any error messages

This should resolve the immediate issues! 🎯
