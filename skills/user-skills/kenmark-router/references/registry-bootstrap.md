# Registry bootstrap

Before scoring skills, regenerate `~/.kenmark/cache/skills-registry.json`:

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
    if name == "kenmark-init" or name == "kenmark-setup":
        return "onboarding"
    if (
        name == "kenmark-router"
        or name == "kenmark-troubleshoot"
        or name == "kenmark-repo-hygiene"
        or name.startswith("kenmark-repo-")
    ):
        return "workflow"
    if name == "kenmark-commit":
        return "git"
    if name.startswith("kenmark-issues-"):
        return "issues"
    if name.startswith("kenmark-test-"):
        return "testing"
    if name in ("kenmark-update", "kenmark-skills-maintain", "kenmark-agents"):
        return "admin"
    text = " ".join([name, description, " ".join(triggers)]).lower()
    if any(k in text for k in ["commit", "push", "git ", "branch", "merge request"]):
        return "git"
    if "brain/issues" in text or "issues " in text:
        return "issues"
    if name.startswith("kenmark-update") or "skill install" in text or "skill update" in text:
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
            "kenmark-troubleshoot",
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
    if name == "kenmark-repo-release":
        return "ship"
    if name == "kenmark-kb-sync":
        return "maintain"
    if name == "kenmark-repo-deps":
        return "verify"
    if name in ("kenmark-security-review", "kenmark-performance"):
        return "audit"
    if name.startswith("kenmark-repo-"):
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
            "security review",
            "performance review",
            "performance audit",
            "auth bypass",
            "n+1",
            "bundle size",
            "hydration",
        ]
    ):
        return "audit"
    if name == "kenmark-troubleshoot" or any(
        k in text
        for k in [
            "kenmark-troubleshoot",
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
        "kenmark-setup",
        "kenmark-update",
        "kenmark-skills-maintain",
        "kenmark-update",
        "kenmark-agents",
    }
    if name in cli_skills:
        return "shell"
    if name == "kenmark-commit":
        return "git-write"
    if name == "kenmark-tracker-maintain":
        return "destructive-possible"
    if name == "kenmark-tracker-list" or name == "kenmark-router":
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
