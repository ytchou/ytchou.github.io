---
title: "Tool Use：Agent 怎麼根據當下資訊決定下一步？"
description: "當任務可以定義清楚，但執行路徑必須隨著當下資訊改變時，Agent 靠什麼能力決定下一步？Tool Use 補上的就是從判斷到行動之間的那一段。"
day: 7
chapter: 2
date: 2026-09-21
tags: [鐵人賽]
lang: zh
series: ironman
notion: https://app.notion.com/p/patrickytc/Day-07-Tool-Use-Agent-3db0d2d793cf81fb9efad1cf6a21c606
---

## 今天要聊什麼？

上一篇先把模組之間的資料交接處理好：透過明確的欄位、型別與結構，讓上一個階段的輸出可以被下一個階段穩定讀取。有了這個基礎，這篇開始往 Agent 內部走，看看一個階段收到資料之後，究竟怎麼決定接下來要做哪些事。這邊我們先複習一下我們之前提到會把資料獲取的流程拆成六個步驟：

![六模組資料獲取流程](/images/ironman/day-05-data-acquisition-graph.png)

這邊我們會用 Acquire 這個步驟來當作為主要案例討論該怎麼執行：Acquire 從前一個階段拿到品牌資訊與一組可能的網站來源，但它還不知道真正值得讀的資料在哪裡，也不知道每個網站應該用什麼方式才能拿到有效內容。這篇要處理的核心問題因此是：**當任務本身可以定義清楚，但執行路徑必須隨著當下資訊改變時，Agent 到底靠什麼能力決定下一步？**

![Acquire 階段工作流程](/images/ironman/day-07-acquire-workflow-reminder.svg)

而讓模型能把這種判斷真正轉成行動的關鍵，就是接下來要談的 **Tool Use**。

---

## Tool Use：讓模型從判斷走到行動

當模型沒有任何「工具」或「能力」時，模型可以知道應該要去「商品分類頁」看看，但模型本身並不知道該怎麼實際完成這件事情。**Tool Use 補上的就是從判斷到行動之間的那一段**：模型提出要使用哪個工具與參數，外部系統執行後把結果送回模型，新的觀察結果再成為下一輪判斷的依據。

這裡想先稍微提一下各家 API 的命名不完全相同：

