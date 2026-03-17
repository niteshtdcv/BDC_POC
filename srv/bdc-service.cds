using {com.sap.bdc as bdc} from '../db/schema';

service BDCService @(requires: [
  'User',
  'Admin'
]) {
  // Master tables for authorization
  @odata.draft.enabled
  @odata.draft.bypass
  entity ARMaster          as projection on bdc.ARMaster;

  @odata.draft.enabled

  entity ApproverMaster    as projection on bdc.ApproverMaster;

  // Transactional tables for service requests
  @odata.draft.enabled
   @odata.draft.bypass
  entity ARChangeLog       as projection on bdc.ARChangeLog;

  @odata.draft.enabled
  entity ApproverChangeLog as projection on bdc.ApproverChangeLog;

  // Admin view - all records
  @readonly

  entity ARChangeLogAll    as projection on bdc.ARChangeLog;

  @readonly

  entity ARMasterAll       as projection on bdc.ARMaster;

  // Approval action endpoint
  function approveRequest(id: String, action: String, entity: String) returns String;
}

annotate BDCService.ARMaster with @Capabilities: {
  InsertRestrictions: {Insertable: true},
  UpdateRestrictions: {Updatable: true},
  DeleteRestrictions: {Deletable: true}
};

annotate BDCService.ARMaster {
  RequestID__c        @title: 'Request ID';
  ServiceName         @title: 'Service Name';
  AccessCode          @title: 'Access Code';
  APPROVAL_STATUS     @title: 'Approval Status';
  Status__c           @title: 'Status';
  Submitter__c        @title: 'Submitter';
  ShortDescription__c @title: 'Description';
  CompanyCode         @title: 'Company Code';
  EntityName          @title: 'Entity Name';
  RoleName            @title: 'Role Name';
  CountryLocation     @title: 'Country';
  BusinessUnit        @title: 'Business Unit';
  OrganizationUnit    @title: 'Organization Unit';
  RegionSite          @title: 'Region/Site';
  CreateDate__c       @title: 'Created On';
  ModifiedDate__c     @title: 'Modified On';
  LastModifiedBy__c   @title: 'Modified By';
  ValidFrom           @title: 'Valid From';
  ValidTo             @title: 'Valid To';
  RoleStatus          @title: 'Role Status';
};

annotate BDCService.ApproverMaster with @Capabilities: {
  InsertRestrictions: {Insertable: true},
  UpdateRestrictions: {Updatable: true},
  DeleteRestrictions: {Deletable: true}
};

annotate BDCService.ARChangeLog with @(
  Capabilities: {
    InsertRestrictions: {Insertable: true},
    UpdateRestrictions: {Updatable: true},
    DeleteRestrictions: {Deletable: true}
  },
  UI          : {LineItem: [
    {
      Value: REQUEST_ID__C,
      Label: 'Request ID'
    },
    {
      Value: SERVICE_NAME,
      Label: 'Service Name'
    },
    {
      Value: ACCESS_KEY,
      Label: 'Access Key'
    },
    {
      Value: APPROVAL_STATUS,
      Label: 'Approval Status'
    },
    {
      Value: STATUS__C,
      Label: 'Status'
    },
    {
      Value: REQUESTOR,
      Label: 'Requestor'
    },
    {
      Value: CREATE_DATE__C,
      Label: 'Created On'
    }
  ]}
);

annotate BDCService.ARChangeLog {
  REQUEST_ID__C        @title: 'Request ID';
  SERVICE_NAME         @title: 'Service Name';
  ACCESS_KEY           @title: 'Access Key';
  APPROVAL_STATUS      @title: 'Approval Status';
  STATUS__C            @title: 'Status';
  REQUESTOR            @title: 'Requestor';
  SHORT_DESCRIPTION__C @title: 'Description';
  COMPANY_CODE         @title: 'Company Code';
  ENTITY_NAME          @title: 'Entity Name';
  ROLE_NAME            @title: 'Role Name';
  COUNTRY_LOCATION     @title: 'Country';
  BUSINESS_UNIT        @title: 'Business Unit';
  ORGANIZATION_UNIT    @title: 'Organization Unit';
  REGION_SITE          @title: 'Region/Site';
  CREATE_DATE__C       @title: 'Created On';
  MODIFIED_DATE__C     @title: 'Modified On';
  LAST_MODIFIED_BY__C  @title: 'Modified By';
  VALID_FROM           @title: 'Valid From';
  VALID_TO             @title: 'Valid To';
};

annotate BDCService.ApproverChangeLog with @(
  Capabilities: {
    InsertRestrictions: {Insertable: true},
    UpdateRestrictions: {Updatable: true},
    DeleteRestrictions: {Deletable: true}
  },
  UI          : {LineItem: [
    {
      Value: REQUEST_ID__C,
      Label: 'Request ID'
    },
    {
      Value: SERVICE_NAME,
      Label: 'Service Name'
    },
    {
      Value: ACCESS_KEY,
      Label: 'Access Key'
    },
    {
      Value: STATUS__C,
      Label: 'Status'
    },
    {
      Value: REQUESTOR,
      Label: 'Requestor'
    },
    {
      Value: CREATE_DATE__C,
      Label: 'Created On'
    }
  ]}
);
