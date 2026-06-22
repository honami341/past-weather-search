# 今日、暑かった？

都道府県と観測地点を選び、気象庁AMeDASの直近観測や「過去の気象データ検索」へ移動する静的Webアプリです。

## ローカルで確認

静的ファイルを配信できる任意のHTTPサーバーを使います。

```powershell
python -m http.server 8000
```

ブラウザで `http://localhost:8000` を開いてください。

## 観測地点を更新

地点一覧は気象庁の都府県・地方別ページから生成しています。

```powershell
pwsh -File .\scripts\update-stations.ps1
pwsh -File .\scripts\update-current-stations.ps1
```

## Vercelへ公開

このリポジトリをVercelへImportします。Framework Presetは `Other`、Build CommandとOutput Directoryは空欄のままで公開できます。

## データについて

観測データは本サイトに転載せず、気象庁の公式ページを新しいタブで開きます。地点構成やリンク仕様は気象庁側の更新により変わる場合があります。
