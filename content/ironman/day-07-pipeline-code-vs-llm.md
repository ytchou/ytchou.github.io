---
title: "一個網址進去，一份品牌檔案出來：哪些步驟是 code，哪些交給 LLM"
day: 7
chapter: 3
publish: 2026-09-21
platform: ithome
status: skeleton
notion: https://app.notion.com/p/patrickytc/Day-07-pipeline-code-vs-llm-3b10d2d793cf816eb130eda8e9834f6b
---

<!-- Notion 簡報（v5.4，2026-09-14）：
  - 合併篇（原 07 code vs LLM + 原 08 pipeline walkthrough）
  - 走一遍流水線：偵測 → 取得 → 抽取 → 命名 → 商品 → 圖片 → 文案 → 落地；每一站標明 code 還是 LLM，以及為什麼
  - 分工原則：deterministic → code、semantic → LLM；兩邊各自的失效工具箱（tests / grounding / provenance）
  - batching economics、fork-join；retry / idempotency 為配角
  Notion 較新時以 Notion 為準。 -->
