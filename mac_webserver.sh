#!/usr/bin/env bash
# Starts the local web server with live-reload.
# Prerequisite: run mac_install_python_modules.sh once.
# Extra arguments are passed through, e.g.:  mac_webserver.sh --port 5500
# Extra arguments are passed through, e.g.:  mac_webserver.sh --open abc.html
# Extra arguments are passed through, e.g.:  mac_webserver.sh --noload

set -euo pipefail

cd "$(dirname "$0")"
python3 core/webserver/webserver.py --open wrapper.html --port 8002 "$@"
