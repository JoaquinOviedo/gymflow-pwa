$ErrorActionPreference = 'Stop'
$AppDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Desktop = [Environment]::GetFolderPath('Desktop')
$ShortcutPath = Join-Path $Desktop 'GymFlow.lnk'
$VbsPath = Join-Path $AppDir 'iniciar_gymflow.vbs'

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($ShortcutPath)
$shortcut.TargetPath = $VbsPath
$shortcut.WorkingDirectory = $AppDir
$shortcut.IconLocation = "$env:SystemRoot\System32\SHELL32.dll,44"
$shortcut.Description = 'Iniciar GymFlow'
$shortcut.Save()

Write-Output "Acceso directo creado: $ShortcutPath"
