# Authorization Flow - Quick Reference

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    MASTER TABLES (Authorization)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────┐         ┌──────────────────────┐     │
│  │     ARMaster         │         │   ApproverMaster     │     │
│  ├──────────────────────┤         ├──────────────────────┤     │
│  │ ServiceName (KEY)    │         │ ServiceName (KEY)    │     │
│  │ AccessCode           │         │ RefValue1            │     │
│  │ RoleName             │         │ Status__c            │     │
│  │ Status__c            │         │ ...                  │     │
│  └──────────────────────┘         └──────────────────────┘     │
│           │                                  │                   │
└───────────┼──────────────────────────────────┼──────────────────┘
            │                                  │
            │ Validates & Copies               │ Validates & Copies
            │ AccessCode                       │ AccessKey
            ▼                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│              TRANSACTIONAL TABLES (Service Requests)             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────┐         ┌──────────────────────┐     │
│  │   ARChangeLog        │         │ ApproverChangeLog    │     │
│  ├──────────────────────┤         ├──────────────────────┤     │
│  │ SERVICE_NAME         │         │ SERVICE_NAME         │     │
│  │ ACCESS_KEY ◄─────────┼─────────┼─────────► ACCESS_KEY │     │
│  │ STATUS__C            │         │ STATUS__C            │     │
│  │ REQUESTOR            │         │ REQUESTOR            │     │
│  │ CREATE_DATE__C       │         │ CREATE_DATE__C       │     │
│  └──────────────────────┘         └──────────────────────┘     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Request Flow Diagram

### AR Request Flow
```
User Request
     │
     ▼
┌─────────────────────────────────┐
│ POST /ARChangeLog               │
│ { SERVICE_NAME: "FinanceService"│
│   REQUESTOR: "user@email.com" } │
└─────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────┐
│ Validate SERVICE_NAME           │
│ in ARMaster                     │
└─────────────────────────────────┘
     │
     ├─── Found ────────────────┐
     │                          │
     │                          ▼
     │              ┌─────────────────────────────┐
     │              │ Copy AccessCode to          │
     │              │ ACCESS_KEY                  │
     │              │ Set STATUS__C = 'Pending'   │
     │              │ Set audit fields            │
     │              └─────────────────────────────┘
     │                          │
     │                          ▼
     │              ┌─────────────────────────────┐
     │              │ ✅ Record Created           │
     │              │ ACCESS_KEY populated        │
     │              └─────────────────────────────┘
     │
     └─── Not Found ───────────┐
                               │
                               ▼
                   ┌─────────────────────────────┐
                   │ ❌ HTTP 400 Error           │
                   │ "Service not found"         │
                   └─────────────────────────────┘
```

### Approver Request Flow
```
Approver Request
     │
     ▼
┌─────────────────────────────────┐
│ POST /ApproverChangeLog         │
│ { SERVICE_NAME: "HRService"     │
│   REQUESTOR: "approver@co.com" }│
└─────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────┐
│ Validate SERVICE_NAME           │
│ in ApproverMaster               │
└─────────────────────────────────┘
     │
     ├─── Found ────────────────┐
     │                          │
     │                          ▼
     │              ┌─────────────────────────────┐
     │              │ Copy ServiceName to         │
     │              │ ACCESS_KEY                  │
     │              │ Set STATUS__C = 'Pending'   │
     │              │ Set audit fields            │
     │              └─────────────────────────────┘
     │                          │
     │                          ▼
     │              ┌─────────────────────────────┐
     │              │ ✅ Record Created           │
     │              │ ACCESS_KEY populated        │
     │              └─────────────────────────────┘
     │
     └─── Not Found ───────────┐
                               │
                               ▼
                   ┌─────────────────────────────┐
                   │ ❌ HTTP 400 Error           │
                   │ "Service not found"         │
                   └─────────────────────────────┘
```

## Validation Rules

| Field | Required | Validation | Action |
|-------|----------|------------|--------|
| SERVICE_NAME | ✅ Yes | Must exist in Master table | Lookup AccessCode |
| REQUESTOR | ❌ No | - | Auto-set if missing |
| STATUS__C | ❌ No | - | Default: 'Pending' |
| ACCESS_KEY | ❌ No | Auto-populated | Copied from Master |
| CREATE_DATE__C | ❌ No | Auto-set | Current date |
| MODIFIED_DATE__C | ❌ No | Auto-set | Current date |
| LAST_MODIFIED_BY__C | ❌ No | Auto-set | Current user |

## Data Flow Example

### Example 1: Successful AR Request
```
INPUT:
  POST /ARChangeLog
  {
    "SERVICE_NAME": "FinanceService",
    "REQUESTOR": "john.doe@company.com"
  }

LOOKUP:
  ARMaster WHERE ServiceName = 'FinanceService'
  → Found: AccessCode = 'ACC-FIN-2024-001'

OUTPUT:
  ARChangeLog Record Created:
  {
    "SERVICE_NAME": "FinanceService",
    "ACCESS_KEY": "ACC-FIN-2024-001",  ← Copied from ARMaster
    "REQUESTOR": "john.doe@company.com",
    "STATUS__C": "Pending",
    "CREATE_DATE__C": "2024-01-20",
    "MODIFIED_DATE__C": "2024-01-20",
    "LAST_MODIFIED_BY__C": "john.doe"
  }
```

### Example 2: Failed AR Request
```
INPUT:
  POST /ARChangeLog
  {
    "SERVICE_NAME": "InvalidService",
    "REQUESTOR": "jane.smith@company.com"
  }

LOOKUP:
  ARMaster WHERE ServiceName = 'InvalidService'
  → Not Found

OUTPUT:
  HTTP 400 Bad Request
  {
    "error": {
      "code": "400",
      "message": "Service 'InvalidService' not found in ARMaster. Request denied."
    }
  }
```

## Quick Test Commands

### Start Application
```bash
cds watch
```

### Test Valid Request
```bash
curl -X POST http://localhost:4004/odata/v4/bdc/ARChangeLog \
  -H "Content-Type: application/json" \
  -d '{"SERVICE_NAME":"FinanceService","REQUESTOR":"test@email.com"}'
```

### Test Invalid Request
```bash
curl -X POST http://localhost:4004/odata/v4/bdc/ARChangeLog \
  -H "Content-Type: application/json" \
  -d '{"SERVICE_NAME":"InvalidService","REQUESTOR":"test@email.com"}'
```

### View All Requests
```bash
curl http://localhost:4004/odata/v4/bdc/ARChangeLog
```

## Key Files

| File | Purpose |
|------|---------|
| `db/schema.cds` | Data model definitions |
| `srv/bdc-service.cds` | Service definitions & UI annotations |
| `srv/bdc-service.js` | Business logic & validation handlers |
| `db/data/*.csv` | Sample master data |
| `test-authorization.http` | HTTP test requests |

## Status Values

| Status | Meaning |
|--------|---------|
| Pending | Request created, awaiting approval |
| Approved | Request approved |
| Rejected | Request rejected |
| Completed | Request fulfilled |
