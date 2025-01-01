# Parameter Definition
param(
    [Parameter(Mandatory = $true)]
    [string]$baseDestination,
    [switch]$FullCopy = $false
)

# Set environment variable to force English output
$env:LANG = "en_US.UTF-8"

# Validate base destination path
if (-not $baseDestination) {
    Write-Host "Error: Base destination path is required." -ForegroundColor Red
    exit 1
}

# Get parent directory of the script location (project root)
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

# Get project folder name
$projectName = Split-Path $projectRoot -Leaf

# Set destination path (needs to be replaced with actual destination path)
# $baseDestination = "\\DESKTOP-QR2KSJE\Users\hyperV\Desktop"
$destinationPath = Join-Path $baseDestination $projectName

# Ensure destination directory exists
if (-not (Test-Path -Path $baseDestination)) {
    Write-Host "Error: Base destination path does not exist: $baseDestination" -ForegroundColor Red
    exit 1
}

try {
    if (-not (Test-Path -Path $destinationPath)) {
        Write-Host "Creating destination directory: $destinationPath" -ForegroundColor Yellow
        New-Item -ItemType Directory -Path $destinationPath -Force
    }
}
catch {
    Write-Host "Error: Failed to create destination directory: $_" -ForegroundColor Red
    exit 1
}

Write-Host "Starting file synchronization..." -ForegroundColor Yellow
Write-Host "From: $projectRoot" -ForegroundColor Cyan
Write-Host "To: $destinationPath" -ForegroundColor Cyan
Write-Host "Full Copy Mode: $FullCopy" -ForegroundColor Cyan

# Set robocopy parameters
$robocopyArgs = @(
    "`"$projectRoot`"",
    "`"$destinationPath`"",
    "/MIR",  # Mirror directory tree
    #"/NP",  # Don't show progress
    "/NFL",  # Don't log file names
    "/NDL",  # Don't log directory names
    "/MT:16" # Use 16 threads
)

# Add parameters based on whether full copy is enabled
if (-not $FullCopy) {
    $robocopyArgs += "/XD"
    $robocopyArgs += "`"$projectRoot\release`""
    $robocopyArgs += "`"$projectRoot\node_modules`""
    $robocopyArgs += "`"$projectRoot\dist`""
    $robocopyArgs += "`"$projectRoot\.git`""
}

try {
    # Execute robocopy command
    $robocopyCommand = "robocopy " + ($robocopyArgs -join " ")
    Write-Host "Executing command: $robocopyCommand" -ForegroundColor Gray
    Invoke-Expression $robocopyCommand

    # Check robocopy return value
    $exitCode = $LASTEXITCODE
    switch ($exitCode) {
        0 { Write-Host "Success: No files were copied." -ForegroundColor Green }
        1 { Write-Host "Success: Files were copied successfully." -ForegroundColor Green }
        2 { Write-Host "Success: Extra files or directories were detected." -ForegroundColor Green }
        3 { Write-Host "Success: Files were copied and extra files were detected." -ForegroundColor Green }
        default { 
            Write-Host "Error occurred during synchronization. Error code: $exitCode" -ForegroundColor Red 
            exit $exitCode
        }
    }
}
catch {
    Write-Host "Error executing robocopy: $_" -ForegroundColor Red
    exit 1
}
