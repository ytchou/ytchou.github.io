---
title: "搜尋結果怎麼排得更好？從 Reranking 到 Learning to Rank"
description: "Retrieval 找回候選之後，怎麼讓更符合需求的商品排到前面？從手寫加權公式、Reranking 的定位，到用 LightGBM 做 Learning to Rank，再看部署模型時的特徵一致性、推論驗證與上線策略。"
day: 16
chapter: 3
date: 2026-09-30
tags: [鐵人賽]
lang: zh
series: ironman
notion: https://app.notion.com/p/patrickytc/Day-16-Reranking-Learning-to-Rank-3b10d2d793cf816a8226d8e2247aa476
---

## 今天要聊什麼？

**上一篇我們聊了 Retrieval（檢索）的細節，討論了 lexical retrieval（詞彙檢索）、vector retrieval（向量檢索）與 hybrid retrieval（混合檢索）等方式，目標是先把真正相關的商品盡量找回來**。這些 retrieval 方法在找回候選的同時，其實也會產生一個 initial ranking（初始排序）；接下來真正要問的是：**這個初始順序夠不夠好，我們能不能再把它排得更符合使用者需求？**

假設使用者搜尋「適合露營用的隨行杯」，一件符合需求的商品已經進入含有 100 件商品的候選清單，卻在 initial ranking 裡只排第 72 名。這件商品雖然沒有被漏掉，但使用者只瀏覽前幾筆結果時，仍然看不到它。因此我們這裡想要探討的問題是：

> **在固定的候選集合中，如何設計排序方法，讓更符合使用者需求的商品優先出現在搜尋結果前列？**

![在固定候選集合中，Ranking 把更符合需求的商品從後段推到前列。](/images/ironman/day-16-ranking-improvement.png)

---

## Ranking：先從一條加權公式開始

Retrieval 已經產生一份**帶有初始順序的候選清單**。如果想進一步調整這個順序，最簡單的做法就是挑出我們重視的訊號、設定權重，再依加總後的分數由高到低排列。

假設我認為 semantic similarity（語意相似度）最重要，其次是商品名稱有沒有直接命中，再來才是 lexical score（詞彙檢索分數），就可以先給它們 0.5、0.3、0.2 的權重，再用最後的加權分數決定順序。這裡先假設不同來源的分數已做 normalization（正規化），落在可以比較的尺度上；否則就和上一篇提到的一樣，不能直接把 cosine similarity 與 lexical score 原始值相加。

![加權公式示意：不同訊號乘上各自的權重後加總，依分數由高到低排列。](/images/ironman/day-16-weighted-scoring.png)

這種做法的好處是**規則透明、容易除錯，也不需要先訓練模型。**如果只有兩三個訊號，而且產品需求很明確，從規則式排序開始通常就已經足夠，不需要一開始就導入更複雜的模型。

然而，實務上我們在意且想要拿來影響排序的因素通常不只兩三個。以目前這個搜尋系統來說，我們可以想到至少三類資訊：

- **檢索訊號**：RRF（Reciprocal Rank Fusion，倒數排名融合）的分數、商品在向量與詞彙檢索中的名次、cosine similarity（餘弦相似度）、詞彙分數，以及商品是否被兩條檢索路徑同時找到。
- **Query（查詢）與商品的直接對應**：例如中文 bigram overlap（相鄰雙字重疊率）、品牌名稱是否命中、商品名稱是否命中。
- **商品本身的資料特徵**：例如描述長度、是否有圖片、圖片面積、是否有子分類、材質欄位的項目數量、常見問答數量等。

有了這些例子，就比較容易理解為什麼不一定要直接沿用 RRF 的順序。RRF 使用各檢索路徑的名次做融合，但到了第二階段，我們還可以加入名稱命中、文字重疊等其他資訊，補足第一階段沒有考慮到的訊號。然而這邊要留意的是**特徵不是越多越好，**有些特徵如「描述長度」或「圖片面積」或許對於資料呈現上有所影響，但對於該商品是否「更為相關」則不見得有直接的關係。

這些額外特徵要怎麼放進排序流程？這就帶到下一個概念：Reranking。

---

## Reranking（重新排序）：在候選集合上做第二階段排序

Retrieval 已經替我們完成第一輪候選篩選與排序。如果可搜尋商品有上萬件，就沒有必要再對整個商品庫計算所有排序特徵；這個專案先把範圍縮到最多 100 件候選，再只針對這批商品加入更多訊號並重新評分。

