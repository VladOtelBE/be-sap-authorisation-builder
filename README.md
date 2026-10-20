# be-sap-authorisation-builder

Agents + skills (BeMind / OpenCode format) that turn an **S/4HANA authorisation matrix** (Excel) into
**Fiori-only end-user business roles**: layout proposition → role build in the system → tile-by-tile test.

## Deliverables per Business Profile
| | Deliverable | File / location |
|---|---|---|
| D1 | End-user layout proposition (spaces / pages / sections / tiles, technical + end-user names) | `output/<KEY>/<KEY>_Layout.xlsx` |
| D2 | Machine-readable role design | `output/<KEY>/<KEY>_design.json` ([schema](docs/design-schema.md)) |
| D3 | Built roles (`_ALL` master + derived), space/pages, assigned to the test user | Target SAP system |
| D4 | Test report | `output/<KEY>/<KEY>_TestReport.xlsx` / `.md` |

## Agents
| Agent | Mode | Role |
|---|---|---|
| `auth-orchestrator` | primary | Entry point. Intake, delegates, runs the 3 checkpoints. |
| `matrix-analyser` | subagent | Parses the matrix, resolves each app/tcode in the system (read-only), designs the layout. |
| `role-builder` | subagent | Builds transport, packages, catalogs, roles, spaces/pages, test user – **approval per object**. |
| `fiori-tester` | subagent | Logs into the FLP as the test user, opens every tile, checks navigation (read-only). |

## Skills (`.opencode/skills/`)
`matrix-parsing` · `tcode-to-fiori-mapping` · `fiori-layout-design` · `pfcg-role-build` ·
`flp-tile-testing` · `s02-safe-access`

## Setup
```powershell
git clone https://github.com/VladOtelBE/be-sap-authorisation-builder.git
cd be-sap-authorisation-builder
npm.cmd install            # (npm.cmd avoids the PowerShell execution-policy block)
```
1. Copy the matrix into `input/` (ignored by git – client data).
2. Adapt `config/project.json` (system, client, FLP URL, test user, packages, transport layer).
3. Required MCP servers in BeMind: ABAP ADT server for the target system, Playwright, GitHub.

## Usage
Start BeMind in the repo folder, select the **auth-orchestrator** agent and prompt e.g.:
> Build business profile "MDM Central - HQ Level" from the matrix in input/, with a derived role for company code COM1.

Helper scripts:
```powershell
node scripts/parse-matrix.mjs input/<matrix>.xlsx --list
node scripts/parse-matrix.mjs input/<matrix>.xlsx --profile "MDM Central - HQ Level" --out output/MDM_HQ/MDM_HQ_matrix.json
node scripts/build-layout-xlsx.mjs output/MDM_HQ/MDM_HQ_design.json
node scripts/build-test-report.mjs output/MDM_HQ/MDM_HQ_test-results.json
```

## Governance
See [AGENTS.md](AGENTS.md): no invented data, approval before every system change, `Z_VOT_BEMIND`
prefix, package `Z_BM_ROLESAUTHORS` / layer `ZV02`, no passwords stored, compact check-ins.
