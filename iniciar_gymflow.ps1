$ErrorActionPreference = 'Continue'
$AppDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $AppDir

$Port = 5173
$Url = $null
$LogPath = Join-Path $AppDir '.gymflow-server.log'
$ErrorLogPath = Join-Path $AppDir '.gymflow-server-error.log'

function Write-LauncherLog([string]$Message) {
  Add-Content -LiteralPath $LogPath -Value "[$(Get-Date -Format s)] $Message"
}

function Test-GymFlowServer([int]$CheckPort) {
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:$CheckPort/" -TimeoutSec 2
    return $response.StatusCode -eq 200 -and $response.Content -match 'GymFlow'
  } catch {
    return $false
  }
}

function Update-FromGitHub {
  if (-not (Test-Path -LiteralPath (Join-Path $AppDir '.git'))) { return }

  & git fetch origin --quiet 2>$null
  $branch = (& git branch --show-current 2>$null).Trim()
  if ([string]::IsNullOrWhiteSpace($branch)) { $branch = 'main' }
  $remoteRef = "origin/$branch"
  & git rev-parse --verify $remoteRef 2>$null | Out-Null
  if ($LASTEXITCODE -ne 0) { return }

  $aheadText = (& git rev-list "HEAD..$remoteRef" --count 2>$null).Trim()
  $ahead = 0
  [void][int]::TryParse($aheadText, [ref]$ahead)
  if ($ahead -le 0) { return }

  $dirty = @(& git status --porcelain 2>$null)
  if ($dirty.Count -gt 0) {
    Write-LauncherLog "GitHub tiene $ahead actualización(es), pero se conserva el trabajo local porque el árbol no está limpio."
    return
  }

  & git pull --ff-only --quiet 2>>$ErrorLogPath
  if ($LASTEXITCODE -eq 0) { Write-LauncherLog "Se descargaron $ahead actualización(es) desde GitHub." }
  else { Write-LauncherLog 'No se pudo aplicar la actualización fast-forward; se inicia la versión local.' }
}

Update-FromGitHub

if (-not (Test-Path -LiteralPath (Join-Path $AppDir 'node_modules'))) {
  Write-LauncherLog 'No existe node_modules; instalando dependencias.'
  & npm.cmd install --no-audit --no-fund *>>$LogPath
  if ($LASTEXITCODE -ne 0) {
    Write-LauncherLog 'Falló la instalación de dependencias.'
    exit 1
  }
}

for ($candidate = 5173; $candidate -le 5193; $candidate++) {
  if (Test-GymFlowServer $candidate) {
    $Port = $candidate
    $Url = "http://127.0.0.1:$Port/"
    Start-Process $Url | Out-Null
    Write-LauncherLog "GymFlow ya estaba funcionando en el puerto $Port; navegador abierto."
    exit 0
  }
}

for ($candidate = 5173; $candidate -le 5193; $candidate++) {
  $listener = Get-NetTCPConnection -LocalPort $candidate -State Listen -ErrorAction SilentlyContinue
  if (-not $listener) {
    $Port = $candidate
    break
  }
}
$Url = "http://127.0.0.1:$Port/"

if (-not (Test-GymFlowServer $Port)) {
  Write-LauncherLog "Iniciando servidor en $Url."
  $npm = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
  if ([string]::IsNullOrWhiteSpace($npm)) { Write-LauncherLog 'No se encontró npm.cmd.'; exit 1 }
  Start-Process -FilePath $npm -ArgumentList @('run', 'dev', '--', '--host', '127.0.0.1', '--port', "$Port") -WorkingDirectory $AppDir -WindowStyle Hidden -RedirectStandardOutput $LogPath -RedirectStandardError $ErrorLogPath | Out-Null
}

for ($attempt = 0; $attempt -lt 45; $attempt++) {
  if (Test-GymFlowServer $Port) {
    Start-Process $Url | Out-Null
    Write-LauncherLog 'Servidor verificado; navegador abierto.'
    exit 0
  }
  Start-Sleep -Seconds 1
}

Write-LauncherLog 'El servidor no respondió con GymFlow dentro del tiempo esperado.'
exit 1
