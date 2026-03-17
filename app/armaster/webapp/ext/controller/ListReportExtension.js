sap.ui.define(
  [
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Component",
  ],
  function (MessageBox, MessageToast, Fragment, JSONModel, Component) {
    "use strict";

    const COLUMN_MAP = {
      "Service Name": "ServiceName",
      "Role Name": "RoleName",
      "Entity Name": "EntityName",
      "Access Code": "AccessCode",
      "Company Code": "CompanyCode",
      "Country Location": "CountryLocation",
      "Region Site": "RegionSite",
      "Business Unit": "BusinessUnit",
      "Market Area": "MarketArea",
      "AR Signum": "ARSignum",
      "Sales Organization": "SalesOrganization",
      "Purchase Organization": "PurchaseOrganization",
      "Organization Unit": "OrganizationUnit",
      "Trigram Company": "TrigramCompany",
      "Valid From": "ValidFrom",
      "Valid To": "ValidTo",
      "Role Status": "RoleStatus",
      Status: "Status__c",
      "Submitter Email": "Submitter__c",
      "Short Description": "ShortDescription__c",
      "Request ID": "RequestID__c",
      "Record ID": "RecordID",
      "BAO From": "BAOFrom",
      "BAO To": "BAOTo",
    };

    const REQUIRED_COLUMNS = ["Service Name", "Role Name"];

    const INITIAL_MODEL_DATA = {
      submitEnabled: false,
      uploading: false,
      previewVisible: false,
      previewData: [],
      totalRecords: 0,
      statusMessage: "",
      messageType: "Success",
    };

    let _aParsedData = [];
    let _oUploadModel = null;
    let _pDialog = null;

    function getUploadModel() {
      if (!_oUploadModel) {
        _oUploadModel = new JSONModel(Object.assign({}, INITIAL_MODEL_DATA));
      }
      return _oUploadModel;
    }

    function getODataModel() {
      // Walk all components to find the one with the OData model
      const aIds = Component.registry
        ? Object.keys(Component.registry.all())
        : [];
      for (let i = 0; i < aIds.length; i++) {
        const oComp = Component.registry.get(aIds[i]);
        const oModel = oComp && oComp.getModel && oComp.getModel();
        if (oModel && oModel.bindList) {
          return oModel;
        }
      }
      return null;
    }

    function setError(sMsg) {
      _aParsedData = [];
      const oModel = getUploadModel();
      oModel.setProperty("/statusMessage", sMsg);
      oModel.setProperty("/messageType", "Error");
      oModel.setProperty("/previewData", []);
      oModel.setProperty("/previewVisible", true);
      oModel.setProperty("/submitEnabled", false);
    }

    function splitCSVLine(sLine) {
      const aResult = [];
      let sCurrent = "",
        bInQuotes = false;
      for (let i = 0; i < sLine.length; i++) {
        if (sLine[i] === '"') {
          bInQuotes = !bInQuotes;
        } else if (sLine[i] === "," && !bInQuotes) {
          aResult.push(sCurrent.trim());
          sCurrent = "";
        } else {
          sCurrent += sLine[i];
        }
      }
      aResult.push(sCurrent.trim());
      return aResult;
    }

    function parseCSV(sContent) {
      const aLines = sContent
        .replace(/\r/g, "")
        .split("\n")
        .filter(function (l) {
          return l.trim();
        });
      if (aLines.length < 2) return [];
      const aHeaders = splitCSVLine(aLines[0]);
      return aLines.slice(1).map(function (sLine) {
        const aValues = splitCSVLine(sLine);
        const oObj = {};
        aHeaders.forEach(function (h, i) {
          oObj[h] = aValues[i] !== undefined ? aValues[i] : "";
        });
        return oObj;
      });
    }

    const oHandler = {
      onMassUpload: function () {
        if (!_pDialog) {
          _pDialog = Fragment.load({
            id: "massUploadFrag",
            name: "armaster.ext.fragment.MassUploadDialog",
            controller: oHandler,
          }).then(function (oDialog) {
            oDialog.setModel(getUploadModel(), "upload");
            return oDialog;
          });
        }
        _pDialog.then(function (oDialog) {
          _aParsedData = [];
          getUploadModel().setData(Object.assign({}, INITIAL_MODEL_DATA));
          const oFileUploader = Fragment.byId(
            "massUploadFrag",
            "massFileUploader",
          );
          if (oFileUploader) {
            oFileUploader.clear();
          }
          oDialog.open();
        });
      },

      onDownloadTemplate: function () {
        if (typeof XLSX === "undefined") {
          MessageBox.error("SheetJS library is not loaded.");
          return;
        }
        const aHeaders = Object.keys(COLUMN_MAP);
        const aExampleRow = [
          "FinanceService",
          "Finance_Role",
          "Finance_Entity",
          "ACC-FIN-001",
          "1000",
          "USA",
          "New York",
          "Corporate Finance",
          "Americas",
          "FSRV001",
          "SO-EMEA",
          "PO-EMEA",
          "Finance Dept",
          "FIN",
          "2024-01-01",
          "2024-12-31",
          "Active",
          "Active",
          "submitter@company.com",
          "Finance service access request",
          "REQ-001",
          "REC-001",
          "2024-01-01",
          "2024-12-31",
        ];
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([aHeaders, aExampleRow]);
        ws["!cols"] = aHeaders.map(function () {
          return { wch: 22 };
        });
        XLSX.utils.book_append_sheet(wb, ws, "ARMaster Template");
        XLSX.writeFile(wb, "ARMaster_Upload_Template.xlsx");
        MessageToast.show("Template downloaded successfully.");
      },

      onFileChange: function (oEvent) {
        const oFile = oEvent.getParameter("files")[0];
        if (!oFile) return;

        const sName = oFile.name.toLowerCase();
        const bIsCSV = sName.endsWith(".csv");
        const bIsXLSX = sName.endsWith(".xlsx") || sName.endsWith(".xls");

        if (!bIsCSV && !bIsXLSX) {
          MessageBox.error(
            "Unsupported file format. Please upload a .xlsx or .csv file.",
          );
          return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
          try {
            let aRawData;
            if (bIsCSV) {
              aRawData = parseCSV(e.target.result);
            } else {
              if (typeof XLSX === "undefined") {
                MessageBox.error("SheetJS is not loaded.");
                return;
              }
              const wb = XLSX.read(new Uint8Array(e.target.result), {
                type: "array",
              });
              aRawData = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
                defval: "",
              });
            }

            if (!aRawData || aRawData.length === 0) {
              setError("The file is empty.");
              return;
            }

            const aMissing = REQUIRED_COLUMNS.filter(function (c) {
              return !(c in aRawData[0]);
            });
            if (aMissing.length) {
              setError(
                'Missing required column(s): "' + aMissing.join('", "') + '".',
              );
              return;
            }

            _aParsedData = aRawData
              .map(function (row) {
                const oRec = {};
                Object.entries(COLUMN_MAP).forEach(function (entry) {
                  const v = row[entry[0]];
                  if (v !== undefined && String(v).trim() !== "") {
                    oRec[entry[1]] = String(v).trim();
                  }
                });
                return oRec;
              })
              .filter(function (r) {
                return !!r.ServiceName;
              });

            if (!_aParsedData.length) {
              setError("No valid records found.");
              return;
            }

            const oModel = getUploadModel();
            oModel.setProperty("/previewData", _aParsedData.slice(0, 5));
            oModel.setProperty("/totalRecords", _aParsedData.length);
            oModel.setProperty(
              "/statusMessage",
              _aParsedData.length + " record(s) ready to submit.",
            );
            oModel.setProperty("/messageType", "Success");
            oModel.setProperty("/previewVisible", true);
            oModel.setProperty("/submitEnabled", true);
          } catch (err) {
            setError("Error parsing file: " + (err.message || err));
          }
        };

        bIsCSV ? reader.readAsText(oFile) : reader.readAsArrayBuffer(oFile);
      },

     onSubmitUpload: async function () {
  if (!_aParsedData || !_aParsedData.length) {
    MessageBox.error("No data to upload.");
    return;
  }

  const oODataModel = getODataModel();

  if (!oODataModel) {
    MessageBox.error("Cannot connect to service.");
    return;
  }

  const oUploadModel = getUploadModel();
  oUploadModel.setProperty("/uploading", true);
  oUploadModel.setProperty("/submitEnabled", false);

  try {
    const sServiceUrl = oODataModel.sServiceUrl.endsWith("/")
      ? oODataModel.sServiceUrl
      : oODataModel.sServiceUrl + "/";

    // =========================
    // STEP 1: Fetch CSRF Token
    // First GET to obtain the csrf cookie/token
    // =========================
    let sCsrfToken = null;

    // Try getting from UI5 model first
    if (typeof oODataModel.getSecurityToken === "function") {
      try {
        sCsrfToken = oODataModel.getSecurityToken();
        console.log("Token from UI5 model:", sCsrfToken);
      } catch (e) {
        console.warn("Could not get token from UI5 model:", e);
      }
    }

    // Try $metadata endpoint
    if (!sCsrfToken) {
      console.log("Trying $metadata...");
      const oMeta = await fetch(`${sServiceUrl}$metadata`, {
        method: "GET",
        headers: { "X-CSRF-Token": "Fetch", "Accept": "*/*" },
        credentials: "include",
      });
      console.log("$metadata status:", oMeta.status);
      oMeta.headers.forEach((v, k) => console.log("  header:", k, "=>", v));
      sCsrfToken = oMeta.headers.get("x-csrf-token");
    }

    // Try service root with HEAD
    if (!sCsrfToken) {
      console.log("Trying HEAD on service root...");
      const oHead = await fetch(sServiceUrl, {
        method: "HEAD",
        headers: { "X-CSRF-Token": "Fetch" },
        credentials: "include",
      });
      console.log("HEAD status:", oHead.status);
      oHead.headers.forEach((v, k) => console.log("  header:", k, "=>", v));
      sCsrfToken = oHead.headers.get("x-csrf-token");
    }

    // =====================================================
    // FALLBACK: If backend doesn't support X-CSRF-Token,
    // read from cookie (SAP CAP / BTP standard approach)
    // =====================================================
    if (!sCsrfToken) {
      console.warn("X-CSRF-Token not found in headers. Trying cookie fallback...");

      // Trigger a GET to set the XSRF-TOKEN cookie
      await fetch(sServiceUrl, {
        method: "GET",
        credentials: "include",
      });

      // Read XSRF-TOKEN from cookie
      const xsrfCookie = document.cookie
        .split(";")
        .map(c => c.trim())
        .find(c => c.startsWith("XSRF-TOKEN=") || c.startsWith("X-CSRF-TOKEN="));

      if (xsrfCookie) {
        sCsrfToken = xsrfCookie.split("=")[1];
        console.log("Token from cookie:", sCsrfToken);
      }
    }

    // =====================================================
    // LAST RESORT: Skip CSRF token (only if backend
    // has CSRF disabled or uses session-only auth)
    // =====================================================
    if (!sCsrfToken) {
      console.warn("No CSRF token found anywhere. Proceeding without it — POST may fail with 403.");
    }

    // =========================
    // STEP 2 + 3 per row
    // =========================
    for (let row of _aParsedData) {
      // STEP 2: Create Draft
      const oCreateHeaders = {
        "Content-Type": "application/json",
        "Accept": "application/json",
      };

      if (sCsrfToken) {
        oCreateHeaders["X-CSRF-Token"] = sCsrfToken;
      }

      const oCreateResponse = await fetch(`${sServiceUrl}ARMaster`, {
        method: "POST",
        headers: oCreateHeaders,
        credentials: "include",
        body: JSON.stringify(row),
      });

      if (!oCreateResponse.ok) {
        const sError = await oCreateResponse.text();
        throw new Error(`Draft creation failed (${oCreateResponse.status}): ${sError}`);
      }

      const oCreatedDraft = await oCreateResponse.json();
      const sDraftUUID = oCreatedDraft.ID;
      const sIsActive = oCreatedDraft.IsActiveEntity;

      if (!sDraftUUID) {
        throw new Error("Draft creation response missing ID field");
      }

      console.log(`Draft created: ID=${sDraftUUID}, IsActiveEntity=${sIsActive}`);

      // STEP 3: Activate Draft
      const oActivateHeaders = {
        "Content-Type": "application/json",
        "Accept": "application/json",
      };

      if (sCsrfToken) {
        oActivateHeaders["X-CSRF-Token"] = sCsrfToken;
      }

      const oActivateResponse = await fetch(
        `${sServiceUrl}ARMaster(ID=${sDraftUUID},IsActiveEntity=${sIsActive})/draftActivate`,
        {
          method: "POST",
          headers: oActivateHeaders,
          credentials: "include",
        },
      );

      if (!oActivateResponse.ok) {
        const sError = await oActivateResponse.text();
        throw new Error(`Draft activation failed (${oActivateResponse.status}): ${sError}`);
      }

      console.log(`Draft activated: ID=${sDraftUUID}`);
    }

    MessageBox.success(
      _aParsedData.length + " record(s) uploaded and activated.",
      {
        title: "Upload Successful",
        onClose: function () {
          _pDialog.then(function (d) {
            d.close();
          });
          oODataModel.refresh();
        },
      },
    );
  } catch (err) {
    console.error("Upload error:", err);
    MessageBox.error("Upload failed: " + (err.message || err));
  } finally {
    oUploadModel.setProperty("/uploading", false);
    oUploadModel.setProperty("/submitEnabled", true);
  }
},
      onDialogClose: function () {
        _pDialog.then(function (d) {
          d.close();
        });
      },
    };

    return oHandler;
  },
);
