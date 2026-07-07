@echo off
REM Upload the cockpit files (source/index.*) to the eduxept file API.
python "%~dp0core\upload\upload.py" --folder "strategies/template" %*
pause
