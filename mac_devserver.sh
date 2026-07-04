#!/usr/bin/env bash
# Starts the local dev server with live-reload.
# Prerequisite: run mac_install_python_modules.sh once.
# Extra arguments are passed through, e.g.:  mac_devserver.sh --port 5500
# Extra arguments are passed through, e.g.:  mac_devserver.sh --open abc.html
set -euo pipefail

cd "$(dirname "$0")"
python3 core/devserver/devserver.py --open wrapper.html --port 8002 "$@"
