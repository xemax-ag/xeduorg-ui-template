#!/usr/bin/env bash
# Starts the local dev server with live-reload.
# Prerequisite: uv installed (dependencies are synced into .venv automatically).
# Extra arguments are passed through, e.g.:  run_devserver.sh --port 5500
# Extra arguments are passed through, e.g.:  run_devserver.sh --open abc.html
set -euo pipefail

cd "$(dirname "$0")"
uv run core/devserver/devserver.py --open wrapper.html --port 8002 "$@"
