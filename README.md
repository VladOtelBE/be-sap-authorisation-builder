# be-sap-authorisation-builder

Agents + skills (BeMind / OpenCode format) that turn an **S/4HANA authorisation matrix** (Excel) into
**Fiori-only end-user business roles**: layout proposition → role build in the system → tile-by-tile test.

Status: **v1 – proven end-to-end** on S02 / client 120 with Business Profile *MDM Central - HQ Level*
(18 tiles, 18/18 PASS). See [`output/MDM_HQ/`](output/MDM_HQ/) for the reference run.

## Quickstart (3 steps)
```powershell
git clone https://github.com/VladOtelBE/be-sap-authorisation-builder.git   # or: git pull
cd be-sap-authorisation-builder
```
1. Copy the authorisation matrix `.xlsx` into `input/` (or let the guide tell you when).
2. Open BeMind in this folder (the **auth-orchestrator** guide is the default agent).
3. Type **`let's work`** (or `/lets-work`).

The guide then checks your setup (Node, dependencies, SAP connection, matrix), onboards you once
(your name, personal SAP prefix, test user – saved in the git-ignored `config/local.json`), lets you pick a
Business Profile and walks you through **Analyse → Build → Test** with a question/approval at every step.
Stop any time; next time `let's work` resumes where you left off (`state/session.json`).

| Command | What it does |
|---|---|
| `/lets-work` | Start or resume the guided session |
| `/status` | Where am I – profile, phase, what's built, what's next |
| `/next` | Continue with the next phase |
| `/explain` | Explain the current step and SAP concepts in plain words |

## Deliverables per Business Profile
| | Deliverable | File / location |
|---|---|---|
| D1 | End-user layout proposition (spaces / pages / sections / tiles, technical + end-user names) | `output/<KEY>/<KEY>_Layout.xlsx` |
| D2 | Machine-readable role design | `output/<KEY>/<KEY>_design.json` ([schema](docs/design-schema.md)) |
| D3 | Built roles (`_ALL` master + derived), catalog, space/pages, assigned to the test user | Target SAP system |
| D4 | Test report | `output/<KEY>/<KEY>_TestReport.xlsx` / `.md` |
| – | Build log (every object, tool, request, result) | `output/<KEY>/<KEY>_build-log.md` |

## Agents (`.opencode/agents/`)
| Agent | Mode | Role |
|---|---|---|
| `auth-orchestrator` | primary | **Entry point.** Intake, delegates, runs the 3 checkpoints, compact check-ins. |
| `matrix-analyser` | subagent | Parses the matrix, resolves every app/tcode in the system (read-only), designs the layout. |
| `role-builder` | subagent | Builds catalog, pages, space, roles, test user – **asks approval per object**. |
| `fiori-tester` | subagent | Logs into the FLP as the test user, opens every tile, checks navigation (read-only). |

## Skills (`.opencode/skills/`)
| Skill | Content |
|---|---|
| `matrix-parsing` | Matrix structure (sheets, header detection, access types) |
| `tcode-to-fiori-mapping` | Resolve tcodes / F-app IDs to target mappings & catalogs (SQL recipes) |
| `fiori-layout-design` | Space/page/section rules, naming, Excel layout |
| `pfcg-role-build` | Requests, packages, catalog references, pages/space, roles, **known S02 limits + workarounds** |
| `flp-tile-testing` | Test procedure, result schema, failure analysis |
| `s02-safe-access` | ADT MCP pitfalls (sequential calls, session recovery, SQL restrictions) |

## Prerequisites
- **BeMind** with these MCP servers connected:
  - ABAP ADT server for the target system (tool prefix in `config/project.json → system.adtMcpServerPrefix`,
    today `mario-andreschak-mcp-abap-adt-s02_`). **It must point to the client in config (120).**
  - Playwright (browser automation)
  - GitHub (optional – pushing works with plain `git`)
- Node.js ≥ 20, git.
- SAP: an **admin user** (PFCG, SU01, SE21, FLP admin apps, ADT) for building; the **test user** for testing.
  Both log in **manually in the browser** – the agents never type or store passwords.

## Manual setup (the guide does this for you)
```powershell
npm.cmd install                       # npm.cmd avoids the PowerShell execution-policy block
node scripts/preflight.mjs            # setup check as JSON
node scripts/session.mjs config --set naming.prefix=Z_ABC_BEMIND --set testUser.id=Z_ABC_BM_T1
```
Shared settings: `config/project.json`. Personal settings: `config/local.json` (git-ignored, overrides shared).
You can also skip the menu and ask directly, e.g.:
> Build business profile "Pricing Manager" from the matrix in input/, with a derived role for company code COM1.

The guide stops at 3 checkpoints:
1. **Layout** (D1 Excel + gaps/questions) → you validate.
2. **Build plan** (object list) → you approve, log in as admin in the browser when asked → build.
3. **Test** → you log in as the test user → test report (D4) + fix proposals.

Helper scripts:
```powershell
node scripts/parse-matrix.mjs input/<matrix>.xlsx --list
node scripts/parse-matrix.mjs input/<matrix>.xlsx --profile "<Business Profile>" --out output/<KEY>/<KEY>_matrix.json
node scripts/build-layout-xlsx.mjs output/<KEY>/<KEY>_design.json
node scripts/build-test-report.mjs output/<KEY>/<KEY>_test-results.json
```
Browser snippets (run by the agents through Playwright): `scripts/flp/add-catalog-reference.js`,
`scripts/flp/build-page.js`, `scripts/flp/test-tile.js`.

## Testing with a colleague – read first
- **Objects of the reference run already exist in S02/120** (owner OTEL): roles `Z_VOT_BEMIND_MDM_HQ_*`,
  catalog `Z_VOT_BEMIND_BC_MDM_HQ`, space/pages `Z_VOT_BEMIND_SP/PG_MDM_HQ*`, class `Z_VOT_BEMIND_ROLE_BUILDER`,
  user `Z_VOT_BM_T1`. The agents never overwrite existing objects – re-running MDM_HQ will stop and ask.
- The guide's onboarding gives each person their **own prefix and test user** (in `config/local.json`),
  so nobody overwrites the reference objects. Your own transport requests are created when you build.
- Known S02 limits (documented in `pfcg-role-build` skill): background authorisation generation is refused
  (S#/318, SU25 status for release 758 missing – **do not run SU25**) → authorisations are finished in PFCG
  via the browser; ADT cannot create packages → SE21.

## Governance
See [AGENTS.md](AGENTS.md): no invented data, approval before every system change, naming prefix,
package `Z_BM_ROLESAUTHORS` / layer `ZV02`, no passwords stored, compact check-ins.