> **對 retrieval 已找回的候選重新評分、再決定呈現順序，這個步驟就是 Reranking。**

前面有提到 Retrieval 其實也會有初始排序：

1. Retrieval 找出候選，並產生 first-stage ranking（第一階段排序）
2. Reranker（重新排序器）重新評分候選，產生 second-stage ranking（第二階段排序）

![Retrieval 產生初始排序，Reranker 在同一批候選上重新評分並調整順序。](/images/ironman/day-16-retrieval-reranking-stages.png)

因此這裡的 **re-** 指的是：Retrieval 已經排過一次，我們再對同一批候選做第二次排序，讓**更符合使用者需求的商品**有機會被推到更前面。這個步驟可以使用前面提到的手寫規則，也可以交給其他模型或現成服務：

- Cross-encoder（交叉編碼器）或 LLM（大型語言模型）
- 機器學習模型來學習排序（**Learning to Rank，LTR**）——本篇的重點
- 現成的 reranker 服務，例如 [**Cohere Rerank**](https://docs.cohere.com/docs/reranking-with-cohere)，可以直接接收 query 與候選文件

---

## Learning to Rank：讓模型從資料中學習排序

前面手寫排序公式時，我們自行決定哪些訊號要加分、各占多少權重。Learning to Rank 則把這部分交給模型：**提供查詢、候選商品的特徵，以及相關性標註，讓模型學習如何組合這些資訊，產生更符合需求的順序。**

在排序問題裡，我們更在意**相對順序**，而不是把模型輸出的 score 當成具有絕對意義的數值。假設商品 A、B 分別得到 2.7、1.3，重點是模型把 A 排在 B 前面；不代表商品的相關性存在一個叫做「2.7」的標準答案。

常見的訓練模型之一為 LightGBM，我們可以利用其 lambdarank 目標函數來訓練這個模型，以下把實作簡化成主要流程：

```python
# 簡化自目前實作；X、y、qid 為已備妥且列序一致的 NumPy 陣列。
import numpy as np
import lightgbm as lgb
from sklearn.model_selection import GroupKFold

# X：每個「查詢－商品」配對的特徵矩陣。
# y：整數相關性標註（0、1、2、3）；qid：所屬查詢的識別碼。
# 以下資料不包含保留測試集。
n_queries = len(np.unique(qid))
if n_queries < 2:
    raise ValueError("依查詢分組驗證至少需要兩個查詢")

def make_dataset(indices, reference=None):
    # group 是各查詢的筆數，不是逐列的 qid。
    # 先讓同一查詢的資料連續排列，再計算每組筆數。
    rows = indices[np.argsort(qid[indices], kind="stable")]
    _, sizes = np.unique(qid[rows], return_counts=True)
    return lgb.Dataset(
        X[rows], label=y[rows], group=sizes, reference=reference,
    )

params = {
    "objective": "lambdarank",
    "metric": "ndcg",                    # 驗證前排排序品質
    "eval_at": [5, 10],
    "label_gain": [0, 1, 3, 7],           # 四個相關性等級的增益
    "lambdarank_truncation_level": 13,    # 訓練時關注前排名次
    "verbosity": -1,
}

# GroupKFold（分組交叉驗證）讓同一查詢不會跨越訓練與驗證集。
fold_scores, best_iterations = [], []
cv = GroupKFold(n_splits=min(5, n_queries))
for train_idx, valid_idx in cv.split(X, y, groups=qid):
    train_ds = make_dataset(train_idx)
    valid_ds = make_dataset(valid_idx, reference=train_ds)
    model = lgb.train(
        params, train_ds, num_boost_round=500,
        valid_sets=[valid_ds],
        callbacks=[lgb.early_stopping(50, verbose=False)],
    )
    fold_scores.append(model.best_score["valid_0"]["ndcg@10"])
    best_iterations.append(model.best_iteration)

# 用各折結果比較設定；不是把最後一折模型直接拿去上線。
mean_ndcg = float(np.mean(fold_scores))
model = lgb.train(
    params, make_dataset(np.arange(len(y))),
    num_boost_round=int(np.median(best_iterations)),
)
```

---

## 從離線訓練到線上排序：部署模型要注意什麼？

模型在離線資料上訓練完成，只代表我們得到一個可以評分的模型；真正上線時，還要另外建立**線上推論流程**：收到查詢、取得候選、計算特徵、載入模型、產生分數，再把新的順序回傳。**線上只做推論，不會每次查詢都重新訓練，也不需要使用者提供相關性標註。**

![離線訓練產出模型，線上推論接收查詢與候選、計算特徵、產生分數並回傳新順序。](/images/ironman/day-16-offline-to-online.png)

部署排序模型時，真正要處理的是離線訓練環境與線上服務之間的落差。特徵怎麼算、模型怎麼被載入、流量怎麼切換，都可能讓「離線評估表現很好」和「上線後真的照預期工作」變成兩件事。以下我們來看三種不同的風險：

### 一、訓練與線上使用相同的特徵定義

第一個風險是 **training-serving skew（訓練與線上推論偏差）**：模型訓練時看到一套特徵定義，上線後卻因為欄位順序、單位或計算方式不同，實際收到另一套資料。例如模型訓練時第二個欄位是檢索名次，線上卻放入相似度分數，即使資料都是數字、程式沒有報錯，模型解讀的內容也已經不同。

常見做法是把**特徵定義集中管理並明確版本化**，讓訓練與線上推論都依賴同一份規格。以目前實作為例，特徵名稱、來源與排列順序會寫進 `FEATURE_SPEC`，計算 hash（雜湊值），並存入模型的中繼資料；載入模型時先核對這份定義是否和線上程式相容：

```typescript
import { createHash } from "node:crypto";

// 簡化示意：FEATURE_SPEC 來自共用模組，modelMeta 來自模型中繼資料。
const featureSpecHash = createHash("sha256")
  .update(JSON.stringify(FEATURE_SPEC))
  .digest("hex");

if (modelMeta.feature_spec_hash !== featureSpecHash) {
  throw new Error("Feature spec mismatch");
}
```

這能攔下特徵清單或順序不相容的情況，但不會自動理解計算方式的變更。假設 `lexical_score` 的名稱沒變，公式卻改了，這個 hash 仍可能相同。修改特徵計算時，仍需要固定輸入的測試與重新評估，不能只靠名稱相同就繼續套用舊模型。

### 二、確認推論一致性：模型換個執行環境，結果不能跟著變

另一個常見風險發生在**模型轉檔與執行環境：**模型可能在 Python 裡訓練，但正式產品未必直接使用同一套 Python 執行環境；模型常會被匯出成 ONNX 等格式，再交給 Node.js、Java 或其他執行環境使用。

這會是一個問題的原因是因為模型轉檔後，在不同執行環境中的運算結果不一定完全相同：運算子（operator）對應、浮點精度或轉換方式的差異，都可能讓同一組特徵得到略有不同的分數，而排序最終依分數決定順序，所以即使偏差很小，只要兩個商品原本分數很接近，就可能直接交換排名。因此需要**一致性測試（parity test）**，確認訓練環境與線上評分器的輸出差異小到不會改變模型行為。

要怎麼做這個測試呢？我們可以先在訓練環境保存幾組固定的特徵輸入與預期分數，再讓線上評分器重跑一次，確認誤差落在可接受範圍。以上述情境為例，模型在 Python 訓練後匯出成 ONNX，再由 Node.js 執行推論，就可以用固定測試資料驗證兩邊的分數是否一致。

```typescript
// expectedScore 由訓練環境事先產生
for (const fixture of parityFixtures) {
  const [actualScore] = await scoreCandidates([
    Float32Array.from(fixture.features),
  ]);

  expect(
    Math.abs(actualScore - fixture.expectedScore)
  ).toBeLessThan(1e-5);
}
```

### 三、上線策略：先做線上驗證，再逐步放大流量

即使線上推論可以正常運作，也不代表應該直接把 100% 流量直接轉移到新的模型。除了離線資料無法完整覆蓋真實的查詢分布外，新的排序模型也可能增加延遲、提高錯誤率，或在特定使用情境下產生沒有預期到的排序。

一個比較穩健的上線策略通常會分幾步：

1. **影子流量（Shadow traffic）**：線上同時計算新模型分數，但不影響使用者看到的結果。先確認延遲、錯誤率與輸出分布是否正常。
2. **線上實驗（Online experiment）**：系統穩定後，再比較新舊排序對真實使用行為的影響。最常見的是 **A/B test**，把使用者或搜尋工作階段隨機分到不同排序方案；排序系統也可以使用 interleaving（交錯實驗），把兩種排序交錯在同一份結果裡做比較，但這是另一種實驗設計，不等同於 A/B test。
3. **漸進式上線（Gradual rollout）**：如果線上指標符合預期，再從少量流量逐步提高比例，而不是一次全面切換。
4. **回退／備援（Rollback / fallback）**：舊的排序路徑不應立刻消失。新模型發生錯誤，或延遲、品質等防護指標惡化時，要能快速退回原本的排序方案。

---

## Ranking 要怎麼評估？先看前排結果的品質

上一篇談 Retrieval 時，我們用 **Recall@K（召回率）** 回答一個很直接的問題：在保留 K 個候選的情況下，應該找回來的相關商品有多少真的進了候選集合。

到了 Ranking，問題換成了：**同一批候選都已經找回來之後，前排結果的品質與順序好不好？** 因此除了看前 K 筆有多少相關結果，也會使用真正對排名位置敏感的指標。

以下三個是常見的 Ranking 指標：

- **Precision@K（前 K 名精確率）**：前 K 筆結果裡，有多少是真的相關。它回答的是「使用者眼前這幾筆，有多少是對的？」但不區分這些相關結果在前 K 名內部的先後順序。
- **NDCG@K（正規化折損累積增益）**：不只看相關或不相關，還可以納入不同的相關程度；而且越前面的結果權重越高。它適合回答「最相關的商品，有沒有真的被排到前面？」
- **MRR（平均倒數排名）**：特別在意第一個相關結果出現得多早。如果產品情境很重視「第一個可用答案在哪裡」，這個指標會很直觀。

另外，**Recall@100 在純 reranking 實驗裡反而可以當 sanity check（合理性檢查）**：如果兩個 ranker 使用完全相同的 100 件候選，只是重新排列順序，Recall@100 理論上就不應該改變。

以下是我們實際測試後看到的結果：

| 指標 | RRF 基準 | LTR v1 | 差異（LTR − RRF） |
|---|---|---|---|
| Recall@100 | 0.851 | 0.851 | 0 |
| Precision@5 | 0.600 | 0.644 | +0.044 |
| NDCG@10 | 0.732 \[0.617, 0.830\] | 0.787 \[0.670, 0.883\] | +0.055 \[0.026, 0.092\] |
| MRR | 0.875 | 0.906 | +0.031 |

這類排序比較有一個前提：兩種方法要使用相同的查詢、相關性標註與候選商品，才比較能把差異歸因於排序本身。評估題目也應與訓練資料分開；反覆拿測試題調參，最後測到的就不再是未見需求上的表現。

表中的方括號是 95% 信賴區間。比較新舊方法時，重點是同一題的 NDCG@10 差值，而不是把兩組平均分數的區間端點直接相減。[成對 bootstrap（自助抽樣）](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.bootstrap.html)會保留同一查詢的兩個分數一起抽樣，再反覆計算平均差值，估計它對查詢抽樣的敏感程度。

這份結果的平均差值為 +0.055，差值的 95% 信賴區間為 0.026 至 0.092，沒有跨過 0。兩種方法各自的區間即使重疊，也不能據此否定成對差異；但這同樣不是「新方法有 95% 機率比較好」，更不能換算成使用者滿意度提升 5.5%。結論仍受測試查詢的代表性與標註品質限制。

這次結果有兩個我最在意的訊號：

- **NDCG@10 從 0.732 提高到 0.787**：在這批測試查詢與標註下，LTR 的前排順序更接近我們定義的理想排序。
- **Recall@100 維持 0.851**：與只改順序、不增加候選的設計一致。不過，Recall 相同不能單獨證明候選相同，仍應逐題核對候選商品的識別值。

---

## 下一篇：從搜尋系統回到使用者

前面幾篇我們從系統的角度，拆解了一次商品搜尋背後實際發生的事情：自然語言怎麼變成搜尋條件、retrieval（檢索）怎麼找出候選，以及 ranking（排序）怎麼決定最後的結果順序。

到這裡，搜尋背後的流程大致接起來了。下一篇會把視角翻回使用者端：**當這些能力真的出現在畫面上，使用者要怎麼理解搜尋結果、調整系統的判斷，並繼續往下一步探索？**
