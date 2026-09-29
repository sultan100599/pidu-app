# AGENTS.md

Petunjuk untuk AI agent (Codex, dll.) yang bekerja di repo ini. Ringkasan proyek: `CATATAN.md`. Setup & perintah: `README.md`. Arah desain UI: `DESIGN.md`.

<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, read the core and then the skill for the task:
- Core filter, always on: `.claude/skills/antislop/SKILL.md`
- UI / visual: `.claude/skills/antislop-ui/SKILL.md`
- Copy & text: `.claude/skills/antislop-copywriting/SKILL.md`
- People: `.claude/skills/antislop-human/SKILL.md` (contrast checker: `.claude/skills/antislop-human/contrast-check.py`)
- Mobile / responsive: `.claude/skills/antislop-layoutmobile/SKILL.md`
- Code comments: `.claude/skills/antislop-code/SKILL.md`
Before starting, ask the user when antislop applies: during the work, or after it is done.
To update antislop later: `npx antislop-ai --update`, or run `npx antislop-ai` and pick Overwrite them.
<!-- antislop:end -->
