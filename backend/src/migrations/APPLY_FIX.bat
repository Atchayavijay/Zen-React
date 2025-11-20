@echo off
echo ==========================================
echo Status Constraint Migration
echo ==========================================
echo.
echo This will update the database constraint to allow all status values.
echo.
pause

REM Try to find psql.exe
set PSQL_PATH=
for /d %%i in ("C:\Program Files\PostgreSQL\*") do (
    if exist "%%i\bin\psql.exe" (
        set PSQL_PATH=%%i\bin\psql.exe
    )
)

if "%PSQL_PATH%"=="" (
    for /d %%i in ("C:\Program Files (x86)\PostgreSQL\*") do (
        if exist "%%i\bin\psql.exe" (
            set PSQL_PATH=%%i\bin\psql.exe
        )
    )
)

if "%PSQL_PATH%"=="" (
    echo PostgreSQL not found in standard locations.
    echo Please run this command manually:
    echo psql -U postgres -d zen_live -f "%~dp0fix_status_constraint.sql"
    pause
    exit /b
)

echo Found PostgreSQL at: %PSQL_PATH%
echo.
echo Running migration...
"%PSQL_PATH%" -U postgres -d zen_live -f "%~dp0fix_status_constraint.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Migration completed successfully!
) else (
    echo.
    echo Migration failed. Please check the error messages above.
)

echo.
pause

