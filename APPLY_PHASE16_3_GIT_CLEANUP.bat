@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0APPLY_PHASE16_3_GIT_CLEANUP.ps1"
set RC=%ERRORLEVEL%
echo.
if not "%RC%"=="0" (
  echo Phase 16.3 cleanup failed. Do not commit.
) else (
  echo Phase 16.3 cleanup passed.
)
pause
exit /b %RC%
