namespace com.sap.bdc;

using { com.sap.bdc as bdc } from '../schema';

// Sample ARMaster data with ServiceName and AccessCode
entity ARMaster.csv {
  ID : String;
  ServiceName : String;
  AccessCode : String;
  RoleName : String;
  Status__c : String;
}

// Sample ApproverMaster data with ServiceName
entity ApproverMaster.csv {
  ID : String;
  ServiceName : String;
  RefValue1 : String;
  Status__c : String;
}
