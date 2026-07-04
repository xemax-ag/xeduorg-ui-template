@echo off
REM Starts the local web server with live-reload.
REM Prerequisite: run win_install_python_modules.bat once.
REM Extra arguments are passed through, e.g.:  win_webserver.bat --port 5500
REM Extra arguments are passed through, e.g.:  win_webserver.bat --open abc.html

python "%~dp0core\webserver\webserver.py" --open wrapper.html --port 8002
