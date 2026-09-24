#!/usr/bin/env bash
# 国土数値情報 行政区域（N03, 2025-01-01 版, 茨城県）から県北6市町の境界を作り、
# src/data/boundaries.json に書き出す。通常は同梱済みのファイルを使うので実行不要。
set -euo pipefail
cd "$(dirname "$0")/.."
WORK="${TMPDIR:-/tmp}/anaba-n03"
mkdir -p "$WORK"
curl -fsSL -o "$WORK/n03.zip" https://nlftp.mlit.go.jp/ksj/gml/data/N03/N03-2025/N03-20250101_08_GML.zip
unzip -oq "$WORK/n03.zip" -d "$WORK"
npx -y mapshaper@0.6 "$WORK/N03-20250101_08.geojson" \
  -filter '["08202","08212","08214","08215","08225","08364"].indexOf(N03_007) > -1' \
  -dissolve N03_007 copy-fields=N03_004 \
  -rename-fields code=N03_007,name=N03_004 \
  -simplify 10% keep-shapes \
  -o precision=0.0001 format=geojson src/data/boundaries.json
ls -l src/data/boundaries.json
