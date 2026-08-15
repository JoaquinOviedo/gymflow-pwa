Option Explicit

Dim shell, fso, appDir, batchPath, command
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
appDir = fso.GetParentFolderName(WScript.ScriptFullName)
batchPath = fso.BuildPath(appDir, "iniciar_gymflow.bat")
command = "cmd.exe /d /c """ & batchPath & """"
shell.Run command, 0, False
