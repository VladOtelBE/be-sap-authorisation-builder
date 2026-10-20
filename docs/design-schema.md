# design.json schema (D2)

Produced by the Matrix Analyser, consumed by `build-layout-xlsx.mjs`, the Role Builder and the Tester.

```jsonc
{
  "profileKey": "MDM_HQ",                       // ≤ 10 chars, uppercase
  "businessProfile": "MDM Central - HQ Level",  // exact matrix name
  "domain": "Product Excellence (PE)",
  "derivationBy": "CROSS MAISON (ALL MARKETS) - Creation / Modify / Display",
  "matrixComment": "For Materials (...), Business Partners, prices, BOM and PIR",
  "source": { "matrixFile": "...xlsx", "matrixColumnHeader": "MDM Central - HQ Level", "system": "S02/120" },
  "status": "PROPOSAL | VALIDATED",

  "space": { "technicalName": "Z_VOT_BEMIND_SP_MDM_HQ", "title": "Master Data Management", "description": "" },
  "pages": [
    {
      "technicalName": "Z_VOT_BEMIND_PG_MDM_HQ_BP",
      "title": "Business Partners",
      "order": 1,
      "bpmlL2": "1.2. Master Data - Business Partner Management",
      "sections": [
        { "title": "Create & Maintain", "tiles": ["<tileRef>", "..."] }
      ]
    }
  ],
  "tiles": [
    {
      "ref": "BP",                       // unique key used in sections
      "entryId": "BP", "matrixRow": 4, "matrixComment": "...",
      "accessType": "FULL (Create/Update/Delete)", "actvt": ["01","02","03","06"],
      "tileType": "WEBGUI | FIORI",
      "title": "Maintain Business Partner",
      "semanticObject": "BusinessPartner", "semanticAction": "maintain",
      "appType": "TR | SAPUI5 | WDA",
      "technicalCatalog": "SAP_TC_CA_BP_BE_APPS", "scope": "S4CMD",
      "businessCatalog": "",             // standard BC if found
      "needsCustomCatalog": false,
      "source": "/UI2/PB_C_TM PARENTID=X-SAP-UI2-ADCAT:SAP_TC_CA_BP_BE_APPS:S4CMD TCODE=BP",
      "alternatives": ["..."],
      "mappingRationale": "..."
    }
  ],
  "roles": [
    { "name": "Z_VOT_BEMIND_MDM_HQ_ALL", "type": "MASTER", "description": "...", "orgLevels": { "BUKRS": ["*"] } },
    { "name": "Z_VOT_BEMIND_MDM_HQ_COM1", "type": "DERIVED", "parent": "Z_VOT_BEMIND_MDM_HQ_ALL",
      "perimeter": "Company code COM1", "orgLevels": { "BUKRS": ["COM1"], "WERKS": ["..."], "EKORG": ["PO01"], "VKORG": ["SO01","LA01"] },
      "justification": "..." }
  ],
  "gaps": [
    { "entryId": "", "type": "NOT_FOUND | AMBIGUOUS | TO_CONFIRM", "detail": "", "question": "" }
  ]
}
```
