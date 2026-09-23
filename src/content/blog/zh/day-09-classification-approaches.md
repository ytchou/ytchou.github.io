---
title: "答案集合已知時：分類問題有哪些解法？"
description: "商品分類看似簡單，但關鍵字比對、監督式學習、零樣本分類、生成式 LLM 各有取捨。用一個飾物盤的例子，比較六種分類方法的差異與適用場景。"
day: 9
chapter: 2
date: 2026-09-23
tags: [鐵人賽]
lang: zh
series: ironman
notion: https://app.notion.com/p/patrickytc/Day-09-3b10d2d793cf81d29cb3fbd01a396eba
---

## 今天要聊什麼？

上一篇介紹了三種任務類型：封閉集合分類、基於證據的內容整合，以及多模態／脈絡判斷。這三種任務都會出現在這個專案裡，**今天先從第一種封閉集合分類（closed-set classification）開始**。

延續上一篇提到的情境，我們需要將抓回來的商品資料進行分類：**給系統一個商品名稱與一段描述，請它從既有商品類別中選一個**。我們先假設商品類別為以下六類中的其中一類：

| | | |
|---|---|---|
| 服飾鞋履 (fashion) | 包袋配件 (bags-accessories) | 飾品珠寶 (jewelry) |
| 美妝保養 (beauty) | 居家生活 (home) | 文具設計 (stationery) |

我們想要將一個「月光飾物盤」進行分類，商品簡介如下：

> 淺盤以陶瓷燒製，盤面直徑 12 公分，適合放在梳妝台收納每日配戴的小物。將戒指、耳環與項鍊集中放在床頭，隔天出門前就不用四處尋找。

這段文案出現「戒指、耳環、項鍊」，很容易和飾品珠寶（jewelry）連在一起。但它真正販售的是放置飾品的陶瓷淺盤，因此應該分到居家生活（home）。這個例子說明：**答案範圍固定，不代表只比對關鍵字就能分對；我們還需要辨識文案真正描述的商品。**

為什麼這個問題很重要？**以電商平台為例，分類可能同時被篩選工具、推薦系統與內部營運報表使用**。假設這個商品被誤分到飾品珠寶的類別，找居家收納用品的人可能看不到它，找耳環的人卻看到一個盤子。若推薦系統用同類商品建立候選，或營運報表依品類統計銷售，這筆錯誤也可能進入後續的推薦與分析。

**這是我們今天想探討的問題：面對一個答案集合已知的問題，我們有哪些解法可以選擇？**

---

## 從人工到模型：分類問題的六種解法

分類問題並不是新問題：商品歸類、文件分類、垃圾郵件辨識等內容在生成式 AI 普及以前就已經是很常見的商業問題。我們先來看看在 AI 開始之前這些問題是怎麼被解決：

![分類問題的六種解法](/images/ironman/day-09-classification-methods.png)

整體而言大致可以分成以下四種形式：

- **人工分類（Manual Classification）**：人讀完資料後直接選類別，適合資料量少的情況；代價是逐筆花時間，而且不同人的判斷可能不一致。
- **規則分類（Rule-based Classification）**：把判斷寫成關鍵字、對照表或 `if / else`。不需要訓練模型，但要由人事先定義哪些條件對應哪個類別。
- **監督式機器學習（Supervised Machine Learning）**：讓分類器從已標註資料學習，再處理新商品。不必逐條手寫規則，但需要準備訓練資料，並自行訓練與部署模型。
- **零樣本分類（Zero-shot Classification，以 NLI 為例）**：利用現成的自然語言推論模型，判斷商品文字是否支持各個類別描述。模型已接受過訓練，但不必先為我們的六個類別準備訓練樣本。

隨著 AI 的演進，以下兩種方法也逐漸被大家拿來解決分類問題：

