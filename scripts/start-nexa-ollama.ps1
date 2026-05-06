$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$ollamaExe = Join-Path $root '.tools\ollama\ollama.exe'
$modelsPath = Join-Path $root '.ollama\models'

if (-not (Test-Path -LiteralPath $ollamaExe)) {
    throw "Ollama runtime not found at $ollamaExe"
}

New-Item -ItemType Directory -Force -Path $modelsPath | Out-Null

$env:OLLAMA_HOST = '127.0.0.1:11434'
$env:OLLAMA_MODELS = $modelsPath

$existing = Get-Process -Name ollama -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "Ollama already running on 127.0.0.1:11434"
    exit 0
}

Start-Process -FilePath $ollamaExe -ArgumentList 'serve' -WindowStyle Hidden -WorkingDirectory (Split-Path -Parent $ollamaExe)
Write-Host "Ollama started on 127.0.0.1:11434"
