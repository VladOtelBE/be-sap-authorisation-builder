# Changelog

## v1.1 – guided interactive mode (2026-10-21)
- Default agent `auth-orchestrator` = interactive guide: say **"let's work"**.
- Preflight setup check (`scripts/preflight.mjs`), personal onboarding (`config/local.json`, own prefix and
  test user), resumable sessions (`state/session.json`).
- Commands `/lets-work`, `/status`, `/next`, `/explain`, `/feedback`.
- Docs: pilot test guide, feedback template, team rollout draft.

## v1.0 – first end-to-end run (2026-10-21)
- Profile *MDM Central - HQ Level* analysed, built and tested on S02/120: 18 tiles, 18/18 PASS.
- Agents: orchestrator, matrix-analyser, role-builder, fiori-tester; 6 skills; Node scripts for matrix
  parsing, layout Excel and test report; ABAP helper class `Z_VOT_BEMIND_ROLE_BUILDER`.
- Learned system limits documented (S#/318 / SU25, ADT packages, FLP locks) + automatic BP auth override.
