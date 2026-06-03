---
name: skills-router
version: 1.0.0
category: workflow
scope: universal
phase: discover
description: Coding router — searches installed user skills and auto-assigns the best match when you're programming and unsure which skill fits. Use while coding, when the user invokes /skills-router, or when domains overlap (SEO vs design vs backend vs testing). Not for onboarding; use skills-init or init-brain for first-time setup.
triggers:
  - skills router
  - pick the right skill
  - which skill should we use
  - route skill
  - find skill for task
  - skills-router
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
risk: read-only
disable-model-invocation: false
---

# Skills Router

While **coding**, when you're not sure which skill applies, search the installed skill library and **auto-assign** the best match for the current task.

This is a day-to-day programming tool — not part of project onboarding (`init-brain`, `skills-init`).

## Recommended Kenmark workflows

When several bundled skills could apply, prefer this order:

| Situation | Skill |
| --- | --- |
| Problem unclear — need evidence, hypotheses, ranked plan | **`troubleshoot`** |
| Need issue tracking in `brain/issues/` | **`issues-setup`** / **`issues-scan`** |
| Need to pick which installed skill fits the task | **`skills-router`** (this skill) |
| Repo clutter, scattered docs, dumps | **`repo-hygiene`** |
| Keys, secrets, credentials | **`repo-secrets-audit`** |
| Make repo public / open source / public repo readiness | **`repo-public-readiness`** |

**Ambiguous:** `sanitize repo` — if the user means **public** or **open-source** prep, use **`repo-public-readiness`** (often with **`repo-secrets-audit`**), not **`repo-hygiene`**. Use **`repo-hygiene`** only for clutter (files, docs, dumps, orphans).
| Update brain after code change | **`repo-kb-sync`** |
| Docs quality, README accuracy | **`repo-docs-audit`** |
| Confusing folder layout | **`repo-structure-audit`** |
| Dependency bloat, unused packages | **`repo-dependency-audit`** |
| npm publish, release, handoff | **`repo-release-readiness`** |
| Inventory or cleanup of installed skills | **`skills-maintain`** |
| Grouped commits and push | **`commit-push`** |

Do **not** use this router for open-ended diagnosis (“troubleshoot this bug”, “find root cause”, “why is this failing”) — use **`troubleshoot`** first. Use **`skills-router`** when the problem domain is clear but the right specialist skill is not.

**Troubleshoot trigger examples:** “troubleshoot my Cursor slowdown”, “diagnose this production issue”, “find root cause of this deployment failure”, “build a test plan before fixing”.

## Canonical skill store

**Kenmark-managed skills** (bundled + adopted catalog) live in `~/.kenmark/store/skills/`. IDE paths typically symlink there after `kenmark-skills setup` or `adopt`.

**All other user skills** still live under `~/.agents/skills/` (and other IDE paths). The registry merges both: store entries win on name conflicts.

This router uses a **user cache file** at:
`~/.kenmark/cache/skills-registry.json`

It is generated per-user on first run and refreshed on every call. It never lives inside the repo.

**Do not modify project skills** (`<repo>/.agents/skills/`, `<repo>/.cursor/skills/`). Those are repo-scoped and out of scope for this router.

## Registry entry schema

Each skill in the registry includes:

| Field | Meaning |
| --- | --- |
| `name` | Skill directory name |
| `description` | Frontmatter `description` |
| `triggers` | Frontmatter `triggers` list (explicit invocation phrases) |
| `category` | Kenmark: `onboarding`, `workflow`, `git`, `issues`, `admin`. Third-party skills may use broader inferred labels. |
| `scope` | `universal` (Kenmark store / default setup) or `project-specific` (repo-local copy) |
| `project` | When `scope` is `project-specific`, target repo or product id |
| `phase` | Workflow phase: `setup`, `ship`, `maintain`, `verify`, `discover`, `plan`, `diagnose`, `audit` |
| `risk` | Side-effect level: `read-only`, `write-files`, `shell`, `git-write`, `destructive-possible` |
| `stack` | Stack fit, e.g. `["any"]`, `["django"]`, `["react", "typescript"]` |
| `allowedTools` | Frontmatter `allowed-tools` list |
| `maturity` | `stable` (Kenmark bundled), `catalog` (recommended pack), `user` (other) |
| `source` | Origin: `kenmark`, `catalog`, or `user` |
| `path` | Absolute path to the skill directory |

