using BDCService as service from '../../srv/bdc-service';
annotate service.ARChangeLog with @(
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Value : SERVICE_NAME,
        },
        {
            $Type : 'UI.DataField',
            Value : REQUESTOR,
        },
        {
            $Type : 'UI.DataField',
            Value : SHORT_DESCRIPTION__C,
        },
        {
            $Type : 'UI.DataField',
            Value : STATUS__C,
        },
        {
            $Type : 'UI.DataField',
            Value : ACCESS_KEY,
        },
         {
            $Type : 'UI.DataField',
            Value : AR_SIGNUM,
        },
         {
            $Type : 'UI.DataField',
            Value : COMPANY_CODE,
        },
         {
            $Type : 'UI.DataField',
            Value : COUNTRY_LOCATION,
        }
    ],
    UI.FieldGroup #GeneratedGroup : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
               
                Value : REQUEST_ID__C,
            },
            {
                $Type : 'UI.DataField',
               
                Value : MODIFIED_DATE__C,
            },
            {
                $Type : 'UI.DataField',
              
                Value : LAST_MODIFIED_BY__C,
            },
            {
                $Type : 'UI.DataField',
                
                Value : CREATE_DATE__C,
            },
           
            {
                $Type : 'UI.DataField',
               
                Value : REQUESTOR,
            },
            
            {
                $Type : 'UI.DataField',
              
                Value : SERVICE_NAME,
            },
            {
                $Type : 'UI.DataField',
             
                Value : ROLE_NAME,
            },
            {
                $Type : 'UI.DataField',
               
                Value : ENTITY_NAME,
            },
          
            {
                $Type : 'UI.DataField',
              
                Value : COUNTRY_LOCATION,
            },
            {
                $Type : 'UI.DataField',
              
                Value : COMPANY_CODE,
            },
            
            {
                $Type : 'UI.DataField',
                Label : 'Purchase Organization',
                Value : PURCHASE_ORGANIZATION,
            },
            {
                $Type : 'UI.DataField',
               Label : 'Sales Organization',
                Value : SALES_ORGANIZATION,
            },
            {
                $Type : 'UI.DataField',
                
                Value : ORGANIZATION_UNIT,
            },
            {
                $Type : 'UI.DataField',
               
                Value : REGION_SITE,
            },
           
            {
                $Type : 'UI.DataField',
               
                Value : ACCESS_KEY,
            }      
           
          
        ],
    },
    UI.Facets : [
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'GeneratedFacet1',
            Label : 'General Information',
            Target : '@UI.FieldGroup#GeneratedGroup',
        },
    ],
    Capabilities : {
        InsertRestrictions : {
            Insertable : true
        },
        UpdateRestrictions : {
            Updatable : true
        },
        DeleteRestrictions : {
            Deletable : true
        }
    }
);

