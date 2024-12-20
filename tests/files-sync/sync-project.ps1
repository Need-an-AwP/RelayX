# 参数定义
param(
    [Parameter(Mandatory = $true)]
    [string]$baseDestination,
    [switch]$FullCopy = $false
)

# 设置环境变量以强制英文输出
$env:LANG = "en_US.UTF-8"

# 验证基础目标路径
if (-not $baseDestination) {
    Write-Host "Error: Base destination path is required." -ForegroundColor Red
    exit 1
}

# 获取脚本所在目录的父目录（项目根目录）
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

# 获取项目文件夹名称
$projectName = Split-Path $projectRoot -Leaf

# 设置目标路径（这里需要替换为实际的目标路径）
# $baseDestination = "\\DESKTOP-QR2KSJE\Users\hyperV\Desktop"
$destinationPath = Join-Path $baseDestination $projectName

# 确保目标目录存在
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

# 设置robocopy参数
$robocopyArgs = @(
    "`"$projectRoot`"",
    "`"$destinationPath`"",
    "/MIR",#镜像
    #"/NP",#不显示进度
    "/NFL",#不记录文件
    "/NDL",#不记录目录
    "/MT:16"#多线程
)

# 根据是否全量复制添加参数
if (-not $FullCopy) {
    $robocopyArgs += "/XD"
    $robocopyArgs += "`"$projectRoot\release`""
    $robocopyArgs += "`"$projectRoot\node_modules`""
    $robocopyArgs += "`"$projectRoot\dist`""
    $robocopyArgs += "`"$projectRoot\.git`""
}

try {
    # 执行robocopy命令
    $robocopyCommand = "robocopy " + ($robocopyArgs -join " ")
    Write-Host "Executing command: $robocopyCommand" -ForegroundColor Gray
    Invoke-Expression $robocopyCommand

    # 检查robocopy的返回值
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
