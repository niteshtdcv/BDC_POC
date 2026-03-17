# CAP Authorization Application - Implementation Guide

## Overview
This CAP application implements an authorization request system where master tables (ARMaster, ApproverMaster) control access, and transactional tables (ARChangeLog, ApproverChangeLog) store service requests.

## Architecture

### Master Tables (Authorization Repository)
- **ARMaster**: Authorization master for AR requests
  - Key field: `ServiceName`
  - Authorization field: `AccessCode`
  
- **ApproverMaster**: Authorization master for approver requests
  - Key field: `ServiceName`
  - Authorization field: Derived from `ServiceName`

### Transactional Tables (Service Requests)
- **ARChangeLog**: Stores AR service requests
  - Validation field: `SERVICE_NAME`
  - Populated field: `ACCESS_KEY` (copied from ARMaster.AccessCode)
  
- **ApproverChangeLog**: Stores approver service requests
  - Validation field: `SERVICE_NAME`
  - Populated field: `ACCESS_KEY` (copied from ApproverMaster)

## Request Flow

### AR Request Flow
```
1. User creates ARChangeLog entry with SERVICE_NAME
2. System validates SERVICE_NAME exists in ARMaster
3. If valid:
   - Copy ARMaster.AccessCode → ARChangeLog.ACCESS_KEY
   - Set STATUS__C = 'Pending'
   - Set audit fields (CREATE_DATE__C, MODIFIED_DATE__C, LAST_MODIFIED_BY__C)
   - Create record
4. If invalid:
   - Return error: "Service '{ServiceName}' not found in ARMaster. Request denied."
```

### Approver Request Flow
```
1. Approver creates ApproverChangeLog entry with SERVICE_NAME
2. System validates SERVICE_NAME exists in ApproverMaster
3. If valid:
   - Copy ApproverMaster.ServiceName → ApproverChangeLog.ACCESS_KEY
   - Set STATUS__C = 'Pending'
   - Set audit fields
   - Create record
4. If invalid:
   - Return error: "Service '{ServiceName}' not found in ApproverMaster. Request denied."
```

## Implementation Details

### Service Handler (srv/bdc-service.js)

#### Key Functions
```javascript
// Lookup AccessCode from ARMaster by ServiceName
getAccessCodeFromARMaster(serviceName)

// Lookup AccessKey from ApproverMaster by ServiceName
getAccessKeyFromApproverMaster(serviceName)
```

#### Event Handlers
```javascript
// ARChangeLog CREATE - Validates and copies AccessKey
this.before('CREATE', ARChangeLog, async (req) => {...})

// ApproverChangeLog CREATE - Validates and copies AccessKey
this.before('CREATE', ApproverChangeLog, async (req) => {...})

// Master table handlers for audit fields
this.before('CREATE', ARMaster, (req) => {...})
this.before('UPDATE', ARMaster, (req) => {...})
this.before('CREATE', ApproverMaster, (req) => {...})
this.before('UPDATE', ApproverMaster, (req) => {...})
```

### Service Definition (srv/bdc-service.cds)

#### Exposed Entities
```cds
service BDCService {
  entity ARMaster as projection on bdc.ARMaster;
  entity ApproverMaster as projection on bdc.ApproverMaster;
  entity ARChangeLog as projection on bdc.ARChangeLog;
  entity ApproverChangeLog as projection on bdc.ApproverChangeLog;
}
```

#### Capabilities
- Master tables: Full CRUD operations with draft support
- Transactional tables: Create and Read operations (no delete)

## Testing

### Prerequisites
1. Start the application: `cds watch`
2. Service runs on: `http://localhost:4004`

### Test Scenarios

#### Scenario 1: Valid AR Request
```http
POST http://localhost:4004/odata/v4/bdc/ARChangeLog
Content-Type: application/json

{
  "SERVICE_NAME": "FinanceService",
  "REQUESTOR": "john.doe@company.com",
  "SHORT_DESCRIPTION__C": "Request Finance access"
}
```
**Expected Result**: 
- ✅ Record created
- ACCESS_KEY = "ACC-FIN-2024-001" (from ARMaster)
- STATUS__C = "Pending"

#### Scenario 2: Invalid AR Request
```http
POST http://localhost:4004/odata/v4/bdc/ARChangeLog
Content-Type: application/json

{
  "SERVICE_NAME": "InvalidService",
  "REQUESTOR": "jane.smith@company.com"
}
```
**Expected Result**: 
- ❌ HTTP 400 Error
- Message: "Service 'InvalidService' not found in ARMaster. Request denied."

#### Scenario 3: Missing ServiceName
```http
POST http://localhost:4004/odata/v4/bdc/ARChangeLog
Content-Type: application/json

{
  "REQUESTOR": "test.user@company.com"
}
```
**Expected Result**: 
- ❌ HTTP 400 Error
- Message: "SERVICE_NAME is required"

### Sample Master Data

#### ARMaster
| ServiceName | AccessCode | RoleName | Status__c |
|------------|------------|----------|-----------|
| FinanceService | ACC-FIN-2024-001 | Finance_Admin | Active |
| HRService | ACC-HR-2024-002 | HR_Manager | Active |
| ProcurementService | ACC-PROC-2024-003 | Procurement_Lead | Active |
| SalesService | ACC-SALES-2024-004 | Sales_Manager | Active |

#### ApproverMaster
| ServiceName | RefValue1 | Status__c |
|------------|-----------|-----------|
| FinanceService | Finance_Approver | Active |
| HRService | HR_Approver | Active |
| ProcurementService | Procurement_Approver | Active |
| SalesService | Sales_Approver | Active |

## Fiori Elements UI

### List Pages
- ARChangeLog and ApproverChangeLog display:
  - Request ID
  - Service Name
  - Access Key (auto-populated)
  - Status
  - Requestor
  - Created On

### Object Pages
- Draft-enabled for master tables
- Read-only ACCESS_KEY field in transactional tables
- Validation messages displayed on error

## Security Features
1. **Validation**: Only services in master tables can be requested
2. **Audit Trail**: All requests capture user and timestamp
3. **Access Control**: AccessKey automatically populated from master
4. **Error Handling**: Clear error messages for invalid requests

## API Endpoints

### OData V4 Service
- Base URL: `http://localhost:4004/odata/v4/bdc`

### Entities
- `GET /ARMaster` - List all AR master records
- `POST /ARMaster` - Create new AR master record
- `GET /ApproverMaster` - List all approver master records
- `POST /ApproverMaster` - Create new approver master record
- `GET /ARChangeLog` - List all AR requests
- `POST /ARChangeLog` - Create new AR request (with validation)
- `GET /ApproverChangeLog` - List all approver requests
- `POST /ApproverChangeLog` - Create new approver request (with validation)

## Deployment

### Local Development
```bash
npm install
cds watch
```

### Production Deployment
```bash
cds build --production
cf push
```

## Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "SERVICE_NAME is required" | Missing SERVICE_NAME in request | Provide SERVICE_NAME field |
| "Service 'X' not found in ARMaster" | ServiceName doesn't exist in master | Add service to ARMaster first |
| "Service 'X' not found in ApproverMaster" | ServiceName doesn't exist in master | Add service to ApproverMaster first |

## Best Practices
1. Always create master records before allowing requests
2. Use meaningful ServiceName values
3. Keep AccessCode unique and traceable
4. Monitor STATUS__C for request lifecycle
5. Review audit fields for compliance
