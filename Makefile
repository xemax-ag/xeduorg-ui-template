echo: md_to_html sync_translations
	echo "xedu-org-ui-template"

md_to_html:
	uv run python core/toolbox/md_to_html.py

sync_translations:
	uv run python core/i18n/sync_translations.py

update_openapi:
	uv run python core/openapi/build_openapi_models_js.py
	uv run python core/openapi/build_openapi_models_python.py

deploy: sync_translations
	uv run python core/upload/upload.py

venv_build:
	rm -rf .venv && rm -rf uv.lock && uv sync --no-group dev

venv_build_dev:
	uv lock
	uvx uv-bump
	rm -rf .venv && rm -rf uv.lock && uv sync --all-groups
	rm -rf xedu_org_ui_template.egg-info

venv_update:
	uvx uv-bump
	uv sync
	#uv lock --upgrade
	#uv sync --upgrade

uv_install:
	curl -LsSf https://astral.sh/uv/install.sh | sh

uv_update:
	uv self update

uv_clear_cache:
	uv cache clean

zone:
	find . -name "*Zone.Identifier" -type f -delete

backup_source:
	rsync -av --delete \
		${USER}@${HOST}:app/app/static_protected/strategies/cockpit/ ./app/static_protected/strategies/cockpit/;

	rsync -av --delete \
		--exclude .venv \
		--exclude .claude \
		--exclude .pytest_cache \
		--exclude eduxecpt_api_v1.egg-info \
		--exclude .git \
		--exclude .idea \
		--exclude .pdm-build \
		--exclude **/__pycache__ \
		/home/phe/eduxept-api-v1/ admin_phe@192.168.1.12:/volume1/backup_phe/source/eduxept-api-v1/;

	rsync -av --delete \
		/home/phe/config/ admin_phe@192.168.1.12:/volume1/backup_phe/source/config/;

claude:
	uv run headroom wrap claude --port 8788

headroom:
	clear
	uv run headroom perf
