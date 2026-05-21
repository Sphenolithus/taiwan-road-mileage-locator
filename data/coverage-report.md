# 道路里程資料覆蓋檢核

檢核日期：2026-05-21

本檢核以 `mileposts.geojson.gz.b64` 重新解壓後統計。資料已將 `順向`、`逆向`、`雙向` 展開為可查詢的標準方向，因此前端不再因方向欄位混用而漏查。

## 摘要

- 總筆數：79,512
- 高速公路：20,070
- 快速道路：26,024
- 平面道路：33,418
- 平面道路路線數：81
- 標準方向：`north`、`south`、`east`、`west`
- 非標準方向：0

## 仍需注意的里程缺口

以下為同一路線相鄰里程點距離大於 5K 的區間，查詢時會以低信心插值或最近點提示處理：

| 路線 | 缺口 |
| --- | --- |
| 台61線 | 65.3K - 76.2K |
| 台8線 | 37.0K - 61.0K |
| 台9乙線 | 2.0K - 352.0K |
| 台9線 | 354.5K - 364.5K |
| 台15線 | 26.0K - 32.5K |
| 台20線 | 93.5K - 99.5K；105.1K - 149.5K |
| 台20臨105 | 43.9K - 130.4K |
| 台26線 | 54.0K - 71.0K；79.5K - 89.0K |
| 台29線 | 11.0K - 23.0K |

## 路線覆蓋表

