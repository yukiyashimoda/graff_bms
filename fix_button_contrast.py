#!/usr/bin/env python3
"""
Fix dark-on-dark button contrast:
  background: 'var(--bg-dark)', color: 'var(--text-invert)'
  → cyan glassmorphism (matches existing style)
Any remaining var(--text-invert) → var(--text-primary)
"""

import re
import os
import glob

SRC_DIR = os.path.join(os.path.dirname(__file__), 'src')

CYAN_BG     = "rgba(129,236,255,0.12)"
CYAN_COLOR  = "#81ecff"
CYAN_BORDER = "1px solid rgba(129,236,255,0.3)"

files = glob.glob(os.path.join(SRC_DIR, '**', '*.tsx'), recursive=True) + \
        glob.glob(os.path.join(SRC_DIR, '**', '*.ts'),  recursive=True)

changed = []

for path in sorted(files):
    with open(path, encoding='utf-8') as f:
        original = f.read()

    text = original

    # ------------------------------------------------------------------ #
    # 1. Replace full paired style object:
    #    background: 'var(--bg-dark)', color: 'var(--text-invert)'
    #    → cyan glassmorphism (both single and double quotes)
    # ------------------------------------------------------------------ #
    # handles optional extra properties after (e.g., boxShadow)
    # Pattern: background: '[q]var(--bg-dark)[q]', color: '[q]var(--text-invert)[q]'
    paired = re.compile(
        r"background:\s*(['\"])var\(--bg-dark\)\1,\s*color:\s*(['\"])var\(--text-invert\)\2"
    )
    def replace_paired(m):
        q = "'"
        return (
            f"background: {q}{CYAN_BG}{q}, color: {q}{CYAN_COLOR}{q}, "
            f"border: {q}{CYAN_BORDER}{q}"
        )
    text = paired.sub(replace_paired, text)

    # Also handle reversed order: color first, then background
    paired_rev = re.compile(
        r"color:\s*(['\"])var\(--text-invert\)\1,\s*background:\s*(['\"])var\(--bg-dark\)\2"
    )
    def replace_paired_rev(m):
        q = "'"
        return (
            f"color: {q}{CYAN_COLOR}{q}, background: {q}{CYAN_BG}{q}, "
            f"border: {q}{CYAN_BORDER}{q}"
        )
    text = paired_rev.sub(replace_paired_rev, text)

    # ------------------------------------------------------------------ #
    # 2. Any remaining var(--text-invert) → var(--text-primary)
    #    (covers ternary conditionals and other unpaired uses)
    # ------------------------------------------------------------------ #
    text = re.sub(
        r"(['\"])var\(--text-invert\)\1",
        lambda m: f"{m.group(1)}var(--text-primary){m.group(1)}",
        text
    )

    if text != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(text)
        rel = os.path.relpath(path, os.path.dirname(__file__))
        changed.append(rel)

print(f"Modified {len(changed)} file(s):")
for p in changed:
    print(f"  {p}")
