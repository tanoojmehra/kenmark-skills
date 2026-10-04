---
name: kenmark-server-defense
version: 1.0.0
category: workflow
scope: universal
phase: audit
description: "Server & project vulnerability audit, breach detection, and host hardening. Audits Next.js/Node framework CVEs, running miners and rogue processes in /tmp, malicious crontabs/persistence, file permission blast radius, and provides containment & host hardening playbooks."
triggers:
  - server security audit
  - server vulnerability scan
  - host hardening
  - check server compromise
  - cryptominer scan
  - nextjs vulnerability audit
  - check malicious cron
  - incident response playbook
  - server hacked
  - kenmark-server-defense
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
  - TodoWrite
  - AskUserQuestion
risk: read-only
disable-model-invocation: false
---

# Kenmark Server Defense

## Purpose

Use this skill for a **host and project-level vulnerability audit, active compromise detection (IOC hunter), and server hardening review**.

It is designed to detect and counter real-world server compromises, such as public framework exploits (e.g. Next.js CVEs), stealth cryptominers running from temporary directories, multi-wave credential exfiltration droppers, unauthorized cron persistence, and insecure host configurations.

**Default behavior:** investigate and report in **read-only mode**. Do not terminate processes, delete files, or modify system configurations unless the user explicitly requests execution of containment or hardening steps after reviewing the findings.

---

## Boundary with other skills

| User intent | Use |
| --- | --- |
| Application code security review (SAST: auth logic, SQLi, SSRF, RBAC) | `kenmark-security-review` |
| Git repository secrets, keys, and token leak scanning | `kenmark-repo-secrets` |
| Host posture, running processes, cryptominers, cron persistence, framework CVEs, and server hardening | `kenmark-server-defense` |
| Application build, typecheck, lint, and test quality gates | `kenmark-repo-quality` |
| Unclear crash or application error troubleshooting | `kenmark-troubleshoot` |

---

## Diagnostic Workflow

Execute the following 4 inspection phases sequentially. Gather evidence and present a consolidated report.

```text
[Phase 1: Project & Framework CVEs] ──► [Phase 2: Host & Runtime Threat Hunter]
                                                    │
[Phase 4: Containment & Hardening]   ◄── [Phase 3: Secret Blast Radius & Isolation]
```

---

### Phase 1: Project & Monorepo Framework Vulnerability Audit

Audits deployed applications for known critical vulnerabilities that allow remote code execution (RCE) or authentication bypass.

#### 1. Next.js & Core Framework CVE Audit
Scan all `package.json` files in the current repository or deployed app directories (`/webServer/projects/*`):
```bash
# Locate all package.json files
find . -maxdepth 4 -name "package.json" -not -path "*/node_modules/*"
```
Inspect installed `next` versions. Flag known critical advisories:
- **CVE-2025-29927 (Next.js Middleware Auth Bypass):** Look for Next.js versions vulnerable to middleware routing bypasses where custom authorization headers or internal route prefixes (`_next/data`) fail to protect underlying server actions or pages.
- **CVE-2024-34351 (Server Actions SSRF):** Next.js Server Actions redirect SSRF vulnerabilities.
- **Next.js Image Optimizer SSRF / DoS:** Outdated versions allowing remote image optimization against arbitrary internal URLs.

#### 2. Production vs. Dev Mode Verification
Verify that deployed services run compiled production bundles rather than hot-reloading development servers:
- Check `pm2 list` or `systemctl list-units`: verify commands use `next start` or `node server.js` (standalone output) rather than `next dev` or `nodemon`. Development servers bypass security constraints, leak stack traces, and expose debugging endpoints.

#### 3. Repository Integrity & Webshell Scan
Check whether untracked or modified script files exist within the deployed application directories:
```bash
git status --porcelain
find . -type f \( -name "*.php" -o -name "*.sh" -o -name "*.py" \) -not -path "*/node_modules/*" -not -path "*/.git/*"
```
Flag any untracked scripts or anomalous executable files in public/asset folders.

---

### Phase 2: Host & Runtime Threat Hunter (IOC Detection)

Scans the running operating system for active indicators of compromise (IOCs), cryptominers, stealth binaries, and unauthorized persistence.

