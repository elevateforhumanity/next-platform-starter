# Dev Studio Unused Workspace Tabs Audit

**Date:** June 24, 2026

---

## WORKSPACE TABS DEFINED (11 total)

| # | Tab ID | Label | Icon | Content | Status |
|---|-------|-------|------|---------|--------|
| 1 | `studio` | Studio | Bot | Quick actions + terminal | ✅ USED |
| 2 | `autopilot` | Autopilot | Zap | **NONE** | ❌ EMPTY |
| 3 | `the-bosses` | The Bosses (VR) | Globe | Iframe to /admin/staff-portal/vr | ✅ USED |
| 4 | `force-deploy` | Nuclear Deploy | Zap | Alert button (mock) | ⚠️ MOCK |
| 5 | `command` | Command | LayoutDashboard | **NONE** | ❌ EMPTY |
| 6 | `deploy` | Deploy | Rocket | **NONE** | ❌ EMPTY |
| 7 | `files` | Files | FolderOpen | **NONE** | ❌ EMPTY |
| 8 | `environments` | Container | Box | **NONE** | ❌ EMPTY |
| 9 | `health` | Health | Activity | **NONE** | ❌ EMPTY |
| 10 | `secrets` | Secrets | Key | **NONE** | ❌ EMPTY |
| 11 | `integrations` | Integrations | Plug | **NONE** | ❌ EMPTY |

---

## SUMMARY

| Status | Count | Percentage |
|--------|-------|-----------|
| ✅ HAS CONTENT | 2 | 18% |
| ⚠️ MOCK ONLY | 1 | 9% |
| ❌ EMPTY | 8 | 73% |

**8 out of 11 workspace tabs have NO content rendered.**

---

## EMPTY TABS DETAIL

| Tab | Related Admin Route | Action Needed |
|-----|-------------------|---------------|
| `autopilot` | `/admin/autopilot` | EXISTS - needs iframe/embed |
| `command` | None | **CREATE** or **REMOVE** |
| `deploy` | `/admin/studio/deployments` | EXISTS - needs iframe/embed |
| `files` | `/admin/files` | EXISTS - needs iframe/embed |
| `environments` | None | **CREATE** or **REMOVE** |
| `health` | `/admin/system-health` | EXISTS - needs iframe/embed |
| `secrets` | None | **CREATE** or **REMOVE** |
| `integrations` | `/admin/integrations` | EXISTS - needs iframe/embed |

---

## RECOMMENDATIONS

### OPTION A: Quick Fix (Use iframes)
Embed existing admin pages into empty workspaces:

| Tab | Embed Route |
|-----|-------------|
| `autopilot` | `/admin/autopilot` |
| `deploy` | `/admin/studio/deployments` |
| `files` | `/admin/files` |
| `health` | `/admin/system-health` |
| `integrations` | `/admin/integrations` |

### OPTION B: Remove Empty Tabs
Remove these from WORKSPACES array and code:
- `command` - no route
- `environments` - no route  
- `secrets` - no route

### OPTION C: Build Real Content
Create actual workspace content for each empty tab.

---

## WHICH OPTION DO YOU WANT?

1. **A** - Quick fix with iframes (fastest)
2. **B** - Remove empty tabs (cleanest)
3. **C** - Build real content (longest)
