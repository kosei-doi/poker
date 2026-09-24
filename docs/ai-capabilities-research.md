# AI でできること調査（インパクトを足すために）

> **最終更新**: 2026-09-24 / **オーナー**: 土井
> **位置づけ**: 参考。何を足すかを決めるための材料で、決定事項ではない。料金は各社の公式ページで 2026-09-24 に確認した
> **スコープ**: 生成 AI の能力、観光分野と AI ハッカソンの事例、2日で組み込む手段。実装の手順は対象外
> **表記**: 出典 URL があるものは事実。【推測】は調べた側の推測。（二次）は公式以外の情報源

---

## 1. 結論

**「AI を使っている」だけでは差がつかない。** 旅程を作る AI やチャットボットは、NAVITIME・Expedia（Layla を買収）・自治体などがすでに提供している。インパクトを出すには、**AI にしかできない変換を、地図の上で一目で見せる**のがよい。AI ハッカソンの受賞作もこの型が多い。

足す候補（上ほどおすすめ）:

| # | 機能 | デモで見せる場面 | 使う AI の能力 | 重さ |
| --- | --- | --- | --- | --- |
| 1 | **写真1枚から「その穴場版」を探す** | SNS で見た有名な絶景の写真をドロップすると、雰囲気の似た茨城県北の町3つに光が当たる | 画像の理解、画像と文章のベクトル化 | M |
| 2 | **会場の感想で穴場度がその場で変わる** | 発表中に審査員が QR コードから感想を書くと、AI が読み取り、スクリーンの地図で町の光が強まる | 文章からの抽出（本物の API を呼ぶ） | S〜M（D2 の流用） |
| 3 | **有名な観光地が穴場を勧める** | 地図上の有名地が「混んでいる私より、○○町へ」と話し、根拠の声を引用する | 文章生成、読み上げ | S〜M |
| 4 | **町向けの「穴場新聞」** | 町向けレポート（D3）を、新聞の1面や SNS 投稿の形に整えて出す | 文章生成・要約 | S |
| 5 | **旅の予告編** | 1日プランから、実写の写真と読み上げで15秒のスライド動画を組む | 文章生成、読み上げ | M |

- **1 が一番の推し:** 「有名地の代わりになる穴場」という見せ方は、穴場度（満足度 − 知名度）の考え方にそのまま合う。Google マップのスクショ機能は地名を読むだけで、景色から場所を探すことはまだできない
- **2 は完成度と「本物の AI」を同時に示せる:** 本物の API を呼ぶのは、感想の読み取り（`analyzeVoice`）の1か所だけでよい

**見送り:**

| 見送るもの | 理由 |
| --- | --- |
| AI で実在の町の画像を作る | 存在しない観光地の画像が海外で問題になり、実写だけを使うと宣言した州もある |
| 方言の自動生成 | 不自然だと地元の反感を買う【推測】 |
| リアルタイムの音声対話・動画生成 | 高額で、2日では間に合わない |
| 古い写真のカラー化 | 写真の入手と権利の確認が間に合わない |

---

## 2. 生成 AI にできること（2026年時点）

| 能力 | 代表的な API | できること | 苦手なこと | 料金の目安 |
| --- | --- | --- | --- | --- |
| 文章（抽出・要約・翻訳） | Claude（Haiku 4.5 / Sonnet 5 / Opus 5.5）、GPT、Gemini Flash | 感想から満足度を抽出、要約、多言語化 | 地方の細かな事実をでっち上げやすい | Haiku 4.5 は入力 $1・出力 $5（100万トークンあたり） |
| **画像の理解** | Claude / GPT / Gemini | 写真から場所・料理・雰囲気を読む | 無名のスポットは外しやすい【推測】 | 1枚あたり数千トークン【推測】 |
| **画像と文章のベクトル化** | Gemini Embedding 2 | 「雰囲気が似ている」ものを、画像と文章をまたいで探す | 意味は近くても事実が違うものを拾う | 画像1枚 $0.00012 |
| 画像の生成・編集 | Gemini Flash Image、GPT Image 2 | 写真の編集、ポスター作成 | 日本語の文字（精度は約85%、二次） | 約 $0.045/枚 |
| 音声 | ブラウザ標準の読み上げと音声認識、Gemini TTS、gpt-realtime | 読み上げ、音声での入力、音声対話 | なじみの薄い方言は不自然【推測】 | ブラウザ標準は無料。リアルタイム対話は高額（音声 $32/$64） |
| 動画 | Gemini（理解）、Veo・Sora（生成） | 動画の要約、短いクリップの生成 | 実在の場所を正確に再現できない | 生成は $0.05〜0.60/秒 |
| エージェント・実データ | Claude の Web 検索、Gemini の Maps 連携 | 実在施設の検索、情報源付きの回答 | 手順が長いと遅く、失敗しやすい | Maps 連携は月5,000回まで無料 |
| 構造化出力 | Claude の structured outputs など | 決めた JSON の形どおりに出力させる | 形は守るが、中身が正しいとは限らない | 追加料金なし |
| 長文脈 | Claude、Gemini（100万トークン） | 数百件の声を一度に読ませてレポートを作る | 長い文の途中を見落とす【推測】 | 通常料金 |

