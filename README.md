# Daisuke Maruyama — Game Programmer Portfolio

Unity / C# を中心にゲームを開発する、丸山大輔のポートフォリオサイトです。

公開URL: [https://daiMaruyama.github.io/](https://daiMaruyama.github.io/)

## Concept

**「夢中になれる、もう一つの世界を作る。」**

ゲームに夢中になる時間がくれた、現実とは違う自由。
今度は自分が、何度でも戻りたくなる世界を実装するゲームプログラマーになる。
その原点と、作品の中で実際に担当した機能が短時間で伝わるポートフォリオを目指しています。

トップは、代表作・担当・技術・結果を迷わず追える簡潔な構成です。
各作品の大きなメディア枠は、短いプレイ動画へ差し替えられる設計にしています。
作品詳細では、企画意図だけでなく実装判断・構造・ソースコードまで確認できます。

操作した瞬間だけ現れるインク表現と、訪問・操作回数が蓄積する `TRACE` を小さなゲーム的アクセントとして加えています。
現在の数値は `localStorage` に保存される端末内デモです。

## Structure

```text
.
├── index.html       # 代表作 / 実装領域 / 経歴 / プロフィール
├── home.css         # トップページ専用デザイン
├── style.css        # 作品詳細ページの共通デザイン
├── script.js        # 表示演出 / インク反応 / 訪問・操作の記録
├── projects/        # 各作品のケーススタディ
└── images/          # 作品画像・プロフィール画像
```

## Implementation

- HTML / CSS / Vanilla JavaScript
- レスポンシブ対応
- `localStorage` / `sessionStorage` を使ったローカル保存
- `prefers-reduced-motion` 対応
- 画面に近づいてから読み込む、無音ループ動画プレビュー対応
- フレームワークやビルド工程なしで GitHub Pages に配置可能

## Gameplay Video

トップの作品カードは、短い自己ホスト動画と静止画を併用します。
`index.html` の各 `data-video-src` にMP4のパスを設定すると、読み込み完了後だけ静止画から動画へ切り替わります。
空欄のままなら動画の通信は行わず、現在の静止画・ポスター表示を維持します。

推奨素材:

- H.264 / MP4
- 1280×720
- 5〜8秒、無音、ループ前提
- 1本2MB以内
- 詳しいプレイ動画は作品詳細からYouTubeへリンク

## Selected Works

- 座れ！サラリーマン！
- ZeroOneSlash
- Shape Puzzles
