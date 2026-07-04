@echo off
REM Starts the local dev server with live-reload.
REM Prerequisite: run install_requirements.bat once.
REM Extra arguments are passed through, e.g.:  devserver.bat --port 5500
REM Extra arguments are passed through, e.g.:  devserver.bat --open abc.html

REM python "%~dp0core\devserver\devserver.py" %*
python "%~dp0core\devserver\devserver.py" --open wrapper.html --port 8002
