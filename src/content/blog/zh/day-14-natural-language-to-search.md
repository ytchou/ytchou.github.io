---
title: "從一句需求到搜尋請求：自然語言怎麼接進搜尋系統？"
description: "使用者輸入一句自然語言，搜尋系統怎麼同時保留語意並整理出結構化條件？從意圖解析與 embedding 並行，到手動篩選與系統推斷的合併。"
day: 14
chapter: 3
date: 2026-09-28
tags: [鐵人賽]
lang: zh
series: ironman
notion: https://app.notion.com/p/patrickytc/Day-14-3b10d2d793cf81fa9796ec33eea8700e
---

## 今天要聊什麼？

上一篇把前半段的資料流程走完：品牌與商品資料已經整理成可審核、可以被系統使用的形式。接下來換到另一端：**這些資料要怎麼真的被使用者找到？這也會是接下來幾篇的新主題：Search / Ranking。**

假設使用者想找這樣的商品：

> **想找一個適合露營用的隨行杯，最好是不鏽鋼、風格簡單，預算大概兩千元，而且不要玻璃。**

這句話很符合人的思考方式。我們會把用途、材質、風格、預算和排除條件自然地放在同一句話裡；搜尋系統要使用這段資訊時，則需要把同一份需求轉成不同形式的搜尋訊號。

這篇先從比較高層次的角度看這件事：**一段自然語言進入搜尋系統後，怎麼同時保留完整語意，又把其中足夠明確的資訊整理成可以直接使用的條件。**

---

## 搜尋可以分成兩個部分：先找相關商品，再用條件縮小範圍

![搜尋頁示意：自然語言查詢保留在上方，左側篩選條件用來進一步縮小結果。](/images/ironman/day-14-search-interface.png)

從使用者的角度來看，第一次搜尋其實很單純：先輸入一句話，讓系統找出一批看起來相關的商品。如果結果還太廣，再利用分類、材質等篩選條件繼續縮小範圍。

兩者處理的是不同問題，但會一起影響最後的搜尋結果：

> 自然語言主要用來判斷**哪些商品比較符合使用者描述的需求**；篩選條件則是在決定**哪些商品可以留在這次搜尋範圍裡**。

![使用者先用自然語言搜尋，看到結果後才用篩選條件進一步縮小範圍。](/images/ironman/day-14-search-to-filter-flow.png)

當使用者手動選擇「材質＝金屬」時，系統不是單純把金屬商品往前排，而是直接排除不符合材質條件的商品。因此，篩選條件的判斷必須比一般的相關性判斷更保守：**條件一旦設錯，真正合適的商品可能連後面的排序都沒有機會參與。**

## 自然語言進入搜尋後，兩條處理會同時開始

如果只看前面的產品流程，很容易把實作想成「先跑意圖解析器，把條件整理完，再開始搜尋」。目前的程式並不是這樣。

搜尋函式一開始就收到使用者的原始 query，以及當下已經存在的手動篩選條件。query 經過基本的 normalization 之後，在 intent parsing 啟用時，**意圖解析和 embedding 會並行執行**：

```typescript
const [intentOutcome, embedResult] = await Promise.all([
  intentParsePromise,
  doEmbed(),
]);
```

兩條路拿到的是同一段完整文字，沒有先把「不鏽鋼」或「隨行杯」從句子裡切掉。

其中一條交給意圖解析器，嘗試得到 category、subcategory、materials 這些結構化條件；另一條則把**完整句子**轉成 embedding。原始文字本身也會完整保留下來，之後以 `query_text` 交給文字檢索使用。

等意圖解析與 embedding 都準備好之後，系統才把這些資訊一起組成真正送進檢索層的參數：

```typescript
const rpcParams = {
  query_text: normalized,        // 完整原句
  query_embedding: embedding,    // 完整原句的向量表示
  filter_category: ...,
  filter_subcategories: ...,
  filter_materials: ...,
};
```