- **生成式 LLM**：將分類定義與判斷要求放入系統訊息，將商品文字放入使用者訊息，讓模型生成答案。除了選類別，也可以要求簡短說明；是否使用額外推理，則是另一個設定。
- **Jev**：這是近期 TypeSafe 推出的[結構化決策模型](https://typesafe.ai/blog/introducing-system-one-models-and-jev)，與傳統生成式模型最大的差異在於它不會生成文字，而是針對設定的回應方式（機率、選項、Yes/No）直接給予答案。

我們可以將這六種分類方法統整做成以下的比較：

![六種分類方法的特性比較](/images/ironman/day-09-six-methods-spectrum.png)

---

## 商品分類實作：以「月光飾物盤」為例

在前一段我們討論了針對同一個分類問題下不同的解法，現在我們來看實際執行的差異。回顧我們前面提到的問題：我們要將一個「月光飾物盤」產品進行分類，我們可以先整理出以下的資料形式

```python
LABELS = {
    "fashion": "服飾鞋履：上衣、褲子、鞋履等",
    "bags-accessories": "包袋配件：包袋、錢包、帽子等",
    "jewelry": "飾品珠寶：耳環、項鍊、戒指等",
    "beauty": "美妝保養：保養品、彩妝、洗沐用品等",
    "home": "居家生活：餐具、家具、燈具、居家擺飾、居家收納用品等",
    "stationery": "文具設計：筆記本、筆、紙膠帶等",
}
product = {
    "name": "月光飾物盤",
    "description": "將戒指、耳環與項鍊集中放在床頭，隔天出門前就不用四處尋找。淺盤以陶瓷燒製，盤面直徑 12 公分，適合放在梳妝台收納每日配戴的小物。",
}
text = " ".join(product.values())
```

人工分類就是人工讀完後直接去選擇，不需要另外寫程式，這邊不多贅述。

### 規則分類：用詞表比對

同樣的例子，可以先寫一份小詞表，收集命中的分類；只有一類命中才採用：

```python
KEYWORDS = {
    "fashion": ["上衣", "褲子", "鞋"],
    "bags-accessories": ["錢包", "托特包", "後背包"],
    "jewelry": ["耳環", "項鍊", "戒指"],
    "beauty": ["精華液", "洗髮精", "唇膏"],
    "home": ["陶瓷杯", "餐盤", "桌燈"],
    "stationery": ["筆記本", "鋼筆", "紙膠帶"],
}

def classify_by_rules(product_text: str) -> str | None:
    matches = [slug for slug, words in KEYWORDS.items()
               if any(word in product_text for word in words)]
    return matches[0] if len(matches) == 1 else None
```

這份詞表會把飾物盤分成 `jewelry`，因為命中的詞都在描述被收納的物品。**用詞難以窮舉，也可能同時命中多類**；即使補上「淺盤」，仍要決定哪個線索代表商品本身。

### 監督式機器學習：訓練後再分類

以下用 Logistic Regression 舉例，先將文字轉成字元層級的 TF–IDF 特徵。`train_texts` 與 `train_labels` 是另外準備的商品文字與正確分類，需涵蓋這六類：

```python
from sklearn.pipeline import make_pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

model = make_pipeline(
    TfidfVectorizer(analyzer="char", ngram_range=(2, 4)),
    LogisticRegression(max_iter=1000),
)
model.fit(train_texts, train_labels)
category = model.predict([text])[0]
```

真正需要投入的是 `fit()` 之前的資料準備：標註錯誤、類別不平衡與過擬合都要留意，另外模型部署的部分也需要工程團隊維護與運營。

### 零樣本分類（NLI）：直接提供候選類別

這部分我們可以載入現成的 [mDeBERTa NLI 模型](https://huggingface.co/MoritzLaurer/mDeBERTa-v3-base-mnli-xnli)，提供商品文字與六類描述，取分數最高的類別：

```python
from transformers import pipeline

nli_classifier = pipeline(
    "zero-shot-classification",
    model="MoritzLaurer/mDeBERTa-v3-base-mnli-xnli",
)
result = nli_classifier(
    text,
    candidate_labels=list(LABELS.values()),
    hypothesis_template="這件商品的類別是{}。",
    multi_label=False,
)
description_to_slug = {value: key for key, value in LABELS.items()}
category = description_to_slug[result["labels"][0]]
```

這裡借用的是通用模型，並未針對我們的商品分類訓練。省下準備訓練資料的工作，代價是**模型原本學到的判斷方式，未必貼合我們的用詞與分類邊界**；就像萬用工具，拿來就能用，但不一定最適合眼前的任務，因此相較之下可能更適合作為訓練專用模型前的 Benchmark 模型。

### 生成式 LLM：提供 prompt，約束輸出

把分類定義與商品文字交給 LLM，再用 [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs) 限制商品類別必須是六個商品類別之一。以下以 OpenAI SDK 為例：

```python
from enum import Enum
from typing import Literal
from pydantic import BaseModel
from openai import OpenAI

Category = Enum("Category", {s.replace("-", "_"): s for s in LABELS}, type=str)
class Classification(BaseModel):
    category: Category
    reasoning: str
    confidence: Literal["high", "medium", "low"]

prompt = f"依實際販售的商品選一類，不要把被收納物當成商品。分類定義：{LABELS}"
response = OpenAI().chat.completions.parse(
    model="gpt-4o-mini",
    messages=[{"role": "system", "content": prompt},
              {"role": "user", "content": text}],
    response_format=Classification,
)
answer = response.choices[0].message.parsed
category = answer.category.value if answer else None
```

同一份分類表提供兩種資訊：prompt 說明各類代表什麼，schema 限制生成結果可以回傳哪些值。

![分類定義同時約束 prompt 與 schema](/images/ironman/day-09-taxonomy-constraints.png)

圖中是輸出格式示意。Structured Outputs 能排除未定義的值，卻擋不住「合法但選錯」：飾物盤被分到 `jewelry`，仍會符合 schema。

### Jev：用 Choice 定義分類問題

依 [TypeSafe 官方 SDK](https://github.com/typesafe-ai/typesafe-sdk-python/blob/main/README.md)，商品資料放在 `state`，分類問題用 `Choice` 表達，`criteria` 提供選項與說明：

```python
from typesafe_sdk import Choice, TypeSafeClient

with TypeSafeClient() as client:
    response = client.system_one(
        state=product,
        questions={
            "category": Choice(
                instructions="依實際販售的商品分類，不要把被收納物當成商品。",
                criteria=LABELS,
            ),
        },
    )
category = response.choices["category"].choice
```

`Choice` 會回傳選項與各選項的機率，但分類定義仍要寫清楚。**不生成自由文字，不代表不會選錯類別。**目前這個模型還非常新穎沒有太多的案例可以來看這個工具的正確性如何，我們在後續會有一個實際操作案例來比較這個模型與其他幾個模型的差異，屆時會再來深入討論。

---

## 下一個問題：如果答案沒有固定集合呢？

今天用飾物盤的例子，介紹了固定選項分類的六種解法與基本操作。先看手上的規則、標註資料與任務需求，再選擇適合的做法；真實商品的完整執行與局部分類比較，留到後面的 Product Agent 整合篇。

下一篇回到品牌 A 與商品 A，討論第二種任務：**基於證據的內容整合（evidence-grounded synthesis）**。商品介紹沒有固定選項，也沒有唯一正確句子，我們要怎麼讓 LLM 整理來源，而不多寫沒有依據的內容？

我們明天見！
