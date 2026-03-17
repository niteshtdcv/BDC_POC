// ============================================================================
// SECURITY PATCH: XSS Prevention for Mass Upload
// ============================================================================
// Apply this patch to: app/armaster/webapp/ext/controller/ListReportExtension.js
// Issue: CWE-79, CWE-80 - Cross-Site Scripting vulnerability
// Severity: HIGH
// ============================================================================

// ADD THIS HELPER FUNCTION after _splitCSVLine method (around line 260):

/**
 * Sanitize user input to prevent XSS attacks
 * @param {string} sValue - Raw input value from Excel/CSV
 * @returns {string} Sanitized value safe for DOM rendering
 */
_sanitizeInput: function (sValue) {
    if (!sValue || typeof sValue !== 'string') {
        return sValue;
    }
    
    // HTML entity encoding to prevent XSS
    return sValue
        .replace(/&/g, '&amp;')   // Must be first
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
},

// ============================================================================
// REPLACE the mapping logic in onFileChange (around line 160-170):
// ============================================================================

// OLD CODE (VULNERABLE):
/*
this._aParsedData = aRawData
    .map(row => {
        const oRecord = {};
        Object.entries(COLUMN_MAP).forEach(([excelCol, odataField]) => {
            const val = row[excelCol];
            if (val !== undefined && String(val).trim() !== "") {
                oRecord[odataField] = String(val).trim();
            }
        });
        return oRecord;
    })
    .filter(r => r.ServiceName);
*/

// NEW CODE (SECURE):
this._aParsedData = aRawData
    .map(row => {
        const oRecord = {};
        Object.entries(COLUMN_MAP).forEach(([excelCol, odataField]) => {
            const val = row[excelCol];
            if (val !== undefined && String(val).trim() !== "") {
                // Sanitize input to prevent XSS
                const sanitized = this._sanitizeInput(String(val).trim());
                oRecord[odataField] = sanitized;
            }
        });
        return oRecord;
    })
    .filter(r => r.ServiceName);

// ============================================================================
// ADDITIONAL VALIDATIONS (RECOMMENDED)
// ============================================================================

// ADD after file selection validation (around line 120):

// Validate file size (5MB limit)
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
if (oFile.size > MAX_FILE_SIZE) {
    MessageBox.error(
        "File size exceeds 5MB limit. Please upload a smaller file.",
        { title: "File Too Large" }
    );
    return;
}

// ============================================================================
// ADD after parsing and mapping (around line 180):

// Validate record count (1000 record limit)
const MAX_RECORDS = 1000;
if (this._aParsedData.length > MAX_RECORDS) {
    this._setError(
        `Maximum ${MAX_RECORDS} records allowed per upload. ` +
        `Your file contains ${this._aParsedData.length} records. ` +
        `Please split your file into smaller batches.`
    );
    return;
}

// Validate individual field lengths
const FIELD_MAX_LENGTH = 1000; // Adjust based on schema
const aLongFields = [];
this._aParsedData.forEach((row, idx) => {
    Object.entries(row).forEach(([field, value]) => {
        if (value && value.length > FIELD_MAX_LENGTH) {
            aLongFields.push(`Row ${idx + 2}, Field: ${field}`);
        }
    });
});

if (aLongFields.length > 0) {
    this._setError(
        `Some fields exceed maximum length (${FIELD_MAX_LENGTH} characters):\n` +
        aLongFields.slice(0, 5).join('\n') +
        (aLongFields.length > 5 ? `\n... and ${aLongFields.length - 5} more` : '')
    );
    return;
}

// ============================================================================
// SERVER-SIDE VALIDATION (OPTIONAL BUT RECOMMENDED)
// ============================================================================
// Add to: srv/bdc-service.js

/*
// Add this helper function at the top of the file:
const sanitizeString = (str) => {
    if (!str || typeof str !== 'string') return str;
    return str
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .substring(0, 1000); // Enforce max length
};

// Modify the ARMaster CREATE handler:
this.before('CREATE', ARMaster, (req) => {
    // Sanitize all string fields
    Object.keys(req.data).forEach(key => {
        if (typeof req.data[key] === 'string') {
            req.data[key] = sanitizeString(req.data[key]);
        }
    });
    
    // Existing validation logic...
    req.data.CreateDate__c = req.data.CreateDate__c || today();
    req.data.ModifiedDate__c = today();
    req.data.LastModifiedBy__c = currentUser(req);
    req.data.APPROVAL_STATUS = 'Sent for Approval';
});
*/

// ============================================================================
// TESTING CHECKLIST
// ============================================================================
/*
Test with these malicious inputs in Excel/CSV:

1. XSS Script Tag:
   ServiceName: <script>alert('XSS')</script>
   Expected: &lt;script&gt;alert('XSS')&lt;/script&gt;

2. XSS Image Tag:
   RoleName: <img src=x onerror=alert('XSS')>
   Expected: &lt;img src=x onerror=alert('XSS')&gt;

3. XSS Event Handler:
   EntityName: <div onload=alert('XSS')>Test</div>
   Expected: &lt;div onload=alert('XSS')&gt;Test&lt;/div&gt;

4. HTML Injection:
   ShortDescription__c: <b>Bold</b> <i>Italic</i>
   Expected: &lt;b&gt;Bold&lt;/b&gt; &lt;i&gt;Italic&lt;/i&gt;

5. SQL Injection (should be safe with OData, but test anyway):
   ServiceName: '; DROP TABLE ARMaster; --
   Expected: Sanitized and handled by OData layer

6. Very Long String:
   ServiceName: [1001 characters]
   Expected: Error message about field length

7. Large File:
   Upload 6MB file
   Expected: Error message about file size

8. Many Records:
   Upload 1001 records
   Expected: Error message about record limit
*/

// ============================================================================
// DEPLOYMENT CHECKLIST
// ============================================================================
/*
Before deploying to production:

1. [ ] Apply _sanitizeInput helper function
2. [ ] Update onFileChange mapping logic
3. [ ] Add file size validation
4. [ ] Add record count validation
5. [ ] Add field length validation
6. [ ] Test all XSS scenarios above
7. [ ] Test with legitimate data (ensure no false positives)
8. [ ] Update user documentation
9. [ ] Inform users about new limits (5MB, 1000 records)
10. [ ] Monitor logs for sanitization events
11. [ ] Consider adding server-side validation
12. [ ] Schedule security review after deployment
*/

// ============================================================================
// PERFORMANCE IMPACT
// ============================================================================
/*
Expected performance impact of sanitization:

- Small files (1-50 records): < 10ms overhead (negligible)
- Medium files (51-200 records): 10-50ms overhead (acceptable)
- Large files (201-1000 records): 50-200ms overhead (acceptable)

The security benefit far outweighs the minimal performance cost.
*/

// ============================================================================
// ALTERNATIVE: Use DOMPurify Library (More Robust)
// ============================================================================
/*
If you prefer a battle-tested library:

1. Add to index.html:
   <script src="https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js"></script>

2. Replace _sanitizeInput with:
   _sanitizeInput: function (sValue) {
       if (!sValue || typeof sValue !== 'string') {
           return sValue;
       }
       return DOMPurify.sanitize(sValue, { 
           ALLOWED_TAGS: [],  // Strip all HTML tags
           KEEP_CONTENT: true // Keep text content
       });
   }

Pros: More comprehensive, handles edge cases
Cons: External dependency, slightly larger bundle size
*/
