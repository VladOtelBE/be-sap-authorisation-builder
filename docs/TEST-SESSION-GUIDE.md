# Pilot test session – guide for facilitator and tester

Goal: check that a consultant who has **never seen the tool** can build and test one Business Profile
end to end, guided only by BeMind ("let's work"), and collect usability feedback for the next iteration.

| | |
|---|---|
| Roles | **Facilitator** (knows the tool, observes, helps only when blocked) · **Tester** (drives BeMind) |
| Duration | 2–3 h (setup 15 min · analyse 30–45 min · build 45–60 min · test 30 min · debrief 15 min) |
| System | S02 / client 120 (demo system – client data, derivations may differ from the real project) |
| Output | Built + tested profile under the tester's prefix · feedback file in `feedback/` |

---

## 1. Before the session (facilitator, ~15 min)

- [ ] Tester has access to the GitHub repo `VladOtelBE/be-sap-authorisation-builder` (collaborator invite).
- [ ] Tester's BeMind has these tools connected (MCP servers):
  - ABAP ADT server for **S02, client 120** (tool names starting with `mario-andreschak-mcp-abap-adt-s02_`)
  - Playwright (browser)
- [ ] Tester has an **SAP admin user in S02/120** with PFCG, SU01, SE21, /UI2/FLPD_CUST, /UI2/FLPCM_CUST,
      Manage Launchpad Pages/Spaces, ADT (S_DEVELOP) – and a developer key if required.
- [ ] Node.js ≥ 20 and git installed on the tester's machine.
- [ ] The authorisation matrix `.xlsx` is available to the tester (shared securely – it is client data,
      it must NOT be committed).
- [ ] Choose the profile to build. **Recommended for the pilot: a small profile (10–25 entries)** that is
      *not* MDM Central - HQ Level (already built). Check sizes with
      `node scripts/parse-matrix.mjs input/<matrix>.xlsx --list`.
- [ ] Agree on the tester's initials → prefix `Z_<INITIALS>_BEMIND`, test user `Z_<INITIALS>_BM_T1`.

## 2. During the session

### Rules for the facilitator
- Let the tester read and decide alone. Only step in when the tester is blocked for > 3 min.
- Every time you step in, note it (that is a usability gap).
- Note timings per phase and every confusing message, wrong assumption, or unnecessary question.
- Never type passwords for the tester.

### Scenario script (tester)

| # | Tester does | Expected behaviour of BeMind | Observe / note |
|---|---|---|---|
| S1 | `git clone …` (or `git pull`), open BeMind in the folder, type **`let's work`** | Setup check status card (Node, dependencies, SAP connection, matrix, personal settings) | Clear? Did it fix/explain missing items? |
| S2 | Follow onboarding | Asks name, prefix, test user, SAP admin user; saves `config/local.json` | Were the proposals right? Too many questions? |
| S3 | Copy the matrix into `input/` when asked | Detects the file, shows main menu | Instruction clear? |
| S4 | Pick "Build a new Business Profile", choose domain + profile + perimeter | Profiles grouped by domain with sizes; proposal for the perimeter with figures | Easy to find the profile? Perimeter proposal understandable? |
| S5 | Wait for the analysis → **Checkpoint 1** | Layout table + Excel path + one question per open point | Is the layout plausible? Were the gap questions answerable? |
| S6 | Open `output/<KEY>/<KEY>_Layout.xlsx` | 5 sheets: Overview, Spaces & Pages, Tiles, Roles, Gaps | Readable for a functional consultant? |
| S7 | Approve the build plan; log in as admin when asked | Object plan table; asks approval; numbered browser instructions | Did you understand each object? Too many approvals? |
| S8 | Watch the build → **Checkpoint 2** | Progress per object group, build log | Errors/retries? Waiting time acceptable? |
| S9 | Log in as the test user (set new password) → test | Tile-by-tile results, screenshots of failures, fix proposals | Results trustworthy? Fix proposals clear? |
| S10 | Approve a fix (if any) → re-test | Only the fix is built; only failed tiles retested | |
| S11 | Type **`/status`**, then close BeMind, reopen, type **`let's work`** | Status card; offers to resume at the right phase | Resume worked? |
| S12 | Type **`/explain`** at any point | Plain-words explanation of the step | Helpful? |
| S13 | Accept "Commit & push" at the end | Results committed (no matrix, no local config) | |
| S14 | Type **`/feedback`** | Guided feedback questions → file in `feedback/` | — |

### Success criteria
- Profile built and tested **without the facilitator touching the keyboard**.
- All tiles open for the test user (or failures explained with a concrete fix).
- No object created without the tester's approval; no object created outside the tester's prefix
  (exception: shared packages `Z_BEMIND` / `Z_BM_ROLESAUTHORS`, existing `Z_FLP_USER`).
- No password typed by the agent or written in any file.

## 3. Debrief (15 min) – both

Run `/feedback` in BeMind (or fill [`feedback/TEMPLATE.md`](../feedback/TEMPLATE.md) by hand) and commit it.
Topics: what was easy, where you got stuck, what you would remove/automate, would you use it on a
real project, what is missing for your project (other system, other matrix format, other naming).

## 4. Known limitations (tell the tester upfront)

| Limitation | Impact | Workaround in place |
|---|---|---|
| Background authorisation generation refused in S02 (S#/318, SU25 status for release 758) | Authorisations finished in PFCG through the browser | Documented in `pfcg-role-build` skill; **never run SU25** |
| ADT cannot create packages | Packages via SE21 | Shared packages already exist – reused |
| Launchpad Designer does not ask for a transport when creating a catalog | Catalog lands on the user's open customizing task | Guide tells the user; check the request afterwards |
| Browser automation is slow and sometimes times out | Some steps are repeated | Scripts work in small batches; the guide retries/reports |
| Open authorisation fields filled with `*` | OK for test roles only | Production roles need explicit values per object |
| Single system/client (S02/120) configured | Other projects need their own config | See [`TEAM-ROLLOUT.md`](TEAM-ROLLOUT.md) |
| Matrix format = W&J layout (sheets *Business Profile List*, *Fiori Tile List*) | Other layouts may not parse | Parser finds columns by header text; new formats need a check |

## 5. Clean-up after the pilot (optional, ask first)
Objects of the pilot carry the tester's prefix. To remove them: delete roles (PFCG), space/pages
(Manage Launchpad Spaces/Pages), catalog (/UI2/FLPD_CUST), lock/delete the test user (SU01). Ask BeMind:
"list everything I created for <KEY>" – it reads the build log.
