# Team rollout – from pilot to > 20 consultants on multiple projects

Status: **draft for discussion**, written after v1.1 (one profile built & tested on S02/120, guided mode).
Each item lists *what exists today* vs *what is needed*. Decisions marked **[DECIDE]** need the owner.

## 1. Rollout stages
| Stage | Who | Exit criteria |
|---|---|---|
| 0. Pilot (now) | Owner + 1 colleague, S02/120 | 1 profile built & tested by a newcomer without help; feedback file |
| 1. Small team | 3–5 consultants, S02/120 + 1 real project sandbox | 5+ profiles, 2 matrix variants, top irritants fixed, avg. time per profile known |
| 2. Team | > 20 consultants, multiple projects | Project onboarding ≤ 1 h, central repo/versioning, support channel, governance agreed |

## 2. Multi-project configuration
**Today:** one `config/project.json` (S02/120) + personal overlay `config/local.json`.
**Needed:** one config per project/system, chosen at "let's work".
- Proposal: `config/projects/<project>.json` (system, client, FLP URL, ADT tool prefix, packages,
  transport layer, FLP runtime role, authOverrides, naming convention of the *client*), and
  `config/local.json` keeps only personal values + `activeProject`.
- The guide asks "Which project?" at start; a new project gets a guided **project onboarding**
  (system checks: PFCG/SU25 status, FLP spaces mode, catalog style, existing naming conventions).
- **[DECIDE]** one repo per client (client data separation) vs one tool repo + per-project config repos.
  Recommendation: **tool repo (shared, versioned) + private per-project repo** for configs/outputs
  (outputs contain client-specific role designs).

## 3. Client data & confidentiality
- Matrices stay in `input/` (git-ignored) – keep it that way.
- `output/` contains role designs with client org values → must live in the **project** repo, not the
  shared tool repo. Today the MDM_HQ reference run is in the tool repo (demo data, S02) – OK for the pilot.
- Screenshots may show client data → same rule.
- No passwords anywhere (enforced: agents never type them; `session.mjs` refuses secret-like keys).

## 4. System access per consultant
- Each consultant needs: BeMind, ADT MCP server pointing to the project system/client, Playwright,
  an SAP admin user (build) and a test user (test).
- **[DECIDE]** tool names: the ADT MCP tool prefix is system-specific (`…-s02_`). For several systems,
  either one MCP server entry per system (prefix in project config) or a generic server name.
- Package/transport conventions are project-specific (customer packages, transport layers, request
  owners). Ask the project's basis/dev lead during project onboarding.

## 5. Generalisation backlog (from the pilot learnings)
| # | Item | Why | Effort |
|---|---|---|---|
| G1 | Project configs + project selection in the guide | Multi-project | M |
| G2 | Make the ABAP helper class parameter-driven (read design JSON / ZTABLE instead of constants) | No shared object edited per profile | M |
| G3 | Matrix format adapters (column mapping file per matrix template) | Other projects use other templates | M |
| G4 | Systems where background auth generation works → skip PFCG browser steps | Speed | S |
| G5 | Production mode: no `*` in open fields; propose values per object from the matrix/derivation | Real projects | L |
| G6 | Derived-role factory: many perimeters (company codes/plants) from a list | Typical project need | M |
| G7 | Transport handling: release order, request per profile, naming of requests | Governance | S |
| G8 | Regression re-test of all profiles after changes (batch tester) | Quality | M |
| G9 | Cloud (S/4HANA Public Cloud / BTP) variant: business roles + IAM apps instead of PFCG | Other landscapes | L |
| G10 | Metrics: time per profile, # interventions, # failures → feedback dashboard | Prove value | S |

## 6. Governance
- **Approvals:** every SAP change approved by the consultant (as today). **[DECIDE]** add a "batch
  approval" per object group for experienced users (fewer clicks) – keep per-object for newcomers.
- **Versioning:** tags per release (`v1.0`, `v1.1`, …), CHANGELOG, and the project config pins a tool version.
- **Ownership:** one tool owner + 2 maintainers; changes via pull requests; feedback files reviewed monthly.
- **Quality gate before a new release:** rerun the reference profile (MDM_HQ) on S02 → 18/18 PASS.

## 7. Enablement
- 30-min demo recording (let's work → layout → build → test).
- One-page cheat sheet (commands, checkpoints, what to do when the browser asks to log in).
- Support channel (Teams) + FAQ built from feedback files.
- Each new consultant does the **pilot scenario** ([TEST-SESSION-GUIDE.md](TEST-SESSION-GUIDE.md)) once on S02.

## 8. Open questions for the owner
1. Repo strategy (single tool repo + project repos?) and who may push to the tool repo.
2. Which projects/systems come next, and their landscapes (on-prem release, cloud?).
3. Naming convention when working on a client system (client prefix instead of `Z_<INITIALS>_BEMIND`).
4. Who validates role designs functionally before build (consultant alone, or client key user)?
5. Data protection: can screenshots/test results of client systems be stored in a BearingPoint repo?
