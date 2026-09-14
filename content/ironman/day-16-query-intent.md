---
title: "一句「露營要帶的杯子」怎麼變成查詢：意圖、篩選、向量與重排"
day: 16
chapter: 4
publish: 2026-09-30
platform: ithome
status: skeleton
notion: https://app.notion.com/p/patrickytc/Day-16-query-intent-3b10d2d793cf81fa9796ec33eea8700e
---

<!-- Notion 簡報（v5.4，2026-09-14）：
  - 支柱二開場：搜尋要對上的是情境。承 Day 02 的 query 端：一句情境句 → 讀出場合、對象、限制 → 變成分類篩選 + 向量查詢 + rerank
  - 最簡單的做法先走一遍：名稱比對 → 全文比對 → 分類篩選，各斷在哪（ilike → pg_trgm → FTS → CJK bigram 的路）
  - LLM 在 query 端做的事，以及不該做的事
  Notion 較新時以 Notion 為準。 -->
