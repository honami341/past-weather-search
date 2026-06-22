$ErrorActionPreference = "Stop"

$groups = @(
  @{ Prefecture = "北海道"; Regions = @(@("11", "宗谷"), @("12", "上川"), @("13", "留萌"), @("14", "石狩"), @("15", "空知"), @("16", "後志"), @("17", "網走・北見・紋別"), @("18", "根室"), @("19", "釧路"), @("20", "十勝"), @("21", "胆振"), @("22", "日高"), @("23", "渡島"), @("24", "檜山")) },
  @{ Prefecture = "青森県"; Regions = @(@("31", "青森県")) },
  @{ Prefecture = "秋田県"; Regions = @(@("32", "秋田県")) },
  @{ Prefecture = "岩手県"; Regions = @(@("33", "岩手県")) },
  @{ Prefecture = "宮城県"; Regions = @(@("34", "宮城県")) },
  @{ Prefecture = "山形県"; Regions = @(@("35", "山形県")) },
  @{ Prefecture = "福島県"; Regions = @(@("36", "福島県")) },
  @{ Prefecture = "茨城県"; Regions = @(@("40", "茨城県")) },
  @{ Prefecture = "栃木県"; Regions = @(@("41", "栃木県")) },
  @{ Prefecture = "群馬県"; Regions = @(@("42", "群馬県")) },
  @{ Prefecture = "埼玉県"; Regions = @(@("43", "埼玉県")) },
  @{ Prefecture = "東京都"; Regions = @(@("44", "東京都")) },
  @{ Prefecture = "千葉県"; Regions = @(@("45", "千葉県")) },
  @{ Prefecture = "神奈川県"; Regions = @(@("46", "神奈川県")) },
  @{ Prefecture = "長野県"; Regions = @(@("48", "長野県")) },
  @{ Prefecture = "山梨県"; Regions = @(@("49", "山梨県")) },
  @{ Prefecture = "静岡県"; Regions = @(@("50", "静岡県")) },
  @{ Prefecture = "愛知県"; Regions = @(@("51", "愛知県")) },
  @{ Prefecture = "岐阜県"; Regions = @(@("52", "岐阜県")) },
  @{ Prefecture = "三重県"; Regions = @(@("53", "三重県")) },
  @{ Prefecture = "新潟県"; Regions = @(@("54", "新潟県")) },
  @{ Prefecture = "富山県"; Regions = @(@("55", "富山県")) },
  @{ Prefecture = "石川県"; Regions = @(@("56", "石川県")) },
  @{ Prefecture = "福井県"; Regions = @(@("57", "福井県")) },
  @{ Prefecture = "滋賀県"; Regions = @(@("60", "滋賀県")) },
  @{ Prefecture = "京都府"; Regions = @(@("61", "京都府")) },
  @{ Prefecture = "大阪府"; Regions = @(@("62", "大阪府")) },
  @{ Prefecture = "兵庫県"; Regions = @(@("63", "兵庫県")) },
  @{ Prefecture = "奈良県"; Regions = @(@("64", "奈良県")) },
  @{ Prefecture = "和歌山県"; Regions = @(@("65", "和歌山県")) },
  @{ Prefecture = "岡山県"; Regions = @(@("66", "岡山県")) },
  @{ Prefecture = "広島県"; Regions = @(@("67", "広島県")) },
  @{ Prefecture = "島根県"; Regions = @(@("68", "島根県")) },
  @{ Prefecture = "鳥取県"; Regions = @(@("69", "鳥取県")) },
  @{ Prefecture = "徳島県"; Regions = @(@("71", "徳島県")) },
  @{ Prefecture = "香川県"; Regions = @(@("72", "香川県")) },
  @{ Prefecture = "愛媛県"; Regions = @(@("73", "愛媛県")) },
  @{ Prefecture = "高知県"; Regions = @(@("74", "高知県")) },
  @{ Prefecture = "山口県"; Regions = @(@("81", "山口県")) },
  @{ Prefecture = "福岡県"; Regions = @(@("82", "福岡県")) },
  @{ Prefecture = "大分県"; Regions = @(@("83", "大分県")) },
  @{ Prefecture = "長崎県"; Regions = @(@("84", "長崎県")) },
  @{ Prefecture = "佐賀県"; Regions = @(@("85", "佐賀県")) },
  @{ Prefecture = "熊本県"; Regions = @(@("86", "熊本県")) },
  @{ Prefecture = "宮崎県"; Regions = @(@("87", "宮崎県")) },
  @{ Prefecture = "鹿児島県"; Regions = @(@("88", "鹿児島県")) },
  @{ Prefecture = "沖縄県"; Regions = @(@("91", "沖縄本島"), @("92", "大東島"), @("93", "宮古島"), @("94", "八重山")) }
)

$stations = [System.Collections.Generic.List[object]]::new()
$seen = @{}
foreach ($group in $groups) {
  $regionPairs = [System.Collections.Generic.List[object]]::new()
  if ($group.Regions[0] -is [array]) {
    foreach ($item in $group.Regions) { $regionPairs.Add($item) }
  } else {
    $regionPairs.Add(@($group.Regions))
  }
  foreach ($region in $regionPairs) {
    $prec = $region[0]
    $area = $region[1]
    $uri = "https://www.data.jma.go.jp/stats/etrn/select/prefecture.php?prec_no=$prec"
    $html = (Invoke-WebRequest -Uri $uri).Content
    $pattern = '<area[^>]+alt="([^"]+)"[^>]+href="\.\./index\.php\?prec_no=(\d+)(?:&|&amp;)block_no=([^&"]+)'
    foreach ($match in [regex]::Matches($html, $pattern)) {
      if ($match.Groups[3].Value -eq "00") { continue }
      $key = "$($group.Prefecture)|$($match.Groups[2].Value)|$($match.Groups[3].Value)"
      if ($seen.ContainsKey($key)) { continue }
      $seen[$key] = $true
      $stations.Add([ordered]@{
        prefecture = $group.Prefecture
        area = $area
        name = [System.Net.WebUtility]::HtmlDecode($match.Groups[1].Value)
        prec = $match.Groups[2].Value
        block = $match.Groups[3].Value
      })
    }
  }
}

$unique = $stations | Sort-Object prefecture, area, name, block
$json = $unique | ConvertTo-Json -Depth 3 -Compress
$destination = Join-Path $PSScriptRoot "..\data\stations.js"
New-Item -ItemType Directory -Force (Split-Path $destination) | Out-Null
"// Generated from the Japan Meteorological Agency station pages.`nconst STATIONS = Object.freeze($json);" |
  Set-Content -Path $destination -Encoding utf8
Write-Host "Generated $($unique.Count) stations at $destination"