#### 1. Rogue Processes & Cryptominers
Check for CPU/RAM exhaustion and unauthorized background workers:
```bash
# Top CPU-consuming processes
ps aux --sort=-%cpu | head -n 15

# Top Memory-consuming processes
ps aux --sort=-%mem | head -n 15
```
Inspect for classic cryptominer characteristics:
- High sustained CPU utilization (>80% across multiple cores).
- Common miner names or configs: `xmrig`, `minerd`, `dashboard`, `v.json`, `config.json` inside temp directories.
- Randomly named single-word binaries (e.g. `jOWqJZYc`, `safenet-client`, `turbod`).
- Connections to known mining pool ports (`3333`, `19999`, `18081`, `8080`).

#### 2. Processes Executing from Temporary Directories & Deleted Executables
Legitimate services rarely execute binaries directly out of `/tmp` or `/dev/shm`. Attackers routinely drop malware in temp directories and delete the binary immediately to evade disk scanners.
```bash
# Processes running from /tmp, /var/tmp, or /dev/shm
ls -l /proc/*/cwd 2>/dev/null | grep -E '/tmp|/var/tmp|/dev/shm'

# Deleted running executables (PID alive, file removed from disk)
ls -l /proc/*/exe 2>/dev/null | grep '(deleted)'
```
Flag any process whose executable is marked `(deleted)` in `/tmp` as **CRITICAL**.

#### 3. Persistence Mechanism Audit
Attackers install backdoors via crontabs, systemd units, or shell startup scripts.
```bash
# Current user crontab
crontab -l 2>/dev/null

# System crontabs (if privileged access available)
ls -la /etc/cron* /etc/crontab 2>/dev/null

# User systemd units
ls -la ~/.config/systemd/user/ /etc/systemd/system/ 2>/dev/null
```
Scan for suspicious persistence patterns:
- Invocations of `useradd`, `adduser`, or `chpasswd` (e.g. attempting to create a rogue user like `pakchoi`).
- Edits targeting `/etc/sudoers` or `/etc/sudoers.d/*`.
- Piped downloads: `curl ... | sh`, `wget ... | bash`, or base64 decode pipelines.
- Outbound connections on non-standard timers (e.g. every 30 minutes).

#### 4. Temporary Filesystem Staging Scrutiny
Inspect `/tmp`, `/var/tmp`, and `/dev/shm` for dropper scripts, staging directories, or exfiltration payloads:
```bash
ls -la /tmp /var/tmp /dev/shm
```
Search for:
- Hidden shell scripts (`.e*.sh`, `.*.sh`).
- Staged exfiltration files: `aws_full.txt`, `tokens.txt`, `proc_all.txt`, `privkey.txt`, `*.tar.gz`, `*.zip`.
- Staged miner configurations (`v.json`).

#### 5. Network Egress & Listening Ports
Check active connections and listening interfaces:
```bash
# Listening TCP/UDP ports
ss -tulpn 2>/dev/null || netstat -tulpn 2>/dev/null

# Active external connections
ss -tupn 2>/dev/null || netstat -tupn 2>/dev/null
```
- Verify that internal databases (MariaDB, PostgreSQL, MongoDB, Redis) bind to `127.0.0.1` or internal VPC interfaces, **never** `0.0.0.0`.
- Flag active outbound connections to untrusted external IPs on non-standard ports.

---

### Phase 3: Secret Blast Radius & Permission Hardening

Evaluates the lateral movement risk if an unprivileged application user is compromised.

#### 1. Environment File (`.env`) Permission Audit
When multiple projects are hosted on a single server, loose file permissions allow a compromise in one app to harvest secrets from all other apps:
```bash
# Scan .env permissions across server projects
find /webServer /home /var/www . -name ".env*" -ls 2>/dev/null
```
- Any `.env` file with permissions looser than `600` (e.g. `644` readable by other users) is a **HIGH** blast-radius finding.
- All `.env` files must be owned strictly by the application user and readable only by that user (`chmod 600 .env`).

#### 2. Production Credential Hygiene
Check whether developer credentials, cloud CLI profiles, or unencrypted SSH keys exist on the production machine:
```bash
# Cloud credentials
ls -la ~/.aws/ ~/.gcp/ ~/.azure/ ~/.docker/config.json 2>/dev/null

# Package manager & git tokens
ls -la ~/.npmrc ~/.netrc ~/.git-credentials 2>/dev/null

# SSH private keys
ls -la ~/.ssh/ 2>/dev/null
```
Flag any plaintext cloud credentials or unprotected private keys on production servers. Production workloads should use scoped IAM instance roles or secret managers rather than long-lived developer tokens.

