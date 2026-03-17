# BDC Authorization Application

A CAP (Cloud Application Programming Model) application implementing an authorization request system with master-transactional table validation.

## Overview

This application manages authorization requests where:
- **Master Tables** (ARMaster, ApproverMaster) store authorized services with access keys
- **Transactional Tables** (ARChangeLog, ApproverChangeLog) store service requests
- Requests are validated against master tables by **ServiceName**
- Access keys are automatically copied from master to transactional records

## Quick Start

```bash
npm install
cds watch
```

Application runs at: `http://localhost:4004`

## Architecture

### Master Tables (Authorization Repository)
- **ARMaster**: AR authorization master with ServiceName → AccessCode mapping
- **ApproverMaster**: Approver authorization master with ServiceName → AccessKey mapping

### Transactional Tables (Service Requests)
- **ARChangeLog**: AR service requests (validated against ARMaster)
- **ApproverChangeLog**: Approver service requests (validated against ApproverMaster)

## Request Flow

1. User creates request with `SERVICE_NAME`
2. System validates `SERVICE_NAME` exists in master table
3. If valid: Copy `AccessCode` → `ACCESS_KEY` and create record
4. If invalid: Return error message

## Testing

Use the provided test file:
```bash
# Open test-authorization.http in VS Code with REST Client extension
# Or use curl commands from QUICK_REFERENCE.md
```

### Sample Test Request
```http
POST http://localhost:4004/odata/v4/bdc/ARChangeLog
Content-Type: application/json

{
  "SERVICE_NAME": "FinanceService",
  "REQUESTOR": "user@company.com",
  "SHORT_DESCRIPTION__C": "Request Finance access"
}
```

**Expected Result**: Record created with `ACCESS_KEY = "ACC-FIN-2024-001"`

## Documentation

- **[IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)** - Complete implementation details
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Visual diagrams and quick commands
- **[test-authorization.http](test-authorization.http)** - HTTP test requests

## Project Structure

File or Folder | Purpose
---------|----------
`app/` | UI frontends (Fiori Elements)
`db/` | Data models and sample data
`db/schema.cds` | Entity definitions (Master & Transactional tables)
`db/data/*.csv` | Sample master data for testing
`srv/` | Service models and business logic
`srv/bdc-service.cds` | OData service definitions
`srv/bdc-service.js` | Validation and authorization logic
`test-authorization.http` | HTTP test requests
`IMPLEMENTATION_GUIDE.md` | Detailed implementation documentation
`QUICK_REFERENCE.md` | Visual flow diagrams
`package.json` | Project metadata and configuration

## Key Features

✅ **ServiceName Validation**: Requests validated against master tables  
✅ **Automatic AccessKey Copy**: Access keys auto-populated from master  
✅ **Error Handling**: Clear error messages for invalid requests  
✅ **Audit Trail**: Automatic tracking of user, date, and status  
✅ **Fiori Compatible**: UI annotations for Fiori Elements  
✅ **OData V4**: RESTful API with full CRUD operations  

## API Endpoints

### Master Tables
- `GET/POST /odata/v4/bdc/ARMaster` - AR authorization master
- `GET/POST /odata/v4/bdc/ApproverMaster` - Approver authorization master

### Transactional Tables (with validation)
- `GET/POST /odata/v4/bdc/ARChangeLog` - AR service requests
- `GET/POST /odata/v4/bdc/ApproverChangeLog` - Approver service requests

## Sample Data

Pre-loaded master data:

**ARMaster**:
- FinanceService → ACC-FIN-2024-001
- HRService → ACC-HR-2024-002
- ProcurementService → ACC-PROC-2024-003
- SalesService → ACC-SALES-2024-004

**ApproverMaster**:
- FinanceService → Finance_Approver
- HRService → HR_Approver
- ProcurementService → Procurement_Approver
- SalesService → Sales_Approver

## Validation Rules

| Rule | Description |
|------|-------------|
| SERVICE_NAME required | Must be provided in request |
| SERVICE_NAME must exist | Must match master table record |
| ACCESS_KEY auto-populated | Copied from master table |
| STATUS__C defaults | Set to 'Pending' if not provided |
| Audit fields auto-set | User, dates automatically tracked |

## Error Messages

- `"SERVICE_NAME is required"` - Missing SERVICE_NAME field
- `"Service 'X' not found in ARMaster. Request denied."` - Invalid AR service
- `"Service 'X' not found in ApproverMaster. Request denied."` - Invalid approver service


## Next Steps

- Open a new terminal and run `cds watch`
- (in VS Code simply choose _**Terminal** > Run Task > cds watch_)
- Start adding content, for example, a [db/schema.cds](db/schema.cds).


## Learn More

Learn more at https://cap.cloud.sap/docs/get-started/.


## Technology Stack

- **SAP Cloud Application Programming Model (CAP)**
- **Node.js** - Runtime environment
- **SQLite** - Local development database
- **OData V4** - RESTful API protocol
- **Fiori Elements** - UI framework

## Additional Resources

- [CAP Documentation](https://cap.cloud.sap/docs/)
- [Fiori Elements](https://ui5.sap.com/test-resources/sap/fe/core/fpmExplorer/index.html)
- [OData V4](https://www.odata.org/documentation/)