- [OpenAI 的 Function Calling 文件](https://developers.openai.com/api/docs/guides/function-calling)把 function calling 也稱為 tool calling；在 OpenAI 更大的 tools 概念裡，透過 JSON Schema 定義的 function 只是其中一種工具，另外還有 web search、MCP、code execution 等能力。
- [Anthropic](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview) 主要使用 **Tool Use** 這個名稱，並直接註明它也常被稱為 function calling；工具又可以依執行位置分成由應用程式執行的 client tools，以及由 Anthropic 執行的 server tools。

這裡我們關心的不是某一家 API 的 function schema 細節，因此後面統一使用 **Tool Use** 來稱呼我們這邊想解釋的觀念。

釐清這些名詞之後，接下來真正重要的是 Tool Use 如何改變模型的執行方式。先把它濃縮成一個最基本的互動迴圈：

![規則式流程 vs Agent 迴圈](/images/ironman/day-07-rules-vs-agent.svg)

有了這個迴圈，模型就能根據每次工具回傳的新資訊調整下一步，而不需要沿著開發者事先寫好的固定流程前進。

然而，這個動態決策的能力本身也是有成本，因此不是所有流程都需要做成 Agent。如果可能遇到的情況有限，而且規則可以合理窮舉，直接把判斷寫成 `if / else` 通常更便宜、更快，也更容易測試；例如某個平台只有固定 API 與固定分頁規則，就沒有必要讓模型每次重新決定下一步。

真正適合讓 Tool Use 發揮價值的，是**當狀況很難事先分類完整、不同觀察結果會改變後續路徑，而且我們無法合理列出所有分支時**。這份彈性的代價是更多模型呼叫、等待時間，以及選錯工具或多做一步所產生的成本，所以我要保留的是難以規則化的選擇，而不是把所有資料處理都改成 Agent。

---

## 以 Acquire 舉例 Tool Use 的概念

我們先稍微釐清一下 Acquire 這個階段的內容：

- **從前一步獲得的資訊**：品牌名稱，以及 Gather 已經整理出的官網、社群或其他網站。
- **任務**：根據後續需要的資訊，在有限的探索額度內判斷哪些來源值得繼續讀；過程中可以依新的觀察結果改變探索方向，目標不是逛完整個網站，而是針對性地找到需要的資料。
- **預期輸出**：一份可以交給後續程式執行的抓取計畫，列出要處理的來源、讀取方式與選擇原因。這一步完成的是「知道接下來去哪裡、怎麼拿」，還不是整理完成的品牌或商品資料。

![Acquire 階段的邊界定義](/images/ironman/day-07-acquire-boundary.svg)

這裡會一個疑問：**既然 Agent 已經知道該怎麼抓取資訊，為什麼不讓它在探索階段直接抓取資料？**

> 原因不是 Agent 做不到，而是**當「去哪裡抓、該怎麼抓」已經決定之後，後面的工作就逐漸變成機械性的執行問題**。

當模型在探索時，模型需要針對現有的線索來做判斷，例如首頁值不值得繼續讀、是否需要瀏覽器渲染、哪個連結比較像商品入口等，這些資訊是我們沒辦法事先了解的內容，且也難以窮舉窮盡，但當抓取計畫已經確定並使用 Structured Outputs 整理成固定形式之後，按照指定 URL 取得內容、處理逾時、重試與錯誤記錄等反而更適合交給 deterministic code 進行可控且高效率的資料處理，而這樣可以把 LLM 的資源運用集中在真正需要語意與動態決策的地方，也讓正式抓取的成本與失敗行為比較容易控制。

---

## 從任務反推：Acquire 需要哪些工具？

從執行位置來看，Tool Use 大致可以分成兩類，差異在於「真正執行程式碼的是誰」：

- **CLI 內建工具**：像 web search、web fetch、code execution 這類內建工具，由模型供應商的伺服器端執行。
- **開發者自訂工具**：開發者定義工具名稱、用途與參數 schema，模型提出結構化的工具呼叫，自己的程式驗證參數、執行操作，再把結果回傳給模型。

這裡我們根據 Acquire 所需要執行的任務建立了許多不同的自訂工具，讓模型能自行決定「下一步想要做什麼」，以下四個為簡單範例：

```typescript
// 簡化示意，不是完整 production code
probe_static({ url })    -> ProbeSummary
probe_rendered({ url })  -> ProbeSummary
extract_links({ url })   -> { links: string[] }
submit_plan(plan)        -> { accepted: boolean }
```

如果按照它們在任務裡扮演的角色來看，可以分成兩組：

- **取得新的觀察結果**：`probe_static` 先用較便宜的靜態方式探查頁面；`probe_rendered` 在需要 JavaScript 時取得渲染後的結果；`extract_links` 則從實際頁面找出可以繼續探索的連結。
- **交付決策**：`submit_plan` 接收符合 [AcquisitionPlan](https://github.com/ytchou/Formoria/blob/main/src/lib/services/enrich-phases/acquisition/plan.ts) 的抓取計畫；驗證通過後，規劃階段就可以結束。

假設現在要替一個戶外用品品牌找出可讀的商品來源，一條可能的探索路徑會像這樣：

> `probe_static(首頁)` → `extract_links(首頁)` → `probe_static(商店頁)` → `probe_rendered(商店頁)` → `submit_plan(...)`

這只是一條可能的路徑，不是固定流程。首頁的靜態內容如果已經足夠，Agent 可以直接提交計畫；商店頁如果不需要 JavaScript，也不必多做 rendering。**Tool Use 真正帶來的彈性，就在於每次工具回傳結果後，模型都可以重新判斷「現在還缺什麼資訊」，而不是事先把所有網站都塞進同一條流程。**

![Acquire 工具使用與控制邊界](/images/ironman/day-07-acquire-tool-use-boundary.png)

這張圖也把控制權的分工畫得比較完整：**模型負責選動作，程式負責決定這個動作能不能執行。** 在這個流程中我們也需要注意 Structured Outputs 的概念，工具參數與最後提交的抓取計畫都必須先通過 schema validation，才能確保後續的內容程式能夠正確的執行。

最後想要提到的一點：**Tool 不是越多越好**。每多一個工具，模型就多一個需要判斷的選項；試想當你十萬火急的時候打開了一個巨大的工具箱，裡面有各種可能可以解決這個問題的工具，這時候你要選擇一個好的工具反而會耗費非常多的氣力。**真正重要的是把每個工具的責任定義清楚，讓模型能根據當下資訊選到正確的工具，而不是把所有可能的能力都塞進工具箱**。

---

## 下一個問題：找到資料，不代表可以直接使用

回到最初的問題，Acquire 之所以需要 Agent，不是因為它會呼叫 API，而是它必須在每次取得新資訊後重新判斷下一步。Tool Use 提供了這個「觀察 → 行動 → 再判斷」的迴圈；程式則定義哪些工具能用、哪些請求能執行，以及什麼時候必須停下來。

下一個問題則出現在資料真的抓回來之後，我們要怎麼有效率的清理資料並得到我們需要的內容呢？以照片為例，網站上的圖片可能是商品照、Logo、促銷橫幅，也可能只是無關的裝飾照片；能下載、畫質清楚的照片也並不代表適合放進品牌或商品資料。我們要怎麼使用 LLM 來高效率幫助我們解決這個問題呢？
