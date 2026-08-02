@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0APPLY_PHASE16_2_GIT_CLEANUP.ps1"
if errorlevel 1 (
  echo.
  echo Phase 16.2 cleanup failed. Do not commit.
  pause
  exit /b 1
)
echo.
echo Phase 16.2 cleanup passed. Confirm Deleted files in GitHub Desktop, then commit and push.
pause
