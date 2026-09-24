#!/usr/bin/env bash
# 国土数値情報 行政区域（N03, 2025-01-01 版, 全国）の都道府県単位のファイルから、日本全体の都道府県境界を作り、
# src/data/prefectures.json に書き出す（N1: 日本全体の地図）。通常は同梱済みのファイルを使うので実行不要。
# 出典: 「国土数値情報（行政区域データ）」（国土交通省）https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2025.html
# 使用許諾条件: オープンデータ（CC BY 4.0）。出典を表示すれば加工・再配布できる（文言は src/data/attributions.ts）
#
# - 全国版の zip は約 630MB。都道府県単位のファイルだけを取り出す
# - 日本全体の縮尺でしか使わない（県北の表示中は都道府県レイヤーを消す）ので強く簡略化する。目標は 200KB 以下（japan.test.ts で確認）
# - properties は code（都道府県コード2桁 '01'〜'47'）と name（'茨城県'）
set -euo pipefail
cd "$(dirname "$0")/.."
WORK="${TMPDIR:-/tmp}/anaba-n03-all"
mkdir -p "$WORK"
curl -fsSL -o "$WORK/all.zip" https://nlftp.mlit.go.jp/ksj/gml/data/N03/N03-2025/N03-20250101_GML.zip
unzip -oq "$WORK/all.zip" 'N03-20250101_prefecture.*' -d "$WORK"
npx -y mapshaper@0.6 -i "$WORK/N03-20250101_prefecture.shp" encoding=utf8 \
  -each 'code=N03_007.slice(0,2)' -dissolve code copy-fields=N03_001 -rename-fields name=N03_001 \
  -filter-islands min-area=15km2 \
  -simplify 0.08% keep-shapes -filter-islands min-vertices=4 \
  -o precision=0.001 format=geojson src/data/prefectures.json
ls -l src/data/prefectures.json
