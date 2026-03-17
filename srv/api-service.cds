using {com.sap.bdc as bdc} from '../db/schema';

service BDCApi {
    entity ARMasterAPI  as projection on bdc.ARMaster;
    entity ARChangeLogAPI  as projection on bdc.ARChangeLog;
}