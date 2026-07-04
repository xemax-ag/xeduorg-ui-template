#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
python3 core/openapi/build_openapi_models_js.py
python3 core/openapi/build_openapi_models_python.py
