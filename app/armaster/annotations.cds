using BDCService as service from '../../srv/bdc-service';

annotate service.ARMaster with @(
    UI.FieldGroup #GeneratedGroup: {
        $Type: 'UI.FieldGroupType',
        Data : [
           
            {
                $Type: 'UI.DataField',

                Value: CreateDate__c,
            },

            {
                $Type: 'UI.DataField',

                Value: ModifiedDate__c,
            },
            {
                $Type: 'UI.DataField',

                Value: Status__c,
            },
            {
                $Type: 'UI.DataField',

                Value: ShortDescription__c,
            },

            {
                $Type: 'UI.DataField',
                Label: 'AccessCode',
                Value: AccessCode,
            },
            {
                $Type: 'UI.DataField',
                Label: 'RecordID',
                Value: RecordID,
            },
            {
                $Type: 'UI.DataField',
                Label: 'ValidFrom',
                Value: ValidFrom,
            },
            {
                $Type: 'UI.DataField',
                Label: 'RoleStatus',
                Value: RoleStatus,
            },

            {
                $Type: 'UI.DataField',
                Label: 'ServiceName',
                Value: ServiceName,
            },
            {
                $Type: 'UI.DataField',
                Label: 'RoleName',
                Value: RoleName,
            },
            {
                $Type: 'UI.DataField',
                Label: 'EntityName',
                Value: EntityName,
            },
            {
                $Type: 'UI.DataField',
                Label: 'TrigramCompany',
                Value: TrigramCompany,
            },
            {
                $Type: 'UI.DataField',

                Value: CountryLocation,
            },
            {
                $Type: 'UI.DataField',

                Value: CompanyCode,
            },

            {
                $Type: 'UI.DataField',
                Label: 'Purchase Organization',
                Value: PurchaseOrganization,
            },
            {
                $Type: 'UI.DataField',
                Label: 'Sales Organization',
                Value: SalesOrganization,
            },
            {
                $Type: 'UI.DataField',
                Label: 'Organization Unit',
                Value: OrganizationUnit,
            },
            {
                $Type: 'UI.DataField',

                Value: RegionSite,
            },

            {
                $Type: 'UI.DataField',
                Label: 'MarketArea',
                Value: MarketArea,
            },
           
            {
                $Type: 'UI.DataField',

                Value: BusinessUnit,
            },

        ],
    },
    UI.Facets                    : [{
        $Type : 'UI.ReferenceFacet',
        ID    : 'GeneratedFacet1',
        Label : 'General Information',
        Target: '@UI.FieldGroup#GeneratedGroup',
    }, ],
    UI.LineItem                  : [
        {
            $Type: 'UI.DataField',
            Label: 'Access Related Code',
            Value: AccessCode,
        },
        {
            $Type: 'UI.DataField',

            Value: ServiceName,
        },
        {
            $Type: 'UI.DataField',

            Value: RoleName,
        },
        {
            $Type: 'UI.DataField',

            Value: RegionSite,
        },
        {
            $Type: 'UI.DataField',

            Value: CompanyCode,
        },
        
        {
            $Type: 'UI.DataField',

            Value: APPROVAL_STATUS
        },
    ],
    Capabilities                 : {
        InsertRestrictions: {Insertable: true},
        UpdateRestrictions: {Updatable: true},
        DeleteRestrictions: {Deletable: true}
    }
);
