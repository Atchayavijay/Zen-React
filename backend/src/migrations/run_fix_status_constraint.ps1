# PowerShell script to apply the status constraint fix
# Run this from the backend directory

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$sqlFile = Join-Path $scriptPath "fix_status_constraint.sql"

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Status Constraint Migration" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL is accessible
try {
    # Try to find psql.exe in common PostgreSQL installation paths
    $psqlPaths = @(
        "C:\Program Files\PostgreSQL\*\bin\psql.exe",
        "C:\Program Files (x86)\PostgreSQL\*\bin\psql.exe"
    )
    
    $psqlPath = $null
    foreach ($path in $psqlPaths) {
        $found = Get-ChildItem $path -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) {
            $psqlPath = $found.FullName
            break
        }
    }
    
    if ($psqlPath) {
        Write-Host "Found PostgreSQL at: $psqlPath" -ForegroundColor Green
        Write-Host ""
        
        # Prompt for database details
        $dbName = Read-Host "Enter database name (default: zen_live)"
        if ([string]::IsNullOrWhiteSpace($dbName)) { $dbName = "zen_live" }
        
        $dbUser = Read-Host "Enter database user (default: postgres)"
        if ([string]::IsNullOrWhiteSpace($dbUser)) { $dbUser = "postgres" }
        
        Write-Host ""
        Write-Host "Running migration..." -ForegroundColor Yellow
        
        # Run the SQL file
        & $psqlPath -U $dbUser -d $dbName -f $sqlFile
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "Migration completed successfully!" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "Migration failed. Please check the error messages above." -ForegroundColor Red
        }
    } else {
        Write-Host "PostgreSQL (psql) not found in standard locations." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Please run the following command manually:" -ForegroundColor Cyan
        Write-Host "psql -U postgres -d zen_live -f `"$sqlFile`"" -ForegroundColor White
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run the migration manually using:" -ForegroundColor Cyan
    Write-Host "psql -U postgres -d zen_live -f `"$sqlFile`"" -ForegroundColor White
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

