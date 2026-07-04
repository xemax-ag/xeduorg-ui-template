@echo off
REM Installs the Python dependencies from requirements.txt.
python.exe -m pip install --upgrade pip
python -m pip install -r "%~dp0core\requirements.txt" --no-warn-script-location
pause
