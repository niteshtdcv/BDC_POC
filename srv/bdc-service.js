const cds = require('@sap/cds');
const nodemailer = require('nodemailer');

module.exports = cds.service.impl(async function () {
  const { ARMaster, ARChangeLog, ApproverMaster, ApproverChangeLog } = this.entities;

  const today = () => new Date().toISOString().split('T')[0];
  const currentUser = (req) => (req.user && req.user.id) || 'system';


  // Send approval email using nodemailer
  const sendApprovalEmail = async (record, entityType) => {  
    // For managed app router in BTP, use the Launchpad URL from environment
    // This ensures proper authentication flow through the managed app router
    appname = entityType.toLowerCase();
    appver = "-0.0.1";
    
    const baseUrl =  process.env.APP_URL || 'http://localhost:4004';
    const approveUrl = `${baseUrl}.${appname}${appver}/odata/v4/bdc/approveRequest?id=${record.ID}&action=approve&entity=${entityType}`;
    const rejectUrl = `${baseUrl}.${appname}${appver}/odata/v4/bdc/approveRequest?id=${record.ID}&action=reject&entity=${entityType}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: 'nitesh.f.kumar@ericsson.com',
      subject: `Approval Required: ${record.SERVICE_NAME || record.ServiceName}`,
      html: `
        <h3>New Authorization Request - ${entityType}</h3>
        <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse; width: 100%; max-width: 600px;">
          <tr style="background-color: #f2f2f2;">
            <th style="text-align: left; padding: 10px;">Field</th>
            <th style="text-align: left; padding: 10px;">Value</th>
          </tr>
          <tr>
            <td style="padding: 10px;"><strong>Service Name</strong></td>
            <td style="padding: 10px;">${record.SERVICE_NAME || record.ServiceName || 'N/A'}</td>
          </tr>
          <tr style="background-color: #f9f9f9;">
            <td style="padding: 10px;"><strong>Request ID</strong></td>
            <td style="padding: 10px;">${record.REQUEST_ID__C || record.RequestID__c || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 10px;"><strong>Requestor</strong></td>
            <td style="padding: 10px;">${record.REQUESTOR || record.Submitter__c || 'N/A'}</td>
          </tr>
          <tr style="background-color: #f9f9f9;">
            <td style="padding: 10px;"><strong>Description</strong></td>
            <td style="padding: 10px;">${record.SHORT_DESCRIPTION__C || record.ShortDescription__c || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 10px;"><strong>Access Code/Key</strong></td>
            <td style="padding: 10px;">${record.ACCESS_KEY || record.AccessCode || 'N/A'}</td>
          </tr>
          <tr style="background-color: #f9f9f9;">
            <td style="padding: 10px;"><strong>Status</strong></td>
            <td style="padding: 10px;">${record.STATUS__C || record.Status__c || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 10px;"><strong>Company Code</strong></td>
            <td style="padding: 10px;">${record.COMPANY_CODE || record.CompanyCode || 'N/A'}</td>
          </tr>
          <tr style="background-color: #f9f9f9;">
            <td style="padding: 10px;"><strong>Entity Name</strong></td>
            <td style="padding: 10px;">${record.ENTITY_NAME || record.EntityName || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 10px;"><strong>Role Name</strong></td>
            <td style="padding: 10px;">${record.ROLE_NAME || record.RoleName || 'N/A'}</td>
          </tr>
        </table>
        <br>
        <div style="margin-top: 20px;">
          <a href="${approveUrl}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; margin-right: 10px; border-radius: 4px; display: inline-block;">✓ Approve</a>
          <a href="${rejectUrl}" style="background-color: #f44336; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">✗ Reject</a>
        </div>`
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Approval email sent to nitesh.f.kumar@ericsson.com for ${entityType}`);
    } catch (error) {
      console.log('Email sending skipped. Configure GMAIL_USER and GMAIL_APP_PASSWORD in .env to enable.');
    }
  };

  // Lookup AccessCode from ARMaster by ServiceName
  const getAccessCodeFromARMaster = async (serviceName) => {
    if (!serviceName) return null;
    const master = await SELECT.one.from(ARMaster).where({ ServiceName: serviceName });
    return master ? master.AccessCode : null;
  };

  // Lookup AccessKey from ApproverMaster by ServiceName
  const getAccessKeyFromApproverMaster = async (serviceName) => {
    if (!serviceName) return null;
    const master = await SELECT.one.from(ApproverMaster).where({ ServiceName: serviceName });
    return master ? master.ServiceName : null;
  };



  // Shared logic for ARChangeLog create/activate
  const prepareARChangeLog = async (req) => {
    const serviceName = req.data.SERVICE_NAME;
    if (!serviceName) return req.error(400, 'SERVICE_NAME is required');
    const accessCode = await getAccessCodeFromARMaster(serviceName);
    if (!accessCode) return req.error(400, `Service '${serviceName}' not found in ARMaster. Request denied.`);
    req.data.ACCESS_KEY = accessCode;
    req.data.CREATE_DATE__C = req.data.CREATE_DATE__C || today();
    req.data.MODIFIED_DATE__C = today();
    req.data.LAST_MODIFIED_BY__C = currentUser(req);
    req.data.STATUS__C = req.data.STATUS__C || 'Pending';
    req.data.APPROVAL_STATUS = 'Sent for Approval';
  };

  // ARChangeLog CREATE handler (direct API)
  this.before('CREATE', ARChangeLog, prepareARChangeLog);

  // ARChangeLog draftActivate handler (Fiori UI Save)
  this.before('draftActivate', ARChangeLog, prepareARChangeLog);

  // Send email after ARChangeLog creation
  this.after('CREATE', ARChangeLog, async (data, req) => {
    await sendApprovalEmail(data, 'ARChangeLog');
  });

  // Filter ARChangeLog to show only Approved records
  this.before('READ', ARChangeLog, async (req) => {
    const isAdmin = req.user && req.user.is('Admin');
    if (isAdmin) return; // Admin sees all records
    
    const query = req.query;
    if (query.SELECT && query.SELECT.from && query.SELECT.from.ref && query.SELECT.from.ref[0] === 'BDCService.ARChangeLog') {
      if (!query.SELECT.where) {
        query.SELECT.where = [{ ref: ['APPROVAL_STATUS'] }, '=', { val: 'Approved' }];
      } else {
        query.SELECT.where = ['(', ...query.SELECT.where, ')', 'and', { ref: ['APPROVAL_STATUS'] }, '=', { val: 'Approved' }];
      }
    }
  });

  // ApproverChangeLog CREATE handler - Validate ServiceName and copy AccessKey
  this.before('CREATE', ApproverChangeLog, async (req) => {
    const serviceName = req.data.SERVICE_NAME;
    
    if (!serviceName) {
      return req.error(400, 'SERVICE_NAME is required');
    }

    const accessKey = await getAccessKeyFromApproverMaster(serviceName);
    if (!accessKey) {
      return req.error(400, `Service '${serviceName}' not found in ApproverMaster. Request denied.`);
    }

    req.data.ACCESS_KEY = accessKey;
    req.data.CREATE_DATE__C = req.data.CREATE_DATE__C || today();
    req.data.MODIFIED_DATE__C = today();
    req.data.LAST_MODIFIED_BY__C = currentUser(req);
    req.data.STATUS__C = req.data.STATUS__C || 'Pending';
  });

  // Shared logic for ARMaster create/activate
  const prepareARMaster = (req) => {
    req.data.CreateDate__c = req.data.CreateDate__c || today();
    req.data.ModifiedDate__c = today();
    req.data.LastModifiedBy__c = currentUser(req);
    req.data.APPROVAL_STATUS = 'Sent for Approval';
  };

  // ARMaster CREATE handler (direct API)
  this.before('CREATE', ARMaster, prepareARMaster);

  // ARMaster draftActivate handler (Fiori UI Save)
  this.before('draftActivate', ARMaster, prepareARMaster);

  
  // Send email after ARMaster creation (direct API and Fiori UI)
  this.after('CREATE', ARMaster, async (data, req) => {
    console.log("ARMaster send mail");
    await sendApprovalEmail(data, 'ARMaster');
  });
  this.after('draftActivate', ARMaster, async (data, req) => {
    console.log("ARMaster draftActivate send mail");
    await sendApprovalEmail(data, 'ARMaster');
  });

  // Send email after ARMaster creation
 /* this.after('CREATE', ARMaster.drafts, async (data, req) => {
    await sendApprovalEmail(data, 'ARMaster');
  });

  // Set approval status on draft activation
  this.before('NEW', ARMaster.drafts, (req) => {
    req.data.APPROVAL_STATUS = 'Sent for Approval';
  });*/

  // Filter ARMaster to show only Approved records
  this.before('READ', ARMaster, async (req) => {
    const isAdmin = req.user && req.user.is('Admin');
    if (isAdmin) return; // Admin sees all records
    
    const query = req.query;
    if (query.SELECT && query.SELECT.from && query.SELECT.from.ref && query.SELECT.from.ref[0] === 'BDCService.ARMaster') {
      if (!query.SELECT.where) {
        query.SELECT.where = [{ ref: ['APPROVAL_STATUS'] }, '=', { val: 'Approved' }];
      } else {
        query.SELECT.where = ['(', ...query.SELECT.where, ')', 'and', { ref: ['APPROVAL_STATUS'] }, '=', { val: 'Approved' }];
      }
    }
  });

  // ARMaster UPDATE handler
  this.before('UPDATE', ARMaster, (req) => {
    req.data.ModifiedDate__c = today();
    req.data.LastModifiedBy__c = currentUser(req);
  });

  // ApproverMaster CREATE handler
  this.before('CREATE', ApproverMaster, (req) => {
    req.data.CreateDate = req.data.CreateDate || today();
    req.data.ModifiedDate = today();
    req.data.LastModifiedBy = currentUser(req);
  });

  // ApproverMaster UPDATE handler
  this.before('UPDATE', ApproverMaster, (req) => {
    req.data.ModifiedDate = today();
    req.data.LastModifiedBy = currentUser(req);
  });

  // Approval/Rejection handler
  this.on('approveRequest', async (req) => {
    const { id, action, entity } = req.data;
    
    if (!id || !action) {
      return req.error(400, 'ID and action are required');
    }

    const newStatus = action === 'approve' ? 'Approved' : 'Rejected';
    
   // if (entity === 'ARMaster') {
      const db = await cds.connect.to('db');
      console.log(`Updating ARMaster ID ${id} to status ${newStatus}`);
      debugger;
      await db.run(UPDATE('com.sap.bdc.ARMaster').set({ 
        APPROVAL_STATUS: newStatus,
        ModifiedDate__c: today(),
        LastModifiedBy__c: 'Nitesh Kumar'
      }).where({ ID: id }));
 /*   } else {
      const db = await cds.connect.to('db');
      console.log(`Updating ARChangeLog ID ${id} to status ${newStatus}`);
      await db.run(UPDATE('com.sap.bdc.ARChangeLog').set({ 
        APPROVAL_STATUS: newStatus,
        MODIFIED_DATE__C: today(),
        LAST_MODIFIED_BY__C: 'approver'
      }).where({ ID: id }));
    }*/

    return `Request ${action}d successfully`;
  });
});