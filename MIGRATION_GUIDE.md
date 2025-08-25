# 🚀 Migration Guide: Render.com + Firebase + Authentication Setup

This guide provides step-by-step instructions for migrating the shoestore application to new Render.com and Firebase accounts, including complete authentication configuration.

## 📋 Prerequisites

- [ ] Access to new Render.com account
- [ ] Access to new Firebase/Google Cloud account
- [ ] Local development environment setup
- [ ] Admin access to current accounts (for data export if needed)

---

## 🔥 Firebase Setup

### Step 1: Create New Firebase Project

1. **Go to [Firebase Console](https://console.firebase.google.com/)**
2. **Click "Create a project"**
3. **Project Settings:**
   - Project name: `shoestore-production` (or your preferred name)
   - Project ID: `shoestore-prod-XXXXX` (Firebase will generate unique ID)
   - Location: Choose appropriate region
4. **Enable Google Analytics** (optional but recommended)
5. **Create Project**

### Step 2: Configure Firebase Authentication

1. **Navigate to Authentication** → **Get Started**
2. **Sign-in method tab** → **Enable providers:**
   - ✅ **Email/Password** (Enable)
   - ✅ **Google** (Enable if needed)
3. **Settings tab** → **Authorized domains:**
   - Add your Render.com domains:
     - `your-app-name.onrender.com`
     - `your-admin-panel.onrender.com`
     - `localhost` (for development)

### Step 3: Configure Firestore Database

1. **Navigate to Firestore Database** → **Create database**
2. **Security rules:** Start in **test mode** (for initial setup)
3. **Location:** Choose same region as your Render deployment
4. **Create the following collections:**

#### Users Collection Structure
```
Collection: users
Document ID: {firebase-auth-uid}
Fields:
{
  "id": number,
  "email": "string",
  "contactName": "string", 
  "phone": "string",
  "role": "admin" | "user",
  "shippingAddress": {
    "street": "string",
    "city": "string", 
    "postalCode": "string",
    "country": "string"
  },
  "billingAddress": {
    "street": "string",
    "city": "string",
    "postalCode": "string", 
    "country": "string"
  },
  "invoiceInfo": {
    "companyName": "string",
    "vatNumber": "string"
  },
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Step 4: Generate Service Account

1. **Go to Project Settings** → **Service accounts** tab
2. **Click "Generate new private key"**
3. **Download JSON file** (keep this secure!)
4. **Save the content** - you'll need it for environment variables

### Step 5: Configure Firebase Web App

1. **Project Overview** → **Add app** → **Web app** (</>)
2. **App nickname:** `shoestore-client` 
3. **Enable Firebase Hosting:** ❌ (we use Render)
4. **Register app**
5. **Copy Firebase config object** - save for later

Example config:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "shoestore-prod-xxxxx.firebaseapp.com",
  projectId: "shoestore-prod-xxxxx", 
  storageBucket: "shoestore-prod-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxxxxxxxxxx"
};
```

### Step 6: Security Rules Update

Update Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admin users can read all user data
    match /users/{userId} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

---

## 🚀 Render.com Setup

### Step 1: Create Render Account & Connect GitHub

1. **Sign up at [Render.com](https://render.com)**
2. **Connect your GitHub account**
3. **Grant access to your repository**

### Step 2: Deploy API Service

1. **New** → **Web Service**
2. **Connect Repository:** `your-username/shoestore-workspace`
3. **Configuration:**
   - **Name:** `shoestore-api`
   - **Region:** Choose appropriate region
   - **Branch:** `main` or `develop`
   - **Root Directory:** `apps/api`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start:prod`
   - **Instance Type:** `Starter` (can upgrade later)

### Step 3: Deploy Client Shop

1. **New** → **Static Site**
2. **Connect Repository:** `your-username/shoestore-workspace`
3. **Configuration:**
   - **Name:** `shoestore-client`
   - **Branch:** `main` or `develop`
   - **Root Directory:** `apps/client-shop`
   - **Build Command:** `npm install && npm run build:prod`
   - **Publish Directory:** `dist/apps/client-shop`

### Step 4: Deploy Admin Panel

1. **New** → **Static Site** 
2. **Connect Repository:** `your-username/shoestore-workspace`
3. **Configuration:**
   - **Name:** `shoestore-admin`
   - **Branch:** `main` or `develop`
   - **Root Directory:** `apps/admin-panel`
   - **Build Command:** `npm install && npm run build:prod`
   - **Publish Directory:** `dist/apps/admin-panel`

---

## 🔧 Environment Configuration

### Step 1: API Environment Variables

In Render dashboard → Your API service → Environment:

```bash
# Application
NODE_ENV=production
PORT=10000

# Firebase Configuration (paste the ENTIRE service account JSON as one line)
FIREBASE_CONFIG={"type":"service_account","project_id":"your-project-id",...}

# Frontend URLs (update with your actual Render URLs)
CLIENT_SHOP_URL=https://shoestore-client.onrender.com
ADMIN_PANEL_URL=https://shoestore-admin.onrender.com

# Performance
MEMORY_THRESHOLD=524288000
LOG_LEVEL=info
ENABLE_COMPRESSION=true
ENABLE_HELMET=true

# Firebase URLs (auto-generated from project ID, but can override)
FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

### Step 2: Client Applications Environment

Update Firebase config in your client applications:

**File: `apps/client-shop/src/environments/environment.prod.ts`**
```typescript
export const environment = {
  production: true,
  firebase: {
    apiKey: "your-api-key",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:xxxxxxxxxx"
  },
  api: {
    baseUrl: 'https://shoestore-api.onrender.com/api'
  }
};
```

**File: `apps/admin-panel/src/environments/environment.prod.ts`**
```typescript
export const environment = {
  production: true,
  firebase: {
    apiKey: "your-api-key",
    authDomain: "your-project-id.firebaseapp.com", 
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:xxxxxxxxxx"
  },
  api: {
    baseUrl: 'https://shoestore-api.onrender.com/api'
  }
};
```

---

## 👥 User Management & Admin Setup

### Step 1: Create Admin User

1. **Register first user** via your client application
2. **Note the Firebase Auth UID** (from Firebase Console → Authentication → Users)

### Step 2: Set Admin Role in Firestore

1. **Go to Firestore Database** in Firebase Console
2. **Navigate to `users` collection**
3. **Create/Edit document with ID = Firebase Auth UID**
4. **Add/Update fields:**
   ```json
   {
     "email": "admin@yourcompany.com",
     "contactName": "Admin User",
     "role": "admin",
     "createdAt": "2025-01-25T10:00:00Z",
     "updatedAt": "2025-01-25T10:00:00Z"
   }
   ```

### Step 3: Set Custom Claims (Optional but Recommended)

Create a temporary Cloud Function to set custom claims:

1. **Firebase Console** → **Functions**
2. **Create function with this code:**

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.setAdminRole = functions.https.onRequest(async (req, res) => {
  const email = req.query.email;
  const secret = req.query.secret;
  
  // Simple security check
  if (secret !== 'your-temp-secret-123') {
    return res.status(403).send('Unauthorized');
  }
  
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { role: 'admin' });
    
    res.json({ success: true, uid: user.uid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

3. **Deploy and call:**
   ```
   https://us-central1-your-project-id.cloudfunctions.net/setAdminRole?email=admin@yourcompany.com&secret=your-temp-secret-123
   ```

4. **Delete the function** after use for security

---

## ✅ Verification Checklist

### Firebase Verification
- [ ] Firebase project created and configured
- [ ] Authentication enabled (Email/Password)
- [ ] Firestore database created with proper collections
- [ ] Service account generated and JSON downloaded
- [ ] Security rules configured
- [ ] Admin user created with proper role

### Render Verification  
- [ ] API service deployed and running
- [ ] Client shop deployed and accessible
- [ ] Admin panel deployed and accessible
- [ ] Environment variables configured correctly
- [ ] All services connected and communicating

### Authentication Verification
- [ ] User registration works on client shop
- [ ] User login works on client shop
- [ ] Admin login works on admin panel
- [ ] Admin endpoints protected and accessible
- [ ] Role-based access control working
- [ ] Token refresh working properly

### End-to-End Testing
- [ ] Create account on client shop
- [ ] Login/logout functionality
- [ ] Admin user can access admin panel
- [ ] Regular user cannot access admin panel
- [ ] API endpoints respond correctly
- [ ] CORS configured properly

---

## 🔒 Security Best Practices

### Firebase Security
1. **Never commit service account JSON** to version control
2. **Use environment variables** for all sensitive data
3. **Enable Firestore security rules** in production
4. **Regularly rotate service account keys**
5. **Monitor authentication logs** for suspicious activity

### Render Security  
1. **Use environment variables** for all secrets
2. **Enable HTTPS** (default on Render)
3. **Configure proper CORS** headers
4. **Monitor application logs** regularly
5. **Use Render's built-in DDoS protection**

### Application Security
1. **Validate all inputs** on both client and server
2. **Use HTTPS** for all communications
3. **Implement rate limiting** for authentication endpoints
4. **Log security events** for monitoring
5. **Keep dependencies updated** regularly

---

## 🆘 Troubleshooting

### Common Issues

#### 1. CORS Errors
- **Problem:** Client cannot connect to API
- **Solution:** Check `CLIENT_SHOP_URL` and `ADMIN_PANEL_URL` environment variables
- **Verify:** API CORS configuration includes your frontend URLs

#### 2. Firebase Connection Issues
- **Problem:** "Firebase project not found" or authentication fails
- **Solution:** Verify `FIREBASE_CONFIG` environment variable is correct JSON
- **Check:** Firebase config in client applications matches project

#### 3. Admin Access Denied
- **Problem:** Admin user cannot access admin endpoints
- **Solution:** Verify user has `role: "admin"` in Firestore document
- **Check:** Custom claims set properly (optional)

#### 4. Build Failures on Render
- **Problem:** Deployment fails during build
- **Solution:** Check build commands and dependencies
- **Verify:** Node.js version compatibility

### Support Resources
- [Render Documentation](https://render.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Angular Deployment Guide](https://angular.io/guide/deployment)
- [NestJS Deployment](https://docs.nestjs.com/deployment)

---

## 📞 Migration Support

If you encounter issues during migration:

1. **Check logs** in Render dashboard and Firebase Console
2. **Verify environment variables** are set correctly
3. **Test locally first** with new Firebase config
4. **Use staging environment** before production deployment
5. **Document any custom configurations** for future reference

---

*Generated for shoestore-workspace migration - Keep this document updated with any configuration changes*
