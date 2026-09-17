---
title: "Discovery 的地基是分類：Taxonomy 怎麼決定東西找不找得到"
day: 3
chapter: 2
date: 2026-09-17
tags: [鐵人賽]
lang: zh
series: ironman
notion: https://app.notion.com/p/patrickytc/Day-03-taxonomy-3b10d2d793cf81fcb4a9cf9f9880e6a7
---

## 今天要聊什麼？

昨天把商業問題拆成資料、搜尋與探索三塊，而三件事最後都指向同一個前提：機器要能理解一個產品是什麼。今天從最底層的那一塊開始：分類。昨天那句「送給喜歡露營、偏好低彩度風格的朋友」是一句人話，但資料庫存的是欄位；這中間的落差要怎麼處理，就是今天想回答的問題。

---

## 一句話裡藏了三種不同性質的資訊

回到昨天那個例子：

> 送給剛滿三十歲、喜歡露營、偏好低彩度風格的朋友，預算大概 NT$2,000。

這句話聽起來是一個需求，但拆開來看，裡面至少有三種性質完全不同的資訊。「露營」可以對應到一個產品分類（戶外用品），「預算 NT$2,000」是一個可以精準篩選的數值條件，而「低彩度風格」則是一種主觀感受，沒有任何一個欄位能直接接住它。

如果把這些東西全部塞進同一個 category 欄位，篩選會壞掉：你沒辦法用一個欄位同時回答「這是什麼東西」「多少錢」和「感覺起來如何」。所以在設計資料結構時，我把這些維度分成三個層次來處理：

- **Taxonomy** 處理「它是什麼」：用途分類（家居、戶外、美妝）、子分類（後背包、桌燈、手工皂）。這些維度相對穩定、有明確的上下層關係，是篩選和導航的骨架。
- **Facets / Filters** 處理「它有什麼屬性」：材質（陶瓷、木、織品）、價格帶、產地。這些屬性可以跨分類組合，值也可能隨時變動，適合當成動態篩選條件。
- **Semantic Representation** 處理「它感覺起來如何」：「低彩度」「適合露營」「送禮感」這類主觀、情境性的描述，沒辦法用固定欄位表達，需要後面搜尋章節用 embeddings 來處理。

![Taxonomy / Facets / Semantic 三層](/images/ironman/day-03-taxonomy-facets-semantic.png)

Taxonomy 是許多電商平台會使用的產品分類方式，將眾多雜亂的產品資訊用有架構的方式進行分類，在有些情境下又被稱作 Category Tree 或 Product Hierarchy 。只要一個系統裡有大量物件，而且不同角色必須對「這個東西是什麼」有一致理解，就會碰到 taxonomy 的問題。

Taxonomy 在這個專案裡的定位是地板：它提供結構化的篩選骨架，讓使用者能夠有系統性地找到想要找到的內容。但使用者真正在意的組合永遠比欄位多。語意層的問題，我們會留到搜尋和探索的章節再處理。

誰來標這些欄位、標得準不準，是另一個問題，後面討論 eval 的幾天會再回來處理。但在那之前，先要決定的是：分類樹本身應該怎麼設計？

---

## 分類樹該怎麼樣設計？

舉例來說，我們可以將各種不同的燈具做以下的分類：

```text
產品
└── 家居 Home (Level 1 Category / L1)
    └── 燈具 Lighting (Level 2 Category / L2)
        ├── 桌燈 Desk Lamp (Level 3 Category / L3)
        ├── 落地燈 Floor Lamp
        └── 吊燈 Pendant Lamp
```

從這個例子我們可以看到，「家居 → 燈具 → 桌燈」有明確的上下層關係，所有「桌燈」都屬於「燈具」，所有的「燈具」也都屬於「家居」這個類別。

剛才我們有提到幾個其他的維度特徵，這些並不適用於這樣的資料整理方式：

- **材質（例如陶瓷、木、織品）**：這類特徵並沒有上下層關係，一個產品有可能同時有多個 Material 的類別，詞彙之間沒有階層。這類的特徵更適合當成 "facets" 來判斷，比較適合當成一個 filter 而不是用 taxonomy 形式去呈現。
- **價格帶**：這類特徵是 dynamic attribute，其數值會隨品牌調整而變，且也沒有明確的上下層關係。這類的特徵也更適合當成 filter，而不是放在 taxonomy 裡。
- **主觀特徵**：「不刺眼」「低彩度」等這類主觀感受則屬於 semantic representation，彼此之間並不互相隸屬也沒有上下層關係，並不屬於 taxonomy 的範疇。

