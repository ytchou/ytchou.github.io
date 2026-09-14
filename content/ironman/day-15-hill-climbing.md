---
title: "跑十個品牌、壞六個：eval 驅動的 hill climbing，第一個假設是換一顆便宜的模型"
day: 15
chapter: 3
publish: 2026-09-29
platform: ithome
status: skeleton
notion: https://app.notion.com/p/patrickytc/Day-15-hill-climbing-3b10d2d793cf8181a524c68c32b96b98
---

<!-- Notion 簡報（v5.4，2026-09-14）：
  - 三顆旋鈕的第三顆：改 harness。Hill climbing = run → eval → inspect traces → propose change → validate → ship/revert
  - 第一個假設就是換一顆便宜一半的模型（原 Day 14 cross-model eval 併入）：品質·成本·延遲用數據決定
  - 三個模型角色：optimizer / worker / judge；stage-level checkpoint + replay 讓 iteration 便宜
  - Optimization vs holdout split，連回 Day 12
  Notion 較新時以 Notion 為準。 -->
