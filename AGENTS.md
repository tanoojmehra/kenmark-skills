# Agent Instructions (Codex & compatible harnesses)

Rules live in `brain/rules/`. Keep the `init-brain` block in parity with `CLAUDE.md` when both exist.

<!-- init-brain:START -->
## Project standards

- **Canonical:** `brain/rules/` (edit rules there only)
- **Index:** [brain/INDEX.md](brain/INDEX.md)

**Required — start of every new conversation:** Before non-trivial work, **Read** `brain/rules/standards.md` first. **Read** relevant `brain/kb/` files for the task (numbered `00`–`11` and any `kb/features/` entry). **Read** additional rule files (`stack.md`, `workflow.md`, `testing.md`, `ui.md`, `deployment.md`) only when relevant.

**Context efficiency:** For multi-part, repo-wide, research-heavy, or queued work, keep the primary agent lean: delegate bounded independent work to fresh contexts when available, pass only task-relevant context, and retain compact state rather than worker history/logs.

**After meaningful changes:** Update the matching `brain/kb/` files and `brain/CHANGELOG.md` — code and KB move together.
<!-- init-brain:END -->
