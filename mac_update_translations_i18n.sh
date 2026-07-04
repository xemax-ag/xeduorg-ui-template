#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
python3 core/i18n/sync_translations.py
