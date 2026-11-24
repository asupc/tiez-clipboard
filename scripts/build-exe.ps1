# 一键构建 TieZ Windows 可执行文件。
#
# 用法（在仓库根目录）：
#   .\build-exe.bat               构建独立可运行的 TieZ_<版本>_x64.exe
#   .\build-exe.bat -Installer    构建 NSIS 安装包（需要 .env 中的签名私钥）
#   .\build-exe.bat -NoOpen       构建完成后不打开输出目录
#
# 也可以直接运行：
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\build-exe.ps1
[CmdletBinding()]
param(
    [switch]$Installer,
    [switch]$NoOpen
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Write-Step([string]$message) {
    Write-Host ""
    Write-Host "==> $message" -ForegroundColor Cyan
}

function Fail([string]$message) {
    Write-Host ""
    Write-Host "构建失败：$message" -ForegroundColor Red
    exit 1
}

function Require-Command([string]$name, [string]$hint) {
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
        Fail "未找到 $name。$hint"
    }
}

Write-Host "TieZ Windows 构建" -ForegroundColor Green
Write-Host "仓库：$root"

Write-Step "检查构建环境"
Require-Command "node" "请安装 Node.js 20 或更新版本。"
Require-Command "npm" "请安装 Node.js（自带 npm）。"
Require-Command "cargo" "请安装 Rust 工具链：https://rustup.rs"
Require-Command "rustc" "请安装 Rust 工具链：https://rustup.rs"
Write-Host ("Node  {0}" -f (& node --version))
Write-Host ("Rust  {0}" -f (& rustc --version))

if (-not (Test-Path (Join-Path $root "node_modules"))) {
    Write-Step "安装前端依赖（首次构建）"
    & npm ci
    if ($LASTEXITCODE -ne 0) { Fail "npm ci 失败。" }
}

$tauriCli = Join-Path $root "node_modules\.bin\tauri.cmd"
if (-not (Test-Path $tauriCli)) {
    Write-Step "安装前端依赖（缺少 Tauri CLI）"
    & npm ci
    if ($LASTEXITCODE -ne 0) { Fail "npm ci 失败。" }
}

# versions.json 是版本号的唯一来源。
Write-Step "应用 versions.json 中的版本号"
& npm run apply-version:win
if ($LASTEXITCODE -ne 0) { Fail "应用版本号失败。" }

$version = (& node -p "require('./versions.json').stable.windows").Trim()
if (-not $version) { Fail "versions.json 中没有 stable.windows 版本号。" }

$architecture = switch -Regex ((& rustc -vV) -join "`n") {
    "host:\s*x86_64" { "x64" }
    "host:\s*aarch64" { "arm64" }
    default { "x64" }
}

$artifactsDir = Join-Path $root "artifacts"
New-Item -ItemType Directory -Force -Path $artifactsDir | Out-Null

if ($Installer) {
    Write-Step "构建 NSIS 安装包（需要 TAURI_SIGNING_PRIVATE_KEY）"
    if (-not (Test-Path (Join-Path $root ".env")) -and -not $env:TAURI_SIGNING_PRIVATE_KEY) {
        Fail "缺少签名私钥。请在仓库根目录创建 .env 并设置 TAURI_SIGNING_PRIVATE_KEY，或设置同名环境变量。"
    }
    & node (Join-Path $root "scripts\build-release.mjs") windows stable
    if ($LASTEXITCODE -ne 0) { Fail "安装包构建失败。" }

    $setup = Get-ChildItem (Join-Path $root "src-tauri\target\release\bundle\nsis\*-setup.exe") -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
    if (-not $setup) { Fail "没有找到 NSIS 安装包。" }

    $target = Join-Path $artifactsDir ("TieZ_{0}_{1}-setup.exe" -f $version, $architecture)
    Copy-Item $setup.FullName $target -Force

    Write-Host ""
    Write-Host "安装包已生成：" -ForegroundColor Green
    Write-Host "  $target"
} else {
    Write-Step "编译 Release 可执行文件"
    & npm run tauri:build -- --no-bundle
    if ($LASTEXITCODE -ne 0) { Fail "Tauri 构建失败。" }

    $exe = Join-Path $root "src-tauri\target\release\tiez-app.exe"
    if (-not (Test-Path $exe)) { Fail "没有找到构建产物：$exe" }

    $target = Join-Path $artifactsDir ("TieZ_{0}_{1}.exe" -f $version, $architecture)
    Copy-Item $exe $target -Force

    Write-Host ""
    Write-Host "可执行文件已生成：" -ForegroundColor Green
    Write-Host "  $target"
}

$sizeMb = [math]::Round((Get-Item $target).Length / 1MB, 2)
Write-Host ("  大小：{0} MB" -f $sizeMb)

if (-not $NoOpen) {
    Start-Process explorer.exe $artifactsDir
}
