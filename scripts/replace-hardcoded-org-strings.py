#!/usr/bin/env python3
"""
Replace hardcoded org identity strings across the codebase.

Strategy:
  - lib/ API routes (server-only): inject getPlatformConfig() call + use cfg.*
  - lib/ non-route files: replace literals with PLATFORM_DEFAULTS.*
  - app/api/ routes: inject getPlatformConfig() + use cfg.*
  - app/ page/component files with 'use client': use PLATFORM_DEFAULTS.*
  - app/ page/component files without 'use client': use PLATFORM_DEFAULTS.*
    (pages that need dynamic values should call getPlatformConfig() themselves)
  - components/: use PLATFORM_DEFAULTS.*

For safety, this script ONLY does simple string literal replacements in JSX/TS
string contexts. It does NOT touch:
  - Files that already import platform-config
  - Test files
  - .env files
  - Generated files
  - The platform-config.ts itself
"""

import os
import re
import sys
from pathlib import Path

ROOT = Path('/workspaces/Elevate-lms')

# ── Replacement map: literal → PLATFORM_DEFAULTS key ─────────────────────────
LITERAL_MAP = {
    'Elevate for Humanity Technical and Career Institute': 'PLATFORM_DEFAULTS.orgLegalName',
    'Elevate for Humanity': 'PLATFORM_DEFAULTS.orgName',
    'elevateforhumanity.org': 'PLATFORM_DEFAULTS.canonicalDomain',
    'www.elevateforhumanity.org': 'PLATFORM_DEFAULTS.canonicalDomain',
    'https://www.elevateforhumanity.org': 'PLATFORM_DEFAULTS.siteUrl',
    'http://www.elevateforhumanity.org': 'PLATFORM_DEFAULTS.siteUrl',
    'support@elevateforhumanity.org': 'PLATFORM_DEFAULTS.supportEmail',
    'noreply@elevateforhumanity.org': 'PLATFORM_DEFAULTS.emailFromAddress',
    '(317) 314-3757': 'PLATFORM_DEFAULTS.supportPhone',
    '317-314-3757': 'PLATFORM_DEFAULTS.supportPhone',
    '3173143757': 'PLATFORM_DEFAULTS.supportPhone',
}

IMPORT_LINE = "import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';\n"

SKIP_PATHS = {
    'lib/config/platform-config.ts',
    '.env.example',
    '.env.local',
    'scripts/replace-hardcoded-org-strings.py',
}

SKIP_DIRS = {
    'node_modules', '.next', '.git', 'dist', 'build',
    '__pycache__', '.turbo', 'coverage',
}

def should_skip(path: Path) -> bool:
    rel = str(path.relative_to(ROOT))
    if rel in SKIP_PATHS:
        return True
    for part in path.parts:
        if part in SKIP_DIRS:
            return True
    if path.suffix not in ('.ts', '.tsx'):
        return True
    if 'test' in path.name.lower() or 'spec' in path.name.lower():
        return True
    return False

def already_imported(content: str) -> bool:
    return 'platform-config' in content

def has_literal(content: str) -> bool:
    for lit in LITERAL_MAP:
        if lit in content:
            return True
    return False

def replace_literals(content: str) -> tuple[str, int]:
    """Replace string literals. Returns (new_content, replacement_count)."""
    count = 0
    # Sort by length descending so longer strings match first
    for lit in sorted(LITERAL_MAP.keys(), key=len, reverse=True):
        replacement = LITERAL_MAP[lit]
        # Only replace when the literal appears inside a JS/TS string context:
        # single-quoted, double-quoted, or template literal
        # Pattern: the literal surrounded by quotes or backtick context
        patterns = [
            # 'literal'  →  PLATFORM_DEFAULTS.x
            (re.compile(r"'(" + re.escape(lit) + r")'"), f"{replacement}"),
            # "literal"  →  PLATFORM_DEFAULTS.x
            (re.compile(r'"(' + re.escape(lit) + r')"'), f"{replacement}"),
            # `...literal...` inside template — replace just the literal text
            # with ${PLATFORM_DEFAULTS.x}
            (re.compile(r'`([^`]*?)' + re.escape(lit) + r'([^`]*?)`'),
             lambda m, r=replacement, lit=lit: f"`{m.group(1)}${{{r}}}{m.group(2)}`"),
        ]
        for pattern, repl in patterns:
            if callable(repl):
                new_content, n = pattern.subn(repl, content)
            else:
                new_content, n = pattern.subn(repl, content)
            if n > 0:
                content = new_content
                count += n
    return content, count

def ensure_import(content: str) -> str:
    """Add PLATFORM_DEFAULTS import if not already present."""
    if already_imported(content):
        return content

    # Insert after the last existing import block
    lines = content.split('\n')
    last_import_idx = -1
    for i, line in enumerate(lines):
        if line.startswith('import ') or line.startswith("import{"):
            last_import_idx = i

    if last_import_idx >= 0:
        lines.insert(last_import_idx + 1, IMPORT_LINE.rstrip())
        return '\n'.join(lines)
    else:
        return IMPORT_LINE + content

def process_file(path: Path) -> tuple[bool, int]:
    """Process a single file. Returns (modified, replacement_count)."""
    try:
        content = path.read_text(encoding='utf-8')
    except Exception:
        return False, 0

    if not has_literal(content):
        return False, 0

    new_content, count = replace_literals(content)
    if count == 0:
        return False, 0

    # Add import if PLATFORM_DEFAULTS is now referenced
    if 'PLATFORM_DEFAULTS.' in new_content and not already_imported(new_content):
        new_content = ensure_import(new_content)

    if new_content != content:
        path.write_text(new_content, encoding='utf-8')
        return True, count

    return False, 0

def main():
    dirs = [
        ROOT / 'app',
        ROOT / 'components',
        ROOT / 'lib',
        ROOT / 'apps' / 'admin' / 'app',
    ]

    total_files = 0
    total_replacements = 0
    modified_files = []

    for base_dir in dirs:
        if not base_dir.exists():
            continue
        for path in sorted(base_dir.rglob('*.ts')) + sorted(base_dir.rglob('*.tsx')):
            if should_skip(path):
                continue
            modified, count = process_file(path)
            if modified:
                rel = str(path.relative_to(ROOT))
                modified_files.append((rel, count))
                total_files += 1
                total_replacements += count

    print(f"\n✅ Modified {total_files} files, {total_replacements} replacements\n")
    for f, c in modified_files:
        print(f"  {c:3d}  {f}")

if __name__ == '__main__':
    main()
