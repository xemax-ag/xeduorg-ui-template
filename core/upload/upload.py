#!/usr/bin/env python3
"""Zip the cockpit app/ folder and upload it to the file API.

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
import zipfile
import httpx

__cwd__ = str(Path(__file__).parents[2]).replace('\\', '/')
sys.path.append(__cwd__)

from core.config import config

# --- Configuration -----------------------------------------------------------

# Disable TLS certificate verification (self-signed / internal cert).
_VERIFY = False
SUBFOLDER = "strategies/template"
APP_DIR = Path(__file__).resolve().parents[2] / "app"
ZIP_PATH = Path(__file__).resolve().parent / "temp" / "app.zip"
EXCLUDED_FILENAMES = {"openapi.json"}


def zip_app_folder(app_dir: Path = APP_DIR, zip_path: Path = ZIP_PATH) -> Path:
    """Zip every file under app_dir into zip_path (paths kept relative to app_dir)."""
    zip_path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in sorted(app_dir.rglob("*")):
            if path.is_file() and path.name not in EXCLUDED_FILENAMES:
                zf.write(path, path.relative_to(app_dir).as_posix())
    return zip_path


def upload_file(
    file_path: str | Path,
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


def upload_app_zip(
    *,
    api_url: str = config.api_base_url + "/files/upload",
    token: str = '',
    subfolder: str = SUBFOLDER,
) -> dict[str, object]:
    """Zip app/ into core/upload/temp/app.zip, then upload it to subfolder."""
    zip_path = zip_app_folder()
    print(f"[ZIP]  {APP_DIR} -> {zip_path}")
    try:
        result = upload_file(zip_path, api_url=api_url, token=token, subfolder=subfolder)
        print(f"[OK]   {zip_path.name} -> {api_url} ({subfolder})")
        return result
    except httpx.HTTPStatusError as exc:
        detail = exc.response.text
        print(f"[FAIL] {zip_path.name}: HTTP {exc.response.status_code} {exc.response.reason_phrase} — {detail}")
        return {"error": f"HTTP {exc.response.status_code}", "detail": detail}
    except httpx.HTTPError as exc:
        print(f"[FAIL] {zip_path.name}: {exc}")
        return {"error": str(exc)}


if __name__ == "__main__":
    upload_app_zip(token=config.auth_token)
