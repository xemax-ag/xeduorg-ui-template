#!/usr/bin/env bash
# Upload the cockpit files (source/index.*) to the file API.
set -euo pipefail

cd "$(dirname "$0")"
python3 core/upload/upload.py --folder "strategies/template" "$@"
