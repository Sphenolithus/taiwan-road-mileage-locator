# 台灣主要道路里程定位

GitHub Pages 網址：

https://sphenolithus.github.io/taiwan-road-mileage-locator/

功能：

- 依高速公路、快速道路、平面道路分類。
- 可選道路、方向與輸入里程。
- 支援 `100K+400`、`100K400`、`100.4` 等里程格式。
- 用 OpenLayers 顯示定位結果。
- 無原始里程點時會內插估算，資料稀疏區間會顯示可信度警示，並優先嘗試 OpenStreetMap/OSRM 道路線形估算。
- 產生 Google Street View URL，不需要 Google Maps API key。

備註：

本網頁為練習應用 Codex 成果，原創者為楊宇恩博士。

正式資料已轉換為 `data/mileposts.geojson.gz.b64`，由前端解壓縮後載入。