## Runtime bootstrap (always run first)

Before scoring skills, regenerate the cache file:

```bash
python3 - <<'PY'
import json
import re
from datetime import datetime, timezone
from pathlib import Path

cache_dir = Path.home() / ".kenmark/cache"
out_path = cache_dir / "skills-registry.json"
store_root = Path.home() / ".kenmark/store/skills"
user_root = Path.home() / ".agents/skills"

CATALOG_PATHS = [
    store_root.parent / "recommended-catalog.json",
    Path.home() / ".kenmark/recommended-catalog.json",
    Path.cwd() / "skills/user-skills/recommended-catalog.json",
]

KENMARK_SCAN_ROOTS = [
    store_root,
    Path.cwd() / "skills/user-skills",
]


def load_catalog_names() -> set[str]:
    names: set[str] = set()
    for catalog_path in CATALOG_PATHS:
        if not catalog_path.exists():
            continue
        try:
            data = json.loads(catalog_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            continue
        for pack in data.get("packs", []):
            pid = pack.get("id")
            if pid:
                names.add(pid)
        break
    return names


def load_kenmark_names() -> set[str]:
    names: set[str] = set()
    for root in KENMARK_SCAN_ROOTS:
        if not root.exists():
            continue
        for skill_dir in root.iterdir():
            if skill_dir.is_dir() and (skill_dir / "SKILL.md").exists():
                names.add(skill_dir.name)
    return names


def split_frontmatter(content: str) -> tuple[str, str]:
    m = re.match(r"^---\r?\n(.*?)\r?\n---\r?\n?", content, re.S)
    if not m:
        return "", content
    return m.group(1), content[m.end():]


def parse_scalar(raw: str) -> str:
    value = raw.strip()
    if (value.startswith('"') and value.endswith('"')) or (
        value.startswith("'") and value.endswith("'")
    ):
        return value[1:-1]
    return value


def parse_frontmatter(block: str) -> dict:
    meta: dict = {}
    current_key = None
    for line in block.splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if re.match(r"^\s+-\s+", line) and current_key:
            item = re.sub(r"^\s+-\s+", "", line).strip()
            meta.setdefault(current_key, []).append(parse_scalar(item))
            continue
        m = re.match(r"^([\w-]+):\s*(.*)$", line)
        if not m:
            continue
        key, rest = m.group(1), m.group(2).strip()
        current_key = key
        if rest:
            meta[key] = parse_scalar(rest)
        else:
            meta[key] = []
    return meta


def as_string_list(value) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(v).strip() for v in value if str(v).strip()]
    text = str(value).strip()
    return [text] if text else []


def infer_category(name: str, description: str, triggers: list[str]) -> str:
    if name == "init-brain" or name == "skills-init":
        return "onboarding"
    if (
        name == "skills-router"
        or name == "troubleshoot"
        or name == "repo-hygiene"
        or name.startswith("repo-")
    ):
        return "workflow"
    if name == "commit-push":
        return "git"
    if name.startswith("issues-") or name.endswith("-issues-scan"):
        return "issues"
    if name.startswith("skills-") or name == "subagents-maintain" or name.startswith("subagents-"):
        return "admin"
    text = " ".join([name, description, " ".join(triggers)]).lower()
    if any(k in text for k in ["commit", "push", "git ", "branch", "merge request"]):
        return "git"
    if "brain/issues" in text or "issues " in text:
        return "issues"
    if name.startswith("skills-") or "skill install" in text or "skill update" in text:
        return "admin"
    if "subagent" in text or "sub-agent" in text:
        return "admin"
    if "init brain" in text or "brain/rules" in text:
        return "onboarding"
    if "router" in text or "route skill" in text:
        return "workflow"
    if any(
        k in text
        for k in [
            "troubleshoot",
            "diagnose",
            "debug",
            "investigate",
            "root cause",
            "root-cause",
            "hypothesis",
        ]
    ):
        return "workflow"
    if "seo" in text or "geo " in text:
        return "seo"
    if any(k in text for k in ["design", "ui", "ux", "frontend", "visual", "impeccable"]):
        return "design"
    if any(k in text for k in ["test", "qa", "verification", "eval", "tdd"]):
        return "testing"
    if any(
        k in text
        for k in ["api", "backend", "django", "python", "database", "server", "nestjs"]
    ):
        return "backend"
    return "general"


def infer_phase(name: str, description: str, category: str) -> str:
    text = f"{name} {description}".lower()
    if any(k in text for k in ["init", "setup", "bootstrap", "install", "initialize"]):
        return "setup"
    if any(k in text for k in ["commit", "push", "deploy", "ship", "release"]):
        return "ship"
    if any(k in text for k in ["maintain", "update", "audit", "cleanup", "inventory", "prune"]):
        return "maintain"
    if any(k in text for k in ["check", "verify", "scan", "test", "validate"]):
        return "verify"
    if name == "repo-release-readiness":
        return "ship"
    if name == "repo-kb-sync":
        return "maintain"
    if name == "repo-dependency-audit":
        return "verify"
    if name.startswith("repo-"):
        return "audit"
    if any(
        k in text
        for k in [
            "repo hygiene",
            "sanitize repo clutter",
            "dirty repo",
            "cleanup files",
            "audit dirty repo",
            "secrets audit",
            "public repo",
            "safe to publish",
            "dependency audit",
            "docs audit",
            "structure audit",
            "release readiness",
            "update brain",
            "sync kb",
        ]
    ):
        return "audit"
    if name == "troubleshoot" or any(
        k in text
        for k in [
            "troubleshoot",
            "diagnose",
            "debug",
            "investigate",
            "root cause",
            "root-cause",
            "hypothesis",
        ]
    ):
        return "diagnose"
    if any(k in text for k in ["list", "find", "router", "discover", "search skill"]):
        return "discover"
    if any(k in text for k in ["plan", "roadmap", "design doc"]):
        return "plan"
    if category == "git":
        return "ship"
    if category == "issues" and "setup" in name:
        return "setup"
    if category == "issues":
        return "verify"
    if category == "admin" and "init" in name:
        return "setup"
    return "discover"


def infer_risk(name: str, description: str, allowed_tools: list[str]) -> str:
    text = f"{name} {description}".lower()
    tools = {t.lower() for t in allowed_tools}
    cli_skills = {
        "skills-init",
        "skills-update",
        "skills-maintain",
        "skills-install-recommended",
        "subagents-maintain",
    }
    if name in cli_skills:
        return "shell"
    if name == "commit-push":
        return "git-write"
    if name == "issues-maintenance":
        return "destructive-possible"
    if name == "issues-list" or name == "skills-router":
        return "read-only"
    if any(k in text for k in ["delete", "remove", "force push", "destructive", "drop table"]):
        return "destructive-possible"
    if tools & {"write", "edit"} or any(
        k in text for k in ["write", "create", "move", "install", "init", "setup", "scan"]
    ):
        return "write-files"
    return "read-only"


def infer_stack(name: str, description: str) -> list[str]:
    text = f"{name} {description}".lower()
    stacks = []
    for token in [
        "django",
        "react",
        "vue",
        "angular",
        "svelte",
        "typescript",
        "python",
        "rust",
        "go",
        "nestjs",
        "nextjs",
        "cursor",
        "claude",
    ]:
        if token in text:
            stacks.append(token)
    return stacks or ["any"]


def infer_source(name: str, from_store: bool, catalog_names: set[str], kenmark_names: set[str]) -> str:
    if from_store:
        return "kenmark"
    if name in kenmark_names:
        return "kenmark"
    if name in catalog_names:
        return "catalog"
    return "user"


def infer_maturity(source: str) -> str:
    if source == "kenmark":
        return "stable"
    if source == "catalog":
        return "catalog"
    return "user"


def load_skills_from(root: Path, catalog_names: set[str], kenmark_names: set[str]) -> list[dict]:
    out = []
    if not root.exists():
        return out
    from_store = root.resolve() == store_root.resolve()
    for skill_dir in sorted(p for p in root.iterdir() if p.is_dir()):
        skill_md = skill_dir / "SKILL.md"
        if not skill_md.exists():
            continue
        content = skill_md.read_text(encoding="utf-8", errors="ignore")
        fm_block, _ = split_frontmatter(content)
        meta = parse_frontmatter(fm_block)
        name = str(meta.get("name") or skill_dir.name).strip()
        description = str(meta.get("description") or "").strip()
        triggers = as_string_list(meta.get("triggers"))
        allowed_tools = as_string_list(meta.get("allowed-tools"))
        category = str(meta.get("category") or infer_category(name, description, triggers))
        phase = str(meta.get("phase") or infer_phase(name, description, category))
        risk = str(meta.get("risk") or infer_risk(name, description, allowed_tools))
        scope = str(meta.get("scope") or "universal").strip() or "universal"
        project = str(meta.get("project") or "").strip()
        stack = as_string_list(meta.get("stack")) or infer_stack(name, description)
        source = str(meta.get("source") or infer_source(name, from_store, catalog_names, kenmark_names))
        maturity = str(meta.get("maturity") or infer_maturity(source))
        entry = {
            "name": name,
            "description": description,
            "triggers": triggers,
            "category": category,
            "scope": scope,
            "phase": phase,
            "risk": risk,
            "stack": stack,
            "allowedTools": allowed_tools,
            "maturity": maturity,
            "source": source,
            "path": str(skill_dir.resolve()),
        }
        if project:
            entry["project"] = project
        out.append(entry)
    return out


catalog_names = load_catalog_names()
kenmark_names = load_kenmark_names()

by_name: dict[str, dict] = {}
for entry in load_skills_from(user_root, catalog_names, kenmark_names):
    by_name[entry["name"]] = entry
for entry in load_skills_from(store_root, catalog_names, kenmark_names):
    by_name[entry["name"]] = entry

skills = sorted(by_name.values(), key=lambda s: s["name"])

payload = {
    "version": 2,
    "generatedAt": datetime.now(timezone.utc).isoformat(),
    "cachePath": str(out_path),
    "storeRoot": str(store_root),
    "agentsRoot": str(user_root),
    "skillCount": len(skills),
    "skills": skills,
}

cache_dir.mkdir(parents=True, exist_ok=True)
out_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"Generated {out_path} with {len(skills)} skills")
PY
```

