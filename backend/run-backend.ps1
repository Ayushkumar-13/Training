# Run Backend on E: Drive (Bypassing C: Drive low disk space limit)
$env:GOTMPDIR="E:\College\final year\training\.gotmp"
$env:GOCACHE="E:\College\final year\training\.gocache"
if (!(Test-Path "E:\College\final year\training\.gotmp")) { New-Item -ItemType Directory -Force -Path "E:\College\final year\training\.gotmp" }
if (!(Test-Path "E:\College\final year\training\.gocache")) { New-Item -ItemType Directory -Force -Path "E:\College\final year\training\.gocache" }

Set-Location -Path "E:\College\final year\training\backend"
go run main.go
