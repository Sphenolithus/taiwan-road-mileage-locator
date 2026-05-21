param(
  [string[]]$Csv = @(),
  [string[]]$FreewayCsv = @(),
  [string[]]$Kml = @(),
  [string]$Out = "",
  [switch]$Help
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$pythonScript = Join-Path $PSScriptRoot "prepare_mileposts.py"
$defaultOut = Join-Path $repoRoot "data\mileposts.geojson"

if (-not $Out) {
  $Out = $defaultOut
}

$pythonCandidates = @()
$pathPython = Get-Command python -ErrorAction SilentlyContinue
if ($pathPython) {
  $pythonCandidates += $pathPython.Source
}

$pathPy = Get-Command py -ErrorAction SilentlyContinue
if ($pathPy) {
  $pythonCandidates += $pathPy.Source
}

$bundledPython = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
if (Test-Path $bundledPython) {
  $pythonCandidates += $bundledPython
}

if (-not $pythonCandidates.Count) {
  throw "找不到 Python。請安裝 Python/Anaconda，或確認 Codex runtime Python 是否存在：$bundledPython"
}

$python = $pythonCandidates[0]
if ($Help) {
  Write-Host "Using Python: $python"
  & $python $pythonScript --help
  exit $LASTEXITCODE
}

$argsList = @($pythonScript)
foreach ($item in $Csv) {
  $argsList += @("--csv", $item)
}
foreach ($item in $FreewayCsv) {
  $argsList += @("--freeway-csv", $item)
}
foreach ($item in $Kml) {
  $argsList += @("--kml", $item)
}
$argsList += @("--out", $Out)

Write-Host "Using Python: $python"
& $python @argsList
