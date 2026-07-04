#!/usr/bin/env bash
# Starts the local web server with live-reload.
# Prerequisite: uv installed (dependencies are synced into .venv automatically).
# Extra arguments are passed through, e.g.:  linux_webserver.sh --port 5500
# Extra arguments are passed through, e.g.:  linux_webserver.sh --open abc.html
set -euo pipefail

cd "$(dirname "$0")"
uv run core/webserver/webserver.py --open wrapper.html --port 8002 "$@"