## When to run

Run this skill **while coding** — after **`troubleshoot`** when the problem is still unclear — when:

- You're implementing or debugging and the right skill isn't obvious (not the root cause itself)
- The user's request spans multiple domains (backend vs SEO vs design, etc.)
- No skill was auto-selected but specialized guidance would help
- The user says `/skills-router`, "pick the right skill", or "which skill should we use?"
- You are about to guess workflow steps that an existing skill already encodes

Do **not** use this skill for first-time Kenmark setup; use **`skills-init`** or **`init-brain`** instead.

## Routing algorithm

1. **Parse intent** from the user message:
   - **Domain** (category): git, issues, seo, design, backend, testing, admin, workflow
   - **Phase**: setup, ship, maintain, verify, discover, plan
   - **Stack**: frameworks or tools mentioned (django, react, python, …)
   - **Risk tolerance**: read-only listing vs writes vs destructive ops
   - **Constraints**: explicit tool limits, "don't commit", "read only", etc.

2. **Load registry**: read `~/.kenmark/cache/skills-registry.json` after the runtime bootstrap above completes.

3. **Score candidates** (top 3). Start each skill at 0:

   | Signal | Points |
   | --- | --- |
   | Exact `triggers[]` phrase appears in the user message | +4 |
   | Skill `name` or `/name` appears in the message | +3 |
   | `category` matches parsed domain | +2 |
   | `phase` matches parsed phase | +2 |
   | `stack` overlaps task stack, or skill has `"any"` | +2 |
   | Description keyword overlap (meaningful tokens, not stopwords) | +1 |
   | `allowedTools` includes tools the task needs (e.g. Bash for git) | +1 |
   | Kenmark `source` when tie-breaking equal names | +1 |
   | `category` clearly wrong for the task | −3 |
   | `phase` wrong (e.g. setup skill for a ship task) | −2 |
   | `risk` too high for a read-only request | −2 |
   | `risk` too low for a write/destructive request and no safer alternative | −1 |

