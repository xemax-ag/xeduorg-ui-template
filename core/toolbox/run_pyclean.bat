@echo off
REM Remove all Python cache files (__pycache__, .pyc) and build/tool debris from the repo.
cd /d "%~dp0..\.."
python -m pyclean . --debris
pause
