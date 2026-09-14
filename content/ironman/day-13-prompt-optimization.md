---
title: "不是 fine-tune 模型，是調 prompt：用 golden set 跟盲測投票改分類與文案"
day: 13
chapter: 3
publish: 2026-09-27
platform: ithome
status: skeleton
notion: https://app.notion.com/p/patrickytc/Day-13-prompt-optimization-3b10d2d793cf81d29cb3fbd01a396eba
---

<!-- Notion 簡報（v5.4，2026-09-14）：
  - 三顆旋鈕的第一顆：模型固定、改 prompt。Langfuse 管 prompt 版本、golden set、annotation queue、分數
  - Worked examples：taxonomy 分類、商品描述、品牌描述的 prompt 迭代；哪一種靠 scorer、哪一種只能靠盲測投票
  - 術語澄清：這不是 fine-tuning（權重沒動），是 eval 驅動的 prompt optimization；prompt → 加 context/examples → 才考慮 FT 的階梯
  - 為什麼放在資料支柱：分類跟文案的品質是搜尋與探索的地基
  Notion 較新時以 Notion 為準。 -->