| 類別 | 路線 | 筆數 | 里程範圍 | 方向 |
| --- | --- | ---: | --- | --- |
| 高速公路 | 國道1號 | 7,490 | 0K - 374.4K | north/south |
| 高速公路 | 國道2甲號 | 48 | 0K - 2.274K | north/south |
| 高速公路 | 國道2號 | 410 | 0K - 20.347K | north/south |
| 高速公路 | 國道3甲號 | 112 | 0K - 5.447K | north/south |
| 高速公路 | 國道3號 | 8,634 | 0K - 431.512K | north/south |
| 高速公路 | 國道4號 | 554 | 0K - 26.839K | north/south |
| 高速公路 | 國道5號 | 1,078 | 0K - 53.729K | north/south |
| 高速公路 | 國道6號 | 754 | 0K - 37.558K | north/south |
| 高速公路 | 國道8號 | 312 | 0K - 15.496K | north/south |
| 高速公路 | 國道10號 | 678 | 0K - 33.764K | north/south |
| 快速道路 | 台61乙線 | 50 | 0K - 6K | north/south |
| 快速道路 | 台61線 | 10,338 | 2.5K - 305.2K | north/south |
| 快速道路 | 台62甲線 | 210 | 0K - 5.4K | east/west |
| 快速道路 | 台62線 | 474 | 0K - 18.6K | east/west |
| 快速道路 | 台63甲線 | 10 | 0K - 2K | east/west |
| 快速道路 | 台63線 | 656 | 0K - 19K | north/south |
| 快速道路 | 台64線 | 1,810 | 0K - 28.4K | east/west |
| 快速道路 | 台65線 | 930 | 0K - 12.3K | north/south |
| 快速道路 | 台66線 | 828 | 0K - 27.1K | east/west |
| 快速道路 | 台68甲線 | 40 | 0K - 0.9K | east/west |
| 快速道路 | 台68線 | 900 | 0K - 22.9K | east/west |
| 快速道路 | 台72線 | 1,102 | 2.4K - 30.8K | east/west |
| 快速道路 | 台74甲線 | 52 | 0K - 10.5K | north/south |
| 快速道路 | 台74線 | 1,448 | 0K - 37.2K | north/south |
| 快速道路 | 台76線 | 962 | 0K - 32.6K | north/south |
| 快速道路 | 台78線 | 1,696 | 0K - 42.8K | east/west |
| 快速道路 | 台82線 | 1,208 | 0.5K - 33.9K | east/west |
| 快速道路 | 台84線 | 1,658 | 0K - 41.3K | east/west |
| 快速道路 | 台86線 | 758 | 0K - 18.5K | east/west |
| 快速道路 | 台88線 | 894 | 0K - 22.4K | east/west |
| 平面道路 | 台1乙線 | 88 | 0K - 21.5K | north/south |
| 平面道路 | 台1丁線 | 62 | 0K - 14K | north/south |
| 平面道路 | 台1己線 | 20 | 0K - 4.1K | north/south |
| 平面道路 | 台1丙線 | 34 | 0K - 8K | north/south |
| 平面道路 | 台1戊線 | 62 | 0K - 8.5K | north/south |
| 平面道路 | 台1甲線 | 148 | 0K - 27K | north/south |
| 平面道路 | 台1線 | 2,024 | 0K - 461.1K | north/south |
| 平面道路 | 台2乙線 | 88 | 0K - 25K | north/south |
| 平面道路 | 台2丁線 | 60 | 0K - 13.3K | north/south |
| 平面道路 | 台2己線 | 140 | 0K - 3.5K | north/south |
| 平面道路 | 台2丙線 | 136 | 0K - 29.5K | north/south |
| 平面道路 | 台2戊線 | 60 | 0K - 13.8K | north/south |
| 平面道路 | 台2甲線 | 206 | 0K - 36.5K | north/south |
| 平面道路 | 台2庚 | 18 | 0K - 3.736K | north/south |
| 平面道路 | 台2線 | 1,062 | 0K - 167.5K | north/south |
| 平面道路 | 台3乙線 | 78 | 0K - 12K | north/south |
| 平面道路 | 台3丙線 | 32 | 0K - 7K | north/south |
| 平面道路 | 台3甲線 | 46 | 0K - 11.5K | north/south |
| 平面道路 | 台3線 | 2,436 | 0K - 436K | north/south |
| 平面道路 | 台4線 | 220 | 0K - 39K | north/south |
| 平面道路 | 台5甲線 | 32 | 0K - 8.5K | north/south |
| 平面道路 | 台5線 | 114 | 0K - 27.5K | north/south |
| 平面道路 | 台6線 | 128 | 0K - 31K | north/south |
| 平面道路 | 台7乙線 | 264 | 0K - 14.1K | north/south |
| 平面道路 | 台7丁線 | 72 | 0K - 16K | north/south |
| 平面道路 | 台7丙線 | 136 | 0K - 31.5K | north/south |
| 平面道路 | 台7甲線 | 1,022 | 0.1K - 74K | north/south |
| 平面道路 | 台7線 | 1,880 | 0K - 128.5K | north/south |
| 平面道路 | 台8線 | 2,310 | 0K - 187.5K | north/south |
| 平面道路 | 台8臨37 | 454 | 0K - 24.5K | north/south |
| 平面道路 | 台9乙線 | 102 | 2K - 364K | north/south |
| 平面道路 | 台9丁線 | 988 | 0K - 64K | north/south |
| 平面道路 | 台9丙線 | 92 | 0K - 22.5K | north/south |
| 平面道路 | 台9戊線 | 122 | 0.5K - 16K | north/south |
| 平面道路 | 台9甲線 | 230 | 0K - 19.8K | north/south |
| 平面道路 | 台9線 | 5,074 | 0K - 453.5K | north/south |
| 平面道路 | 台10乙線 | 34 | 0K - 5K | north/south |
| 平面道路 | 台10線 | 82 | 0K - 21K | north/south |
| 平面道路 | 台11乙線 | 34 | 0K - 7K | north/south |
| 平面道路 | 台11丙線 | 76 | 0K - 18K | north/south |
| 平面道路 | 台11甲線 | 80 | 0K - 19K | north/south |
| 平面道路 | 台11線 | 1,076 | 0K - 177K | north/south |
| 平面道路 | 台12線 | 98 | 0K - 23K | north/south |
| 平面道路 | 台13甲線 | 84 | 0K - 14K | north/south |
| 平面道路 | 台13線 | 294 | 0K - 69K | north/south |
| 平面道路 | 台14乙線 | 80 | 0K - 18K | north/south |
| 平面道路 | 台14丁線 | 50 | 0K - 10K | north/south |
| 平面道路 | 台14丙線 | 12 | 0K - 2.5K | north/south |
| 平面道路 | 台14甲線 | 312 | 0K - 41.5K | north/south |
| 平面道路 | 台14線 | 532 | 0K - 98.5K | north/south |
| 平面道路 | 台15線 | 356 | 0K - 78.5K | north/south |
| 平面道路 | 台16線 | 140 | 0K - 29.5K | north/south |
| 平面道路 | 台16臨29 | 46 | 0K - 11.5K | north/south |
| 平面道路 | 台17乙線 | 24 | 0K - 5.5K | north/south |
| 平面道路 | 台17甲線 | 152 | 0K - 26K | north/south |
| 平面道路 | 台17線 | 1,454 | 0K - 273.4K | north/south |
| 平面道路 | 台18線 | 1,496 | 0K - 108.5K | north/south |
| 平面道路 | 台19甲線 | 464 | 0K - 78.5K | north/south |
| 平面道路 | 台19線 | 754 | 0K - 140K | north/south |
| 平面道路 | 台20乙線 | 54 | 0K - 7.5K | north/south |
| 平面道路 | 台20甲線 | 24 | 0K - 5.5K | north/south |
| 平面道路 | 台20線 | 834 | 0K - 203.5K | east/west |
| 平面道路 | 台20臨93 | 86 | 94.5K - 98.5K | north/south |
| 平面道路 | 台20臨105 | 644 | 0K - 141.4K | north/south |
| 平面道路 | 台21甲線 | 84 | 0K - 20.5K | north/south |
| 平面道路 | 台21線 | 656 | 0K - 144K | north/south |
| 平面道路 | 台22線 | 182 | 0K - 34.3K | north/south |
| 平面道路 | 台23線 | 180 | 0.5K - 45K | north/south |
| 平面道路 | 台24線 | 258 | 0K - 44.5K | north/south |
| 平面道路 | 台24臨45 | 10 | 0K - 2K | north/south |
| 平面道路 | 台25線 | 106 | 0K - 18K | north/south |
| 平面道路 | 台26線 | 350 | 0K - 93.5K | north/south |
| 平面道路 | 台27甲線 | 110 | 0K - 14K | north/south |
| 平面道路 | 台27線 | 408 | 0K - 79K | north/south |
| 平面道路 | 台28線 | 354 | 0.5K - 49.5K | north/south |
| 平面道路 | 台29線 | 548 | 0K - 112K | north/south |
| 平面道路 | 台29臨11 | 54 | 0K - 12K | north/south |
| 平面道路 | 台30線 | 138 | 0K - 35K | north/south |
| 平面道路 | 台31線 | 176 | 0K - 30K | north/south |
| 平面道路 | 台37線 | 110 | 0K - 14K | north/south |
| 平面道路 | 台39線 | 282 | 0K - 18.5K | north/south |
