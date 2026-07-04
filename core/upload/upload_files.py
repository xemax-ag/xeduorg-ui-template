#!/usr/bin/env python3
"""Upload the cockpit files (HTML/JS/CSS) to the eduxept file API.

Mirrors the reference curl call:

    curl -X 'POST' 'http://localhost:8078/files/upload' \
      -H 'accept: application/json' \
      -H 'Authorization: Bearer <token>' \
      -H 'Content-Type: multipart/form-data' \
      -F 'file=@<path>' \
      -F 'subfolder=strategies/cockpit'
"""

from __future__ import annotations

import mimetypes
import os
from pathlib import Path
import sys
import httpx

__cwd__ = str(Path(__file__).parents[2]).replace('\\', '/')
sys.path.append(__cwd__)

from core.config import config

# --- Configuration -----------------------------------------------------------

# Disable TLS certificate verification (self-signed / internal cert).
_VERIFY = False

SUBFOLDER = "strategies/cockpit"
FILES = [
    "app.html", "app.css", "model.js", "view.js", "controller.js",
    "openapi.js",
    "wrapper.html", "wrapper.js",
    "base_data/projects/model.js", "base_data/projects/view.js",
    "locales/de.json", "locales/fr.json", "locales/it.json", "locales/en.json",
]


def upload_file(
    file_path: str,
    *,
    api_url: str = config.api_base_url + "/files/upload",
    token: str = '',
    subfolder: str = SUBFOLDER,
) -> dict:
    """Upload a single file and return the parsed JSON response.

    Raises FileNotFoundError if the file is missing, and httpx.HTTPStatusError
    on a non-2xx response.
    """
    if not os.path.isfile(file_path):
        raise FileNotFoundError(file_path)

    filename = os.path.basename(file_path)
    content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"

    with open(file_path, "rb") as fh:
        files = {"file": (filename, fh, content_type)}
        data = {"subfolder": subfolder}
        headers = {
            "accept": "application/json",
            "Authorization": f"Bearer {token}",
        }
        resp = httpx.post(
            api_url,
            files=files,
            data=data,
            headers=headers,
            verify=_VERIFY,
        )

    resp.raise_for_status()

    try:
        return resp.json()
    except ValueError:
        return {"raw": resp.text}


def upload_cockpit_files(
    files: list[str] | None = None,
    *,
    api_url: str = config.api_base_url + "/files/upload",
    token: str = '',
    subfolder: str = SUBFOLDER,
) -> dict[str, object]:
    """Upload all cockpit files; return a {filename: result} mapping."""
    files = files or FILES
    # This script lives in toolbox/upload/; the source files are at <repo>/source.
    repo_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    base_dir = os.path.join(repo_root, "app")
    results: dict[str, object] = {}

    for name in files:
        path = name if os.path.isabs(name) else os.path.join(base_dir, name)
        # Preserve subdirectories (e.g. base_data/projects/) on the server —
        # upload_file() only keeps the basename.
        rel_dir = "" if os.path.isabs(name) else os.path.dirname(name).replace("\\", "/")
        sub = f"{subfolder}/{rel_dir}" if rel_dir else subfolder
        try:
            results[name] = upload_file(
                path, api_url=api_url, token=token, subfolder=sub
            )
            print(f"[OK]   {name} -> {api_url} ({sub})")
        except FileNotFoundError:
            results[name] = {"error": "file not found", "path": path}
            print(f"[SKIP] {name}: not found at {path}")
        except httpx.HTTPStatusError as exc:
            detail = exc.response.text
            results[name] = {"error": f"HTTP {exc.response.status_code}", "detail": detail}
            print(f"[FAIL] {name}: HTTP {exc.response.status_code} {exc.response.reason_phrase} — {detail}")
        except httpx.HTTPError as exc:
            results[name] = {"error": str(exc)}
            print(f"[FAIL] {name}: {exc}")

    return results


if __name__ == "__main__":
    upload_cockpit_files(token=config.auth_token)