出典: https://platform.claude.com/docs/en/about-claude/pricing ・ https://ai.google.dev/gemini-api/docs/pricing ・ https://developers.openai.com/api/docs/pricing ・ https://platform.claude.com/docs/en/build-with-claude/structured-outputs ・ https://ai.google.dev/gemini-api/docs/maps-grounding ・ https://arxiv.org/pdf/2601.21278

---

## 3. 事例

### 観光・地域

| 事例 | 何が驚きか | 出典 |
| --- | --- | --- |
| VisitDenmark（2023） | AI で動くモナリザや自由の女神が「私を見に来ないで、デンマークへ」と話す。台本も AI が作成。混雑を旅の不満に挙げた人は56% | https://www.visitdenmark.com/press/latest-news/ai-brings-mona-lisa-life-and-shes-recommending-not-go-see-her |
| 山口県美祢市「ミネドン」 | 市のキャラクターが音声で観光案内する生成 AI。国内初 | https://karusuto.com/notice/minedon-kanko-chatgpt/ |
| Skyscanner「代わりの旅先」 | 混雑した旅先の代わりになる場所を AI が出す | https://www.tourism-review.com/ai-generated-phantom-destinations-attract-visitors-news15134 |
| Google マップのスクショ機能 | スクショの中の地名を読み取ってリストにする（景色から場所を探す機能はない） | https://9to5google.com/2025/03/27/google-maps-gemini-screenshots/ |
| 草津温泉の PR 動画 | 企画から映像まで AI で制作 | https://prtimes.jp/main/html/rd/p/000000002.000058928.html |

**市場の数字:**
- 米国の旅行サイトへの生成 AI 経由の流入は前年比 +3,500%（2025年7月）: https://business.adobe.com/blog/consumers-embrace-generative-ai-for-trip-planning
- 生成 AI を週1回以上使う人の77.8%が旅行で利用している（JTB 総研）: https://www.tourism.jp/tourism-database/survey/2025/08/tourism-ai/

### AI ハッカソンの受賞作の傾向

| 大会 | 受賞作と、評価されたこと | 出典 |
| --- | --- | --- |
| JPHACKS 2025 | 描いた絵を GPS ランニングコースに変える「AshiArt」が最優秀賞と観客賞。地図上で一目で分かる変換が刺さった | https://jphacks.com/2025/result/ |
| Zenn AI Agent Hackathon | 明確な課題、人が判断して AI が情報を処理する協働、定量的な効果、ストーリー性が評価された | https://zenn.dev/taku_sid/articles/20250403_ai_hackathon_review |
| Gemini API コンテスト | 画像・音声などを組み合わせた AI と、当事者の課題の組み合わせ | https://developers.googleblog.com/en/announcing-the-winners-of-the-gemini-api-developer-competition/ |

**避けるパターン:**
- 汎用の観光チャットボットや旅程生成だけにする（「それはもうある」と言われる）
- 本物の API に頼り切って、失敗したときの代わりがない
- 効果を数字で示さない

---

## 4. 本物の AI をどこまで使うか

**おすすめ:** モックを基本にする。本物の AI は、感想の読み取り（`analyzeVoice`）と、足すなら写真の読み取りの1〜2か所だけにする。

| 項目 | 内容 |
| --- | --- |
| 構成 | 画面 → 小さなサーバー側の関数（Cloudflare Workers か Vercel Functions）→ AI の API。API キーは関数の側にだけ置く。ブラウザから直接呼ぶと、キーを誰でも取り出せてしまう |
| モデル | Claude Haiku 4.5（1回あたり約0.4円【推測】）か、Gemini Flash（無料枠あり。ただし無料枠の入力は Google の製品改善に使われる） |
| 切り替え | URL の `?ai=live` と `?ai=mock` で選べるようにする。本物を選んでいても、4秒で応答がない・エラー・形式の崩れのどれかが起きたら自動でモックに戻す。画面に「AI: Live / Offline」と表示する |
| 誤りへの備え | 満足度は1〜5、知っていたかは3つの値に限定し、外れた値は捨てる。「根拠の文」が感想の原文に含まれるかを確かめる |
| 通信断 | スマホのテザリングを用意する。直前に通信なしで一度通す。モックだけで通した録画を用意する |
| 目安の工数 | 関数と切り替えで半日、プロンプトの調整で半日【推測】 |

**注意:** 今の要件定義書は「実際の AI API 呼び出し」を対象外にしている。入れる場合は要件を変える。

出典: https://developers.cloudflare.com/workers/platform/pricing/ ・ https://vercel.com/docs/plans/hobby ・ https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API ・ https://developer.chrome.com/docs/ai/prompt-api

### 権利・安全

- AI の生成物が既存の著作物の権利を侵すかは、「似ているか」と「元にしたか」で判断される（文化庁 https://www.bunka.go.jp/seisaku/chosakuken/aiandcopyright.html ）
- 人が写った写真は使わないか、顔をぼかす
- 写真を探す機能（候補1）では、利用者がドロップした写真はその場で読むだけにし、保存しない【推測: 著作権と個人情報の手間を避けるため】
