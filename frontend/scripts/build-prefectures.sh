#!/usr/bin/env bash
# 国土数値情報 行政区域（N03, 2025-01-01 版, 全国）の都道府県版から日本全体の都道府県境界を作り、
# src/data/prefectures.json に書き出す（N1: 日本全体の地図）。通常は同梱済みのファイルを使うので実行不要。
# 出典: 「国土数値情報（行政区域データ）」（国土交通省）https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2025.html
# ライセンス: CC BY 4.0（出典の表示が必要）
#
# - 全国版の zip は約 630MB ある
# - 県北6市町（boundaries.json）と重ねてずれないよう、茨城県だけ 1.5%、ほかは 0.08% に簡略化する
#   （茨城と接する福島・栃木との県境も茨城側の細かさで残る）
# - 3km² 未満の島は省く。properties は code（都道府県コード2桁）と name
set -euo pipefail
cd "$(dirname "$0")/.."
WORK="${TMPDIR:-/tmp}/anaba-n03-all"
mkdir -p "$WORK"
curl -fsSL -o "$WORK/n03.zip" https://nlftp.mlit.go.jp/ksj/gml/data/N03/N03-2025/N03-20250101_GML.zip
unzip -oq "$WORK/n03.zip" 'N03-20250101_prefecture.*' -d "$WORK"
npx -y mapshaper@0.6 "$WORK/N03-20250101_prefecture.shp" \
  -dissolve N03_007 copy-fields=N03_001 \
  -rename-fields code=N03_007,name=N03_001 \
  -simplify variable percentage="code == '08000' ? '1.5%' : '0.08%'" keep-shapes \
  -filter-islands min-area=3km2 remove-empty \
  -each 'code = code.slice(0, 2)' \
  -o precision=0.0001 format=geojson src/data/prefectures.json
ls -l src/data/prefectures.json
