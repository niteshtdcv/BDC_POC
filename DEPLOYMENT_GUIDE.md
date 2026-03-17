# BTP Deployment Guide - Managed App Router

## Configuration for Email Links

### 1. Set Environment Variable in BTP
After deploying to BTP, you need to set the `LAUNCHPAD_URL` environment variable for your service:

```bash
# Get your HTML5 Application Repository URL
cf html5-list

# The URL format will be:
# https://<subdomain>.launchpad.cfapps.<region>.hana.ondemand.com/<namespace>.armaster/index.html

# Set the environment variable (replace with your actual Launchpad URL)
cf set-env BDC_POC-srv LAUNCHPAD_URL "https://<your-subdomain>.launchpad.cfapps.<region>.hana.ondemand.com"

# Restage the application
cf restage BDC_POC-srv
```

### 2. Build and Deploy

```bash
# Build the MTA archive
mbt build

# Deploy to BTP
cf deploy mta_archives/BDC_POC_1.0.0.mtar
```

### 3. Get Your Launchpad URL

After deployment:

```bash
# List HTML5 applications
cf html5-list

# Your apps will be accessible at:
# https://<subdomain>.launchpad.cfapps.<region>.hana.ondemand.com/<namespace>.armaster/index.html
# https://<subdomain>.launchpad.cfapps.<region>.hana.ondemand.com/<namespace>.arequest/index.html
```

### 4. Configure Gmail Settings

Update your service with Gmail credentials:

```bash
cf set-env BDC_POC-srv GMAIL_USER "your-email@gmail.com"
cf set-env BDC_POC-srv GMAIL_APP_PASSWORD "your-app-password"
cf restage BDC_POC-srv
```

## How Email Links Work with Managed App Router

1. **Email is sent** with LAUNCHPAD_URL as base URL
2. **User clicks link** → Goes to managed app router
3. **Authentication** happens via XSUAA
4. **Request is routed** through xs-app.json to srv-api destination
5. **Action executes** with proper authorization

## Troubleshooting

### Issue: "Unauthorized" when clicking email link
**Cause**: User not authenticated or LAUNCHPAD_URL not set
**Solution**: 
- Ensure LAUNCHPAD_URL environment variable is set
- Check user has proper role assignments
- Verify XSUAA configuration in xs-security.json

### Issue: "Not Found" when clicking email link  
**Cause**: Route not configured in xs-app.json
**Solution**:
- Verify xs-app.json has the approveRequest route
- Check destination "srv-api" is configured in mta.yaml
- Confirm app is deployed successfully

### Issue: Direct srv URL gives 401 error
**Cause**: This is expected - srv endpoint requires authentication
**Solution**: 
- Always use LAUNCHPAD_URL in emails (not srv URL)
- Direct srv access should only be for authenticated API calls

## Architecture

```
User clicks email link
    ↓
Managed App Router (Launchpad URL)
    ↓
XSUAA Authentication
    ↓
xs-app.json routing rules
    ↓
srv-api destination
    ↓
BDC_POC-srv (Backend Service)
    ↓
approveRequest action executed
```

## Important Notes

1. **Managed App Router** is handled by SAP BTP - no approuter module needed
2. **HTML5 Application Repository** serves your Fiori apps
3. **Launchpad URL** format: `https://<subdomain>.launchpad.cfapps.<region>.hana.ondemand.com`
4. **Email links must use Launchpad URL** - not srv URL
5. **xs-app.json** routes requests from managed app router to backend
