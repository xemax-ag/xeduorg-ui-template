@echo off
python "%~dp0core\openapi\build_openapi_models_js.py"
python "%~dp0core\openapi\build_openapi_models_python.py"
