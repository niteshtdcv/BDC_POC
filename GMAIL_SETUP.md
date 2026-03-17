# Gmail Setup for Email Approval

## Steps to Configure Gmail SMTP

### 1. Enable 2-Factor Authentication
- Go to: https://myaccount.google.com/security
- Enable "2-Step Verification"

### 2. Generate App Password
- Go to: https://myaccount.google.com/apppasswords
- Select "Mail" and "Windows Computer"
- Click "Generate"
- Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### 3. Update .env File
Edit `c:\BTP\BDC_POC\.env`:

```
GMAIL_USER=your-actual-email@gmail.com
GMAIL_APP_PASSWORD=abcdefghijklmnop
APP_URL=http://localhost:4004
```

**Note:** Remove spaces from the app password

### 4. Restart Application
```bash
# Stop current server (Ctrl+C)
cds watch
```

## Testing

Create a record to trigger email:
```http
POST http://localhost:4004/odata/v4/bdc/ARChangeLog
Content-Type: application/json

{
  "SERVICE_NAME": "FinanceService",
  "REQUESTOR": "user@company.com",
  "SHORT_DESCRIPTION__C": "Test approval email"
}
```

Email will be sent to: **nitesh1311@gmail.com**

## Troubleshooting

- Ensure 2FA is enabled on your Gmail account
- Use App Password, NOT your regular Gmail password
- Remove all spaces from the 16-character app password
- Check Gmail "Less secure app access" is NOT needed (App Passwords work with 2FA)