4. **Tie-break** (in order):
   - Prefer skills with explicit `triggers[]` matches over description-only matches
   - Prefer narrower skills over umbrella skills (`seo-page` over `seo`; `django-tdd` over `coding-standards`)
   - Among `repo-*` skills, prefer the specialist over `repo-hygiene` (e.g. `repo-secrets-audit` for "find secrets", `repo-public-readiness` for "make public", "public repo readiness", "sanitize before public", `repo-release-readiness` for "npm publish")
   - If the task mentions **public**, **open source**, **publish**, or **safe to publish**, prefer **`repo-public-readiness`** over **`repo-hygiene`** even when the user also says "sanitize" or "clean"
   - Prefer `source: kenmark` over `catalog` over `user` when scores are equal
   - Prefer `maturity: stable` over `catalog` over `user`

5. **Load winner**: read the selected skill's `SKILL.md` and follow it for the rest of the task.

6. **Multi-skill tasks**: if two skills score within 1 point and serve **different phases** (e.g. `issues-scan` + `issues-check`, or `ce-plan` + `tdd-workflow`), load the primary first and note the secondary for the next phase.

7. **No match (score < 3)**: use `find-skills` to search for installable skills, then proceed with general capabilities.

## Category quick map

| If the task is about… | Prefer skills in category… | Examples |
| --- | --- | --- |
| Commits, pushes, git workflow | `git`   | `commit-push` |
| Issue tracking, brain/issues | `issues` | `issues-list`, `issues-check`, `issues-scan` |
| Search, rankings, metadata, structured data | `seo` | `seo-audit`, `seo-technical`, `seo-schema` |
| UI polish, layout, visual design, MUI | `design` | `impeccable`, `design-taste-frontend` |
| APIs, services, frameworks, languages | `backend` | `backend-patterns`, `django-patterns` |
| Tests, QA, verification, evals | `testing` | `tdd-workflow`, `verification-loop` |
| Skill install, update, inventory | `admin` | `skills-init`, `skills-maintain`, `skills-update` |
| Agent workflow, discovery, learning | `workflow` | `find-skills`, `continuous-learning`, `skills-router` |
| Troubleshoot, debug, root cause, investigate | `workflow` | `troubleshoot` |
| Repo clutter, scattered docs, dumps | `workflow` | `repo-hygiene` |
| Secrets, keys, tokens | `workflow` | `repo-secrets-audit` |
| Public / open-source safety | `workflow` | `repo-public-readiness` |
| Brain KB after code change | `workflow` | `repo-kb-sync` |
| Documentation quality | `workflow` | `repo-docs-audit` |
| Folder layout / structure | `workflow` | `repo-structure-audit` |
| Package / dependency health | `workflow` | `repo-dependency-audit` |
| Release, publish, handoff | `workflow` | `repo-release-readiness` |

## Output format

After routing, tell the user briefly:

```markdown
**Routed skill:** `<name>` (<category>, <phase>, risk:<risk>)
**Why:** <one sentence citing trigger/category/phase/stack match>
**Next:** <first concrete step from that skill>
```

Then execute using the routed skill — do not stop at the recommendation.

## Maintenance

- Kenmark bundled skills: refresh via `npx kenmark-skills setup` / `update` (store at `~/.kenmark/store/skills`)
- Other user skills: add under `~/.agents/skills/<skill-name>/` or install via npx
- Runtime bootstrap refreshes `~/.kenmark/cache/skills-registry.json` on each invocation
- Install new skills globally with: `npx skills add <owner/repo@skill> -g -y --agent claude-code cursor codex`
