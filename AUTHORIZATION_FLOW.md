# Authorization Flow Validation

## Architecture Overview

### Master Tables (Authorization Repository)
- **ARMaster**: Contains AR authorization roles with AccessCode
- **ApproverMaster**: Contains Approver authorization roles with access details

### Transactional Tables (Authorization Requests)
- **ARChangeLog**: AR authorization requests/changes
- **ApproverChangeLog**: Approver authorization requests/changes

## Authorization Request Flow

### 1. AR Authorization Request
When a user requests AR authorization:
1. User creates entry in **ARChangeLog** with ROLE_NAME
2. System validates ROLE_NAME exists in **ARMaster**
3. If valid, system copies **AccessCode** from ARMaster to **ACCESS_KEY** in ARChangeLog
4. If invalid, request is rejected with error message
5. Request status set to 'Pending'

### 2. Approver Authorization Request
When an approver requests authorization:
1. Approver creates entry in **ApproverChangeLog** with ROLE_NAME
2. System validates ROLE_NAME exists in **ApproverMaster.RefValue1**
3. If valid, system copies access details to **ACCESS_KEY** in ApproverChangeLog
4. If invalid, request is rejected with error message
5. Request status set to 'Pending'

## Key Validations

### ARChangeLog Creation
- ✅ ROLE_NAME must exist in ARMaster.RoleName
- ✅ ACCESS_KEY automatically populated from ARMaster.AccessCode
- ✅ Audit fields (CREATE_DATE__C, MODIFIED_DATE__C, LAST_MODIFIED_BY__C) auto-set
- ✅ STATUS__C defaults to 'Pending'

### ApproverChangeLog Creation
- ✅ ROLE_NAME must exist in ApproverMaster.RefValue1
- ✅ ACCESS_KEY automatically populated from ApproverMaster
- ✅ Audit fields auto-set
- ✅ STATUS__C defaults to 'Pending'

## Data Flow Example

### Example 1: Valid AR Request
```
Master Table (ARMaster):
  RoleName: "AR_ADMIN"
  AccessCode: "AR-2024-001"

User Request (ARChangeLog):
  ROLE_NAME: "AR_ADMIN"
  REQUESTOR: "john.doe"

System Action:
  ✅ Validates "AR_ADMIN" exists
  ✅ Copies AccessCode "AR-2024-001" to ACCESS_KEY
  ✅ Creates record with STATUS__C = 'Pending'
```

### Example 2: Invalid AR Request
```
Master Table (ARMaster):
  RoleName: "AR_ADMIN" (only this exists)

User Request (ARChangeLog):
  ROLE_NAME: "AR_INVALID"
  REQUESTOR: "john.doe"

System Action:
  ❌ Error: "Role 'AR_INVALID' not found in ARMaster. Authorization denied."
  ❌ Record creation blocked
```

## Implementation Details

### Service Layer (bdc-service.js)
- `getAccessCodeFromMaster()`: Looks up AccessCode by RoleName in ARMaster
- `getAccessKeyFromApproverMaster()`: Looks up access details by RoleName in ApproverMaster
- `before('CREATE', ARChangeLog)`: Validates and populates ACCESS_KEY
- `before('CREATE', ApproverChangeLog)`: Validates and populates ACCESS_KEY

### Service Definition (bdc-service.cds)
- ARChangeLog and ApproverChangeLog are insertable/updatable
- Associations link master to transactional tables
- UI annotations for change log display

## Testing Scenarios

### Test 1: Create AR Request with Valid Role
```http
POST /odata/v4/bdc/ARChangeLog
{
  "ROLE_NAME": "AR_ADMIN",
  "REQUESTOR": "test.user",
  "SERVICE_NAME": "Finance"
}
Expected: ✅ Record created with ACCESS_KEY populated
```

### Test 2: Create AR Request with Invalid Role
```http
POST /odata/v4/bdc/ARChangeLog
{
  "ROLE_NAME": "INVALID_ROLE",
  "REQUESTOR": "test.user"
}
Expected: ❌ 400 Error - Role not found
```

### Test 3: Create Approver Request with Valid Role
```http
POST /odata/v4/bdc/ApproverChangeLog
{
  "ROLE_NAME": "APPROVER_L1",
  "REQUESTOR": "approver.user"
}
Expected: ✅ Record created with ACCESS_KEY populated
```

## Security Considerations
- Only authorized roles in master tables can be requested
- Master tables control available authorizations
- Audit trail maintained in change logs
- User identity captured in LAST_MODIFIED_BY__C
