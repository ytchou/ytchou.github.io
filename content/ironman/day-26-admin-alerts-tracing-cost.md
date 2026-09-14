---
title: "後台、告警、trace 與帳單：看見系統在做什麼"
day: 26
chapter: 7
publish: 2026-10-10
platform: ithome
status: skeleton
notion: https://app.notion.com/p/patrickytc/Day-26-admin-alerts-tracing-cost-3b10d2d793cf81869026d34520da1bc5
---

<!-- Notion 簡報（v5.4，2026-09-14）：
  - 合併篇（原 26 admin + alerts、原 16 tracing incident、原 17 LLM cost bill）：一人專案要怎麼「看見」自己的系統
  - 輕量 admin dashboard（範圍、權限、稽核）+ Slack 告警（e2e、health check、雜訊控制）
  - Traces + audit trail + correlation IDs，一次真實 incident debug：半夜壞了是哪個 prompt 的錯
  - 成本追蹤、spend reports、budgets、被成本改變的決策；真實帳單是賣點
  - 全部都是「建最小的，讓它自己看著自己」
  Notion 較新時以 Notion 為準。 -->
