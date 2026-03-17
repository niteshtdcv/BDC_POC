# Email Approval Flow Documentation

## Overview
ARChangeLog records now have an APPROVAL_STATUS field with email-based approval workflow.

## Approval Status Values

1. **Sent for Approval** (Default)
   - Automatically set when record is created
   - Approval email sent to approver
   - Record NOT visible to end users

2. **Approved**
   - Set when approver clicks "Approve" in email
   - Record becomes visible to end users
   - Only approved records shown in UI

3. **Rejected**
   - Set when approver clicks "Reject" in email
   - Record NOT visible to end users

## Setup

### 1. Configure Email Settings
Copy `.env.example` to `.env` and configure:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
DEFAULT_APPROVER=approver@company.com
APP_URL=http://localhost:4004
```

### 2. Gmail Setup (if using Gmail)
- Enable 2-factor authentication
- Generate App Password: https://myaccount.google.com/apppasswords
- Use App Password in SMTP_PASS

## Flow

### Record Creation
```http
POST http://localhost:4004/odata/v4/bdc/ARChangeLog
Content-Type: application/json

{
  "SERVICE_NAME": "FinanceService",
  "REQUESTOR": "user@company.com",
  "APPROVER": "approver@company.com",
  "SHORT_DESCRIPTION__C": "Request Finance access"
}
```

**Result:**
- Record created with APPROVAL_STATUS = "Sent for Approval"
- Email sent to approver with Approve/Reject links
- Record NOT visible in UI list

### Email Approval
Approver receives email with two links:
- **Approve**: `http://localhost:4004/odata/v4/bdc/approveRequest?id={ID}&action=approve`
- **Reject**: `http://localhost:4004/odata/v4/bdc/approveRequest?id={ID}&action=reject`

### Manual Approval (Alternative)
```http
GET http://localhost:4004/odata/v4/bdc/approveRequest(id='<record-id>',action='approve')
```

```http
GET http://localhost:4004/odata/v4/bdc/approveRequest(id='<record-id>',action='reject')
```

## Data Filtering

### End User View
- Only records with APPROVAL_STATUS = "Approved" are visible
- Automatic filtering applied on READ operations

### Admin View (All Records)
To see all records including pending/rejected (requires custom endpoint):
```javascript
// Add to bdc-service.js for admin access
this.on('READ', 'ARChangeLogAll', async (req) => {
  return SELECT.from(ARChangeLog);
});
```

## Testing

### 1. Create Request
```bash
curl -X POST http://localhost:4004/odata/v4/bdc/ARChangeLog \
  -H "Content-Type: application/json" \
  -d '{
    "SERVICE_NAME": "FinanceService",
    "REQUESTOR": "user@company.com",
    "APPROVER": "approver@company.com",
    "SHORT_DESCRIPTION__C": "Test request"
  }'
```

### 2. Check Email
- Approver receives email with Approve/Reject buttons

### 3. Approve Request
Click "Approve" link in email or:
```bash
curl "http://localhost:4004/odata/v4/bdc/approveRequest?id=<ID>&action=approve"
```

### 4. Verify Visibility
```bash
curl http://localhost:4004/odata/v4/bdc/ARChangeLog
```
Only approved records returned.

## Email Template

The approval email includes:
- Service Name
- Requestor
- Description
- Request ID
- Approve button (green)
- Reject button (red)

## Security Notes

- Store credentials in `.env` file (never commit to git)
- Add `.env` to `.gitignore`
- Use app-specific passwords for Gmail
- Consider using AWS SES or SendGrid for production
- Implement authentication for approval endpoints in production

## Production Considerations

1. **Authentication**: Add OAuth/JWT to approval endpoints
2. **Email Service**: Use AWS SES, SendGrid, or similar
3. **Logging**: Track all approval/rejection actions
4. **Notifications**: Send confirmation emails to requestors
5. **Expiry**: Add time limits for approval links
6. **Audit Trail**: Store approval history in STATUS_HISTORY field
