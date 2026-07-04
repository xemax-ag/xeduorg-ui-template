#!/usr/bin/env python3
"""Convert the repo's Markdown docs (CLAUDE.md, README.md) to HTML pages in docs/.

Uses the `markdown` module (https://python-markdown.github.io/) and wraps the
converted body in a minimal standalone HTML page.
"""

from pathlib import Path

import markdown

REPO_ROOT = Path(__file__).resolve().parents[2]
DOCS_DIR = REPO_ROOT / "docs"
FILES = [
    "CLAUDE.md",
    "README.md",
    "MVC.md",
    "TECHNOLOGY_DESCRIPTION.md",
]

PAGE_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<script>
/* Seed the theme from the browser default before first paint (no flash). */
if (window.matchMedia('(prefers-color-scheme: dark)').matches) {{
    document.documentElement.classList.add('dark');
}}
</script>
<style>
:root {{ color-scheme: light; --bg: #ffffff; --fg: #1f2937; --muted: #4b5563; --surface: #f3f4f6; --border: #d1d5db; --link: #2563eb; }}
html.dark {{ color-scheme: dark; --bg: #000000; --fg: #e5e7eb; --muted: #9ca3af; --surface: #1f2937; --border: #374151; --link: #60a5fa; }}
body {{ max-width: 52rem; margin: 2rem auto; padding: 0 1rem; font-family: system-ui, sans-serif; line-height: 1.6; background: var(--bg); color: var(--fg); }}
pre {{ background: var(--surface); padding: 1rem; overflow-x: auto; border-radius: 6px; }}
code {{ background: var(--surface); padding: 0.1rem 0.3rem; border-radius: 4px; font-size: 0.9em; }}
pre code {{ padding: 0; background: none; }}
table {{ border-collapse: collapse; }}
th, td {{ border: 1px solid var(--border); padding: 0.4rem 0.7rem; }}
blockquote {{ border-left: 4px solid var(--border); margin-left: 0; padding-left: 1rem; color: var(--muted); }}
a {{ color: var(--link); }}
#theme-toggle {{ position: fixed; top: 1rem; right: 1rem; background: var(--surface); color: var(--fg); border: 1px solid var(--border); border-radius: 6px; padding: 0.3rem 0.6rem; font-size: 1rem; cursor: pointer; }}
</style>
</head>
<body>
<button id="theme-toggle" type="button" aria-label="Toggle theme"></button>
{body}
<script>
(function () {{
    var toggle = document.getElementById('theme-toggle');
    function setIcon() {{
        toggle.textContent = document.documentElement.classList.contains('dark') ? '\\u2600\\ufe0f' : '\\ud83c\\udf19';
    }}
    toggle.addEventListener('click', function () {{
        document.documentElement.classList.toggle('dark');
        setIcon();
    }});
    setIcon();
}})();
</script>
</body>
</html>
"""


def md_to_html(file_path_source: Path, file_path_target: Path) -> Path:
    """Convert a single Markdown file to a standalone HTML page."""
    text = file_path_source.read_text(encoding='utf-8')
    body = markdown.markdown(text, extensions=['fenced_code', 'tables'])
    page = PAGE_TEMPLATE.format(title=file_path_source.stem, body=body)

    file_path_target.parent.mkdir(parents=True, exist_ok=True)
    file_path_target.write_text(page, encoding='utf-8')
    return file_path_target


def convert_docs(files: list[str] | None = None) -> list[Path]:
    """Convert the repo docs to HTML pages in DOCS_DIR; return the written paths."""
    results: list[Path] = []
    for name in files or FILES:
        source = REPO_ROOT / name
        target = DOCS_DIR / f'{Path(name).stem}.html'
        results.append(md_to_html(source, target))
        print(f'[OK] {name} -> {target.relative_to(REPO_ROOT)}')
    return results


if __name__ == '__main__':
    convert_docs()
