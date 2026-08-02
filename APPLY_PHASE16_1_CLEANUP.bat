@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0APPLY_PHASE16_1_CLEANUP.ps1"
if errorlevel 1 (
  echo.
  echo Phase 16.1 cleanup failed.
  pause
  exit /b 1
)
echo.
echo Phase 16.1 cleanup passed.
pause
