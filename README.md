# 📂 Daisuke Maruyama Portfolio

私の個人のポートフォリオサイトのリポジトリです。
Unity / C# を用いたゲーム開発作品を中心に掲載しています。

**🔗 公開URL:** [https://daiMaruyama.github.io/](https://daiMaruyama.github.io/)

---

## 🎨 デザインコンセプト
**"Logic & Emotion"**
エンジニアとしての「論理的な構造」と、クリエイターとしての「情熱」を表現するため、以下のデザイン方針で設計しました。

* **ダイナミックなレイアウト:** `transform: skewY` を活用した斜めのラインで、動きと勢いを表現。
* **カラーパレット:** 情熱を表す「赤」と、プロフェッショナルな「黒・白」を基調としたハイコントラストな配色。
* **レスポンシブ対応:** PC、タブレット、スマートフォン、どのデバイスでも崩れないレイアウト設計。

## 🛠 使用技術
フレームワークやCMS（WordPress等）を使用せず、基礎的なWeb技術の理解を深めるためにHTML/CSSでスクラッチ開発しました。

* **HTML5 / CSS3:** セマンティックなマークアップと、BEM設計を意識したCSS。
* **JavaScript:** 動的なUI制御に使用。
* **AOS (Animate On Scroll):** スクロール連動アニメーションの実装に使用。
* **FontAwesome:** アイコンフォントの使用。

## 📂 ディレクトリ構成
主要なファイルの構成は以下の通りです。

```text
daiMaruyama.github.io/
├── index.html          # トップページ（作品一覧・経歴）
├── style.css           # サイト全体の共通デザイン定義
├── projects/           # 各作品の詳細ページ
│   ├── shapepuzzles.html
│   ├── shootingtwinkle.html
│   ├── virus.html
│   ├── tsuppatte.html
│   └── frontslimers.html
└── images/             # 作品のスクリーンショットや素材
