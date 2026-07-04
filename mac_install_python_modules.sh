#!/usr/bin/env bash
# Installs the Python dependencies from requirements.txt.
set -euo pipefail

cd "$(dirname "$0")"
python3 -m pip install --upgrade pip
python3 -m pip install -r core/requirements.txt --no-warn-script-location
