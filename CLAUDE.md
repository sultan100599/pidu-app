<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, load the antislop skill for the task:
- Core filter, always on: `antislop`
- UI / visual: `antislop-ui`
- Copy & text: `antislop-copywriting`
- People: `antislop-human`
- Mobile / responsive: `antislop-layoutmobile`
- Code comments: `antislop-code`
Before starting, ask the user when antislop applies: during the work, or after it is done.
To update antislop later: `npx antislop-ai --update`, or run `npx antislop-ai` and pick Overwrite them.
<!-- antislop:end -->

## Pidu workflow: every phase uses every project skill
Applies to each phase or feature of Pidu (`.claude/skills/`: antislop family, impeccable, improve-ui).

1. **Start**
   - Read `CATATAN.md` (section 6) and the brief `docs/lead/phase-N.md`. Write the brief if it is missing.
   - Ask once per phase when antislop applies: during or after.
   - Run `impeccable context` once per session and read `DESIGN.md`. Never run `/impeccable document`.
2. **Build**
   - Load `antislop` (core) plus every sub-skill whose area the phase touches:
     - `antislop-ui`: screens and CSS.
     - `antislop-copywriting`: any id/en/su text, including `backend/lang`.
     - `antislop-human`: contrast via `contrast-check.py`, keyboard, and empty/loading/error states.
     - `antislop-layoutmobile`: anything rendered at 360px.
     - `antislop-code`: code comments.
   - Load `impeccable` and read `reference/craft-floor.md` before UI edits. Use the matching command: `shape` for a new surface, or `polish`/`clarify`/`adapt`/`harden` for refinements.
3. **Verify**
   - From the repo root, run:
     - `npm test` (backend tests and frontend lint);
     - `npm run build`;
     - `node frontend/scripts/check-locales.mjs`;
     - `npm run test:e2e`.
   - Check in the Anbo browser: desktop, 360px, light and dark. Use a test account and delete its data afterwards.
4. **Audit**
   - Run `improve-ui` on the surfaces the phase touched, in a fresh subagent so the audit is independent of the builder. It is read-only, and its findings (3 at most) go into the phase report.
   - When antislop mode is "after", also write `anti-slop/audit-NNN-YYYY-MM-DD.md`.
   - The user picks numbers. For a picked improve-ui finding:
     - write its plan in `design-plans/` using the skill's template;
     - execute it as a separate step;
     - verify again.
5. **Close**
   - Write `docs/lead/report-N.md` and record which skills were used and what they found.
   - Update the `CATATAN.md` history and checklist.
   - Commit (no push), then stop and ask before the next phase.