大方向來說可以這樣理解：

> **taxonomy 解決「它是什麼」，facets 解決「它有什麼屬性」，semantic representation 解決「它感覺起來如何」。**

[Baymard Institute 的研究指出](https://baymard.com/blog/ecommerce-over-categorization)：75% 的電商網站犯了 overcategorization 的錯，把商品的「屬性」當成「分類」來建。他們發現過度使用「分類」會導致使用者難以找到合適的產品，而利用 filter 來篩選「屬性」才能有效去做篩選。

分類樹的深度和廣度沒有通則，我們可以發現幾個定位相近的平台都用了不太一樣的分類方式：Pinkoi 有 17 個 Level 1 Category，Faire 用 13 個 L1，Ankorstore 用 7 個，Etsy 則有超過 6,000 種分類。以目前的架構而言，我們目前定義了以下的 Category Tree Structure:

```text
6 個 L1 Categories｜104 個 L2 Subcategories

├── 服飾鞋履 Fashion & Apparel (16 L2)
│   ├── 上衣・T恤、洋裝、裙裝、褲裝、外套 ...
├── 包袋配件 Bags & Accessories (27 L2)
│   ├── 後背包、托特包、斜背包、手提包、皮夾 ...
├── 飾品珠寶 Jewelry (8 L2)
│   ├── 耳環、項鍊、戒指、手鍊・手環 ...
├── 美妝保養 Beauty & Personal Care (14 L2)
│   ├── 手工皂、臉部保養、身體保養、香水香氛 ...
├── 居家生活 Home & Living (27 L2)
│   ├── 寢具、家具、燈飾、餐具、花器 ...
└── 文具設計 Stationery & Design (12 L2)
    ├── 手帳・筆記本、紙膠帶、貼紙、印章 ...
```

---

## 當 Taxonomy 變成共通語言

分類樹設計好之後，很容易把它想成網站左邊的一組選單。但一旦真的開始做系統，我才發現 taxonomy 的影響範圍遠比 UI 大。

假設原本有一個分類叫 `camping`，某天我覺得它太模糊決定改成 `camping-gear`。

看起來只是重新命名一個 category，但這個值可能已經同時出現在好幾個地方：UI Filter 用它決定要查哪些資料，SEO 用它產生穩定的 category URL，而 AI Enrichment 則把它當成允許輸出的 vocabulary。

![Taxonomy as shared contract](/images/ironman/day-03-taxonomy-shared-contract.png)

如果三個地方各自維護一份分類定義，只改其中一個，系統很快就會開始 drift：UI 找不到新的分類、舊 URL 失效，甚至 AI 還會繼續產生已經不存在的值。所以 taxonomy 到這一步已經不只是「有哪些分類」，而比較像一份不同系統之間的 **shared contract**。大家不一定用 taxonomy 做同一件事，但必須對同一個 identifier、上下層關係和名稱有一致理解。

這也是為什麼我的做法是讓 taxonomy 有一份 canonical definition，其他 consumer 都從這裡取得資訊，而不是各自複製一份 category list。

**換個角度來看，修改 taxonomy 其實很接近修改 schema**：新增一個分類很容易，但 rename、merge 或 split 一個已經有人依賴的分類，就可能需要一起處理既有資料、URL 和 downstream consumer。

---

## 明天要聊什麼？

今天是從資料這一側往上看：一個產品要怎麼被分類、哪些東西適合變成結構化欄位，以及這套定義最後會被哪些系統使用。

Taxonomy 告訴我們有哪些分類，但一個品牌、一筆產品實際上需要哪些欄位，欄位之間怎麼關聯，以及每一筆資料從哪裡來、能不能被信任，這些問題 taxonomy 本身回答不了。

明天從資料模型開始：品牌、產品、taxonomy 之間的 schema 怎麼設計，以及當大部分資料預期由 AI pipeline 產生時，**provenance 為什麼是第一天就該考慮的事。**

我們明天見！
