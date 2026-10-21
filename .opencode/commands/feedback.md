---
description: Give usability feedback after a session - guided questions, saved to feedback/ for the next improvement round
agent: auth-orchestrator
---
Collect usability feedback for the tool. $ARGUMENTS

1. Read `feedback/TEMPLATE.md` and the current session/outputs below (prefill context: profile, phases,
   timings from `state/session.json` history, number of tiles, test results).
2. Ask the user with the question tool, max 3 questions per round, in this order:
   a) the 10 scores (group them: 4 + 3 + 3, options 1–5 with a short label),
   b) blockers (free text, "none" allowed), c) irritants, d) wrong/invented information,
   e) ideas, f) what must change for their own project / team rollout,
   g) facilitator interventions (number + where), if a facilitator was present.
3. Write `feedback/<YYYY-MM-DD>-<initials>-<KEY>.md` following the template. Remove any client data,
   passwords or real user names you notice (ask if unsure).
4. Show the summary, ask "Commit & push the feedback?" (Recommended) → git add the file only, commit
   "feedback: <initials> <KEY>", push.

!`node scripts/preflight.mjs`
