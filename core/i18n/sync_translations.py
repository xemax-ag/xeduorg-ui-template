"""Sync the non-German locale files against the German base.

German (`public/locales/de_translation.json`) is the canonical schema. For each
target language (en, fr, it) this script:

  * adds any key present in German but missing in the target — translating the
    German value via DeepL (`deepl_service.translator`),
  * re-translates keys whose German value changed since the last run (detected
    by comparing against the `de_translation_cmp.json` snapshot),
  * leaves keys whose German value is unchanged untouched (no re-translation),
  * deletes keys present in the target but absent from German.

After a successful run, the current German base is snapshotted to
`public/locales/de_translation_cmp.json` so the next run can tell what changed.

The output mirrors the German key order so diffs stay clean.

Run from the repo root (so `app...` imports resolve):

    source .venv/bin/activate
    python -m app.i18n.sync_translations            # write changes
    python -m app.i18n.sync_translations --dry-run   # report only, no writes
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
import sys

__cwd__ = str(Path(__file__).parents[2]).replace('\\', '/')
sys.path.append(__cwd__)

from core.i18n.deepl_service import Language, translator

# app/i18n/sync_translations.py -> repo root is two parents up.
LOCALES_DIR = Path(__file__).resolve().parents[2] / "app" / "locales"
BASE_LANG = Language.DE
TARGET_LANGS = (Language.EN, Language.FR, Language.IT)
# Snapshot of the German base as it was at the end of the previous run.
CMP_PATH = LOCALES_DIR / "cmp" / "de_cmp.json"

# i18next interpolation placeholders ({{username}}, {{count}}, …) must survive
# translation verbatim. DeepL would happily mangle them, so we swap each one for
# a private-use-area sentinel (which DeepL passes through untouched) before
# translating, then restore it afterwards.
PLACEHOLDER_RE = re.compile(r"\{\{.*?\}\}")
_SENTINEL_OPEN = ""
_SENTINEL_CLOSE = ""
# Restore tolerantly: DeepL occasionally pads tokens with stray whitespace, so
# allow optional spaces around the index digits between the sentinel chars.
_SENTINEL_RE = re.compile(rf"{_SENTINEL_OPEN}\s*(\d+)\s*{_SENTINEL_CLOSE}")


def _locale_path(lang: Language) -> Path:
    return LOCALES_DIR / f"{lang.value}.json"


def _load(lang: Language) -> dict:
    path = _locale_path(lang)
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def _flatten(tree: dict, path: str = "") -> dict[str, str]:
    """Flatten a nested locale dict to {dotted.path: leaf_value}."""
    flat: dict[str, str] = {}
    for key, value in tree.items():
        key_path = f"{path}.{key}" if path else key
        if isinstance(value, dict):
            flat.update(_flatten(value, key_path))
        else:
            flat[key_path] = value
    return flat


def compare_against_last_run(base: dict, snapshot: dict) -> dict[str, list[str]]:
    """Compare the current German base against the previous-run snapshot.

    Returns dotted key paths grouped into `added` (new in base), `removed`
    (gone from base) and `changed` (German value differs). `changed` keys are
    what we force-re-translate, since their existing target translation is now
    stale.
    """
    current = _flatten(base)
    previous = _flatten(snapshot)
    return {
        "added": [k for k in current if k not in previous],
        "removed": [k for k in previous if k not in current],
        "changed": [k for k in current if k in previous and current[k] != previous[k]],
    }


def _translate(text: str, target: Language) -> str:
    """Translate German `text` to `target`, preserving {{placeholders}} verbatim.

    Each {{...}} run is replaced by a private-use sentinel before translation
    and restored afterwards. If any placeholder fails to survive the round trip
    we raise rather than emit a string with a dropped or duplicated placeholder,
    so a translation that would break i18next interpolation never reaches disk.
    """
    placeholders: list[str] = []

    def _stash(match: re.Match) -> str:
        placeholders.append(match.group(0))
        return f"{_SENTINEL_OPEN}{len(placeholders) - 1}{_SENTINEL_CLOSE}"

    protected = PLACEHOLDER_RE.sub(_stash, text)
    if not placeholders:
        return translator(text=text, source=BASE_LANG, target=target)

    translated = translator(text=protected, source=BASE_LANG, target=target)

    def _restore(match: re.Match) -> str:
        return placeholders[int(match.group(1))]

    restored = _SENTINEL_RE.sub(_restore, translated)

    # Guard: the exact set of placeholders must come back, with no sentinel
    # residue left behind. Verbatim preservation is a hard requirement.
    if (
        _SENTINEL_OPEN in restored
        or _SENTINEL_CLOSE in restored
        or sorted(PLACEHOLDER_RE.findall(restored)) != sorted(placeholders)
    ):
        raise RuntimeError(
            f"Placeholder preservation failed translating {text!r} → "
            f"[{target.value}] {restored!r}; expected placeholders {placeholders}"
        )
    return restored


def _sync(
    base: dict,
    existing: dict,
    target: Language,
    changed_paths: set[str],
    path: str = "",
) -> tuple[dict, dict]:
    """Rebuild a target subtree from the German shape.

    Returns (synced_subtree, stats) where stats counts added/changed/kept keys.
    Surplus keys are dropped implicitly because we only ever emit German keys.
    `changed_paths` holds dotted paths whose German value changed since the last
    run — those leaves are re-translated even if a target value already exists.
    """
    out: dict = {}
    stats = {"added": 0, "changed": 0, "kept": 0}

    for key, base_value in base.items():
        key_path = f"{path}.{key}" if path else key
        existing_value = existing.get(key)

        if isinstance(base_value, dict):
            child_existing = existing_value if isinstance(existing_value, dict) else {}
            out[key], child_stats = _sync(base_value, child_existing, target, changed_paths, key_path)
            for k in stats:
                stats[k] += child_stats[k]
        else:
            # Leaf: keep an existing string unless its German source changed.
            if isinstance(existing_value, str) and key_path not in changed_paths:
                out[key] = existing_value
                stats["kept"] += 1
            else:
                out[key] = _translate(str(base_value), target)
                if isinstance(existing_value, str):
                    stats["changed"] += 1
                    print(f"  ~ [{target.value}] {key_path}: {out[key]!r} (re-translated)")
                else:
                    stats["added"] += 1
                    print(f"  + [{target.value}] {key_path}: {out[key]!r}")

    # Report surplus keys we are dropping.
    for key in existing:
        if key not in base:
            key_path = f"{path}.{key}" if path else key
            print(f"  - [{target.value}] {key_path} (removed — not in German base)")

    return out, stats


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Report additions/removals without writing files.",
    )
    args = parser.parse_args()

    base = _load(BASE_LANG)
    if not base:
        raise SystemExit(f"German base not found or empty: {_locale_path(BASE_LANG)}")

    # Diff the German base against the previous-run snapshot.
    snapshot = json.loads(CMP_PATH.read_text(encoding="utf-8")) if CMP_PATH.exists() else {}
    diff = compare_against_last_run(base, snapshot)
    print("== German base vs last run ==")
    if not CMP_PATH.exists():
        print("  no snapshot yet — every key treated as new")
    elif not any(diff.values()):
        print("  no changes since last run")
    else:
        for path_str in diff["added"]:
            print(f"  + {path_str} (new)")
        for path_str in diff["changed"]:
            print(f"  ~ {path_str} (value changed → will re-translate)")
        for path_str in diff["removed"]:
            print(f"  - {path_str} (removed from base)")
    changed_paths = set(diff["changed"])

    for target in TARGET_LANGS:
        print(f"\n== {target.value} ==")
        existing = _load(target)
        synced, stats = _sync(base, existing, target, changed_paths)

        if args.dry_run:
            print(
                f"  (dry-run) would add {stats['added']}, "
                f"re-translate {stats['changed']}, keep {stats['kept']}"
            )
            continue

        path = _locale_path(target)
        path.write_text(
            json.dumps(synced, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(
            f"  wrote {path.name}: added {stats['added']}, "
            f"re-translated {stats['changed']}, kept {stats['kept']}"
        )

    # Snapshot the current German base so the next run can diff against it.
    if not args.dry_run:
        CMP_PATH.parent.mkdir(parents=True, exist_ok=True)
        CMP_PATH.write_text(
            json.dumps(base, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"\nsnapshot written: {CMP_PATH.name}")


if __name__ == "__main__":
    main()
