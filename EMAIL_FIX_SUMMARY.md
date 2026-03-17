# Quick Fix Summary - Email Links in BTP

## ✅ Changes Made

### 1. Updated Email URL Generation ([srv/bdc-service.js](srv/bdc-service.js))
- Changed from `APP_URL` to `LAUNCHPAD_URL` 
- Now uses managed app router URL instead of direct srv URL

### 2. Added Navigation Configuration
- **armaster**: Added crossNavigation inbounds to [app/armaster/webapp/manifest.json](app/armaster/webapp/manifest.json)
- **arequest**: Added crossNavigation inbounds to [app/arequest/webapp/manifest.json](app/arequest/webapp/manifest.json)

### 3. Updated Routing ([xs-app.json](app/armaster/xs-app.json))
- Added specific route for `approveRequest` action
- Ensures email links route correctly through managed app router

### 4. Enhanced MTA Configuration
- Added HTML5 repo host dependency to srv module
- Increased memory limits for stability

## 🚀 Next Steps

### Step 1: Deploy Your Application
```bash
mbt build
cf deploy mta_archives/BDC_POC_1.0.0.mtar
```

### Step 2: Get Your Launchpad URL
```bash
cf html5-list
```
You'll see output like:
```
name: BDC_POC.armaster
URL: https://xxxxx.launchpad.cfapps.eu10.hana.ondemand.com/...
```

### Step 3: Set Environment Variables
```bash
# Set the Launchpad base URL (without the app-specific part)
cf set-env BDC_POC-srv LAUNCHPAD_URL "https://xxxxx.launchpad.cfapps.eu10.hana.ondemand.com"

# Set Gmail credentials
cf set-env BDC_POC-srv GMAIL_USER "your-email@gmail.com"
cf set-env BDC_POC-srv GMAIL_APP_PASSWORD "your-app-password"

# Restart the app
cf restage BDC_POC-srv
```

## 📧 Email Link Flow (Fixed)

**Before (❌ Broken):**
```
Email → srv URL → 401 Unauthorized (no authentication)
```

**After (✅ Working):**
```
Email → Launchpad URL → Managed App Router → XSUAA Auth → 
xs-app.json routing → srv-api destination → Backend Action ✓
```

## 🔍 Understanding the URLs

| URL Type | Example | Usage | Auth Required |
|----------|---------|-------|---------------|
| **Srv URL** | `https://xxx-srv.cfapps.eu10.hana.ondemand.com` | Direct API calls only | Yes (Bearer token) |
| **Launchpad URL** | `https://xxx.launchpad.cfapps.eu10.hana.ondemand.com` | User-facing links | Handled by managed router |

## ⚠️ Important

1. **Never use srv URL in emails** - Users can't authenticate
2. **Always use LAUNCHPAD_URL** - Managed app router handles authentication
3. **Set environment variable** after deployment - Code reads `process.env.LAUNCHPAD_URL`
4. **Assign roles to users** - They need User or Admin role from role-collection

## 🧪 Testing

### Test Email Link Locally
```bash
# Start with hybrid profile
cds w --profile hybrid

# URL will be: http://localhost:4004/odata/v4/bdc/approveRequest?...
```

### Test in BTP
1. Create a test record
2. Check email for approval link
3. Click link → Should redirect to Launchpad → Authenticate → Execute action
4. Verify in app that status changed

## 📝 Files Modified

1. [srv/bdc-service.js](srv/bdc-service.js) - Email URL logic
2. [app/armaster/webapp/manifest.json](app/armaster/webapp/manifest.json) - Navigation config
3. [app/arequest/webapp/manifest.json](app/arequest/webapp/manifest.json) - Navigation config  
4. [app/armaster/xs-app.json](app/armaster/xs-app.json) - Routing rules
5. [app/arequest/xs-app.json](app/arequest/xs-app.json) - Routing rules
6. [mta.yaml](mta.yaml) - HTML5 dependency

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for complete details.
