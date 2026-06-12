# EVOLVORE（エヴォルヴォア）

> **喰って、進化して、頂点に立て。 / Devour. Evolve. Dominate.**

Agar.io × diep.io × Vampire Survivors 融合型・捕食進化サバイバルの **シングルプレイMVP**。
HTML5 Canvas + TypeScript 製。10分間、モンスターの大群を喰らい尽くして進化し、
赤い捕食者「VORE」すら"ごちそう"にするオート攻撃×捕食進化サバイバル。

## 遊び方 / How to Play

- **移動**: マウスカーソル追従（または WASD）。攻撃は全部オート
- **アクティブスキル**: 左クリック / Space（クラス固有の1発）
- **強化選択**: レベルアップ時に 1 / 2 / 3 キー or クリック
- 敵を倒す → ジェムを拾う → レベルアップ → 3択ドラフト → **Lv10/20/30 で進化分岐**
- 5:00 にマザーワーム、8:30 から喰らい霧が収縮、9:40 にザ・コロッサス出現
- 2:30 に登場する捕食者 **VORE** を倒すと保有XPの70%が爆散するジャックポット
- UI は日本語 / English 切替対応（タイトル画面）

## 開発 / Development

```bash
npm install
npm run dev      # 開発サーバー (Vite)
npm run build    # 型チェック + プロダクションビルド
npm test         # ユニットテスト (Vitest)
npm run preview  # dist/ の確認用サーバー
```

### スモークテスト（ヘッドレスブラウザ）

```bash
npm run preview -- --port 4173 --strictPort &
node scripts/smoke.mjs           # 起動〜序盤プレイの検証＋スクリーンショット
node scripts/smoke-lategame.mjs  # 時間ジャンプでボス・霧・コロッサス・リザルト検証
node scripts/capture.mjs         # 濃い戦闘シーンのビジュアル確認（canvas直キャプチャ）
node scripts/fpscheck.mjs        # 戦闘負荷時のFPS計測
```

## アーキテクチャ

- **固定タイムステップ60Hz**（accumulator方式）、描画は可変FPS
- 当たり判定は**全エンティティ円**（`distSq` のみ、平方根なし）＋**空間ハッシュ**（128pxグリッド）
- 弾・敵・ジェム・パーティクルは**オブジェクトプール**で管理（GCスパイク防止）
- 敵の見た目は**オフスクリーンcanvasスプライトキャッシュ**＋画面外カリング
- グロー表現は `shadowBlur` を使わず**事前描画した光暈スプライト＋加算合成**（高速）
- 背景はネビュラ＋パララックス2層の浮遊塵＋ビネット（すべて手続き生成、画像アセットゼロ）
- 効果音は WebAudio 直叩きの軽量シンセ（外部アセットゼロ）

```
src/
├── main.ts            エントリ：RAF + 固定ステップループ
├── game.ts            状態機械 (Title / Playing / LevelUp / Evolution / Result)
├── core/              vec2 / rng(シード可) / pool / spatialHash / camera / input / audio
├── data/              武器・パッシブ・クラス進化ツリー・敵・Wave・i18n（純データ）
├── entities/          player / enemy(AI) / bullet / gem / pickup / bot(疑似PvP)
├── systems/           weaponSystem / collision / waveDirector / fog / levelUp(3択) /
│                      skills / particles / juice / meta(ローカルランキング)
├── render/            renderer / shapes / hud(ミニマップ含む)
└── ui/                DOMオーバーレイ（タイトル / 3択 / 進化 / リザルト）
```

バランス調整は `src/data/` の数値を書き換えるだけで完結する（コード変更不要）。

## 設計ドキュメント

ゲームデザインの全体像（コンセプト・成長システム・PvP/PvE バランス・マネタイズ・
ロードマップ）は企画書『EVOLVORE』を参照。本リポジトリはその **Day1〜7 MVP** に相当：
武器7種＋超進化3種 / パッシブ6種 / 敵7種＋ボス2体 / クラス進化16種（Lv10/20/30）/
霧収縮 / ボット捕食者 / ジュース全部盛り / ローカルランキング / 日英UI。

次フェーズ: WebSocket リアルタイムマルチ（サーバー権威）→ 企画書 §19 参照。
