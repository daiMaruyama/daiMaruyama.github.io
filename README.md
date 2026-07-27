# Daisuke Maruyama — Game Programmer Portfolio

Unity / C# を中心にゲームを開発する、丸山大輔のポートフォリオサイトです。

公開URL: [https://daiMaruyama.github.io/](https://daiMaruyama.github.io/)

## Concept

**「心を動かす理想を、遊べる形にする。」**

ゲームに救われた経験を原点に、企画意図を理解し、チームの理想をコードで成立させるゲームプログラマーとしての制作姿勢を伝えるサイトです。

ポートフォリオ全体を「遊べる作品を収蔵する小さな博物館」として設計しています。
入口の体験型展示でゲームシステム・UIフィードバック・チーム開発・商用コードの担当実績を切り替えて確認できます。
常設展示で代表作、資料室で制作歴と証拠、技術展示で実装判断、制作室で開発プロセスを見せます。

中庭の `MUSEUM COURTYARD` は、訪問と館内操作で植物が育つゲーム的な試作です。現在の数値は `localStorage` に保存される端末内デモで、`DEBUG` パネルから任意の成長段階を確認できます。

## Structure

```text
.
├── index.html       # 作品館 / 資料室 / 常設展示 / MUSEUM COURTYARD
├── style.css        # トップと作品詳細の共通デザイン
├── script.js        # 訪問・操作の記録と庭の成長
├── projects/        # 各作品のケーススタディ
└── images/          # 作品画像・プロフィール画像
```

## Implementation

- HTML / CSS / Vanilla JavaScript
- レスポンシブ対応
- `localStorage` / `sessionStorage` を使ったローカル保存
- `prefers-reduced-motion` 対応
- フレームワークやビルド工程なしで GitHub Pages に配置可能

## Selected Works

- 座れ！サラリーマン！
- ZeroOneSlash
- Shape Puzzles