換句話說，這裡不是把自然語言「拆成兩段」，而是讓**同一句自然語言同時產生不同用途的搜尋訊號**。Embedding 和文字檢索會怎麼利用完整 query 找相關商品，會留到下一篇再展開。

## 意圖解析器：只負責補上可執行的篩選條件

意圖解析器（Intent Parser）只是前面其中一條處理路徑。它的工作不是啟動搜尋，也不是改寫使用者原本的句子，而是從完整 query 裡找出目前資料模型已經能夠明確表示的資訊。

例如本文的搜尋句子裡，「隨行杯」有機會對應到既有的 subcategory，「不鏽鋼」則有機會對應到 material = metal；「適合露營」、「風格簡單」這類比較偏情境與偏好的內容，則不需要硬塞進結構化欄位。

目前模型的輸出被限制在既有分類與材質清單裡，並由程式再做一次驗證：

```typescript
const intentParseShape = z.object({
  category: z.enum(L1_SLUGS).nullable(),
  // 只能從既有 L1 分類中選擇；不確定時留 null。

  subcategory: z.string().nullable(),
  // 模型回傳後再由程式檢查：
  // 1. slug 是否真的存在
  // 2. 是否屬於同一個 L1 category

  materials: z.array(z.enum(MATERIAL_SLUGS)),
  // 材質只能從平台既有清單中選擇。
});
```

一個**可能的示意結果**會是：

```typescript
{
  category: "home",
  subcategory: "tumblers-and-bottles",
  materials: ["metal"],
}
```

這裡有一個很關鍵的實作細節：解析器只回傳這些結構化值，**不會回傳它是從原句哪幾個字判斷出來的**。因此即使「不鏽鋼」被解析成 `metal`，它仍然完整保留在原始 query 裡，也會一起進 embedding 與後續的文字檢索。

如果解析器逾時、模型呼叫失敗或輸出驗證沒有通過，這條路可以直接回傳空結果；原始 query 與 embedding 路徑仍然可以繼續。這也符合這個模組的角色：它是在搜尋上補一層結構化資訊，而不是讓整個搜尋依賴模型解析成功。

![自然語言進入搜尋後，完整原句會同時走意圖解析與 embedding；兩條路最後一起提供檢索所需資訊。](/images/ironman/day-14-query-flow.png)

## 手動篩選與系統推斷，會在檢索前合併

如果使用者已經在結果頁手動選擇分類或材質，這些資訊會隨下一次搜尋一起進入同一個 `SearchInput`。等意圖解析與 embedding 都完成後，程式才決定最後要送進檢索層的 filters。

目前的原則很單純：使用者已經明確指定的值優先；沒有手動指定時，才採用意圖解析器推斷出的值。

```typescript
const category =
  input.category ?? parsedCategory ?? null;

const materials = input.materials?.length
  ? input.materials
  : parsed?.materials?.length
    ? parsed.materials
    : null;
```

這個合併發生在呼叫 `search_products_semantic` 之前，所以檢索層最後收到的是同一組資訊：完整的 `query_text`、完整句子的 embedding，以及最後確認要套用的 filters。

![重新搜尋時仍保留原始查詢文字；使用者手動設定的篩選條件會優先於系統推斷。](/images/ironman/day-14-search-request-flow.png)

目前還有一個尚未完全解決的介面問題：使用者把某個篩選條件清空，到底代表「恢復自動判斷」，還是「我明確不要這個條件」？現在的空陣列主要只能表示沒有手動指定，因此系統仍可能重新採用先前的推斷。這個狀態要怎麼在介面上表達，會留到後面談搜尋 UI 時再處理。

## 下一篇：只有自然語言時，怎麼找到相關商品？

這一篇先把 user intent 怎麼進入搜尋系統的高層流程整理清楚。下一篇會暫時把 filters 放到旁邊，只看一個更基本的問題：

> **如果手上只有一句自然語言，系統要怎麼判斷它和哪些商品有關？**

這就會進入 retrieval 本身：完整 query 怎麼做文字檢索、怎麼轉成 embedding 做向量檢索，以及兩條路找到的候選商品最後怎麼合併。
