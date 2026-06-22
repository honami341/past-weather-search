$ErrorActionPreference = "Stop"

$archivePath = Join-Path $PSScriptRoot "..\data\stations.js"
$raw = Get-Content -Raw $archivePath
$json = $raw.Substring($raw.IndexOf("["), $raw.LastIndexOf("]") - $raw.IndexOf("[") + 1)
$archiveStations = $json | ConvertFrom-Json

$precMap = @{}
foreach ($station in $archiveStations) {
  if (-not $precMap.ContainsKey($station.prec)) {
    $precMap[$station.prec] = @{
      prefecture = $station.prefecture
      area = $station.area
    }
  }
}

$master = Invoke-RestMethod -Uri "https://www.jma.go.jp/bosai/amedas/const/amedastable.json"
$currentStations = [System.Collections.Generic.List[object]]::new()
foreach ($property in $master.PSObject.Properties) {
  $amd = $property.Name
  $prec = $amd.Substring(0, 2)
  if (-not $precMap.ContainsKey($prec)) { continue }

  $currentStations.Add([ordered]@{
    prefecture = $precMap[$prec].prefecture
    area = $precMap[$prec].area
    name = $property.Value.kjName
    amd = $amd
    elems = $property.Value.elems
  })
}

$sorted = $currentStations | Sort-Object prefecture, area, name, amd
$output = $sorted | ConvertTo-Json -Depth 3 -Compress
$destination = Join-Path $PSScriptRoot "..\data\current-stations.js"
"// Generated from the Japan Meteorological Agency current AMeDAS station master.`nconst CURRENT_STATIONS = Object.freeze($output);" |
  Set-Content -Path $destination -Encoding utf8
Write-Host "Generated $($sorted.Count) current stations at $destination"