---

### Phase 4: Incident Containment & Hardening Playbook

When an active compromise or severe vulnerability is detected, provide the user with an actionable, structured containment and remediation sequence.

#### 1. Emergency Containment Steps
1. **Stop Compromised Application Services:**
   - In PM2: `pm2 stop <app_name>` or `pm2 delete <app_name>`.
   - In systemd: `sudo systemctl stop <service_name>`.
2. **Kill Malicious Processes:**
   - Terminate rogue PIDs immediately: `kill -9 <PID>`.
   - Verify termination: check `ps aux | grep <PID>` to confirm C2 socket closure.
3. **Quarantine Before Deletion:**
   - Preserve evidence for forensic analysis before clearing temp directories:
     ```bash
     mkdir -p /quarantine/incident-evidence-$(date +%Y%m%d)
     cp -rp /tmp/.e* /tmp/v.json /quarantine/incident-evidence-$(date +%Y%m%d)/ 2>/dev/null
     ```
4. **Purge Droppers & Temporary Artifacts:**
   - Remove malicious binaries, configs, and staging folders from `/tmp` and `/var/tmp`.
5. **Cleanse Persistence:**
   - Remove unauthorized lines from `crontab -e`.
   - Inspect `/etc/passwd` and `/etc/sudoers.d/` to verify no rogue users or privilege grants exist.

#### 2. Comprehensive Credential Revocation Checklist
If credentials or `.env` files were staged or exfiltrated, **assume all credentials on the server are burned**:
- [ ] **Database Passwords:** Rotate MariaDB/MySQL/PostgreSQL/MongoDB passwords across all affected apps.
- [ ] **Application Secrets:** Regenerate JWT signing secrets, encryption keys, and session cookies.
- [ ] **Cloud Provider Keys:** Immediately revoke AWS Access Keys / GCP Service Account keys found in `~/.aws` or environment files.
- [ ] **Git & Registry Tokens:** Revoke GitLab/GitHub deploy tokens, personal access tokens, and `.npmrc` authentication tokens.
- [ ] **SSH Keys:** Remove compromised public keys from all servers; regenerate server host keys and client private keys.
- [ ] **System User Passwords:** Change passwords for system users (`kits`, `root`, etc.).

#### 3. Permanent Host Hardening Blueprint
Guide the user to apply lasting OS-level protections:
- **Mount `/tmp` and `/var/tmp` with `noexec,nosuid,nodev`:**
  Add or update `/etc/fstab` to prevent binary execution from temporary directories:
  ```text
  tmpfs /tmp tmpfs defaults,noexec,nosuid,nodev 0 0
  ```
- **Process & User Isolation:**
  - Run different applications under dedicated, unprivileged system accounts rather than a single shared user.
  - Confinement ensures an exploit in one app cannot access sibling project directories or environment files.
- **Firewall & Egress Filtering:**
  - Restrict outbound server connections using UFW or iptables so compromised processes cannot connect to arbitrary external C2 servers or mining pools.
- **Automated Security Patching:**
  - Enable `unattended-upgrades` on Ubuntu/Debian to guarantee security updates for system packages.

---

## Report Template

When delivering audit results, format findings using this clear structure:

```markdown
# Server Defense & Vulnerability Audit Report

**Target:** [Server Name / Host / Directory]
**Status:** [Clean | Suspicious | Active Compromise Detected]
**Date:** [YYYY-MM-DD]

## Executive Summary
[2-3 sentence high-level synthesis of findings, risk level, and primary action required.]

## Findings Matrix

| Severity | Category | Finding | Evidence / Details | Action Required |
| --- | --- | --- | --- | --- |
| CRITICAL | Threat Hunter | XMRig miner active | PID 715369 in /tmp (deleted) | Kill PID, quarantine, purge /tmp |
| HIGH | Framework CVE | Next.js vulnerable | Monorepo app using v14.1.0 (CVE-2025-29927) | Upgrade Next.js to latest patch |
| HIGH | Secret Radius | .env file readable | chmod 644 on /webServer/app/.env | chmod 600 on all .env files |
| MEDIUM | Host Posture | /tmp missing noexec | /tmp mounted with exec flag | Remount /tmp with noexec in /etc/fstab |

## Containment & Remediation Plan
[Detailed step-by-step commands for the user to review and approve.]
```
