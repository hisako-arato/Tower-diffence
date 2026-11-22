# キャラ画像の差し替え・追加

このフォルダの画像は、SVGのオリジナルアートの代わりに表示されます。

## 手順
※ GitHub から画像をアップロードするときは `assets/chars/` フォルダに入れると整理しやすくなります（リポジトリ直下でも取り込めます）。

1. 画像を用意する（背景は透明が望ましい。黒背景の場合は背景除去してから置く）
2. このフォルダに置く（例：`lydia.webp`。WebP/PNG推奨、長辺720px程度）
3. `js/art.js` の `TD.CUSTOM_ART` に1行追加する
   ```js
   lydia: { src: 'assets/chars/lydia.webp', ratio: 1.5, face: [0.5, 0.2, 0.5] },
   ```
   - `ratio`：画像の 高さ ÷ 幅
   - `face`：丸いアイコンに使う範囲 [顔の中心x, 顔の中心y, 切り抜く幅]（画像の幅・高さに対する割合）
4. `sw.js` の `VERSION` を上げ、`ASSETS` に画像を追加してから公開する

画像はWeb上で誰でもダウンロードできる状態になります。利用規約で「Webゲームでの使用」が認められているものだけを使ってください。

## 登録済み
| ファイル | キャラ | 元画像 |
|---|---|---|
| meltia.webp | メルティア（★5 闇・癒） | AI生成（背景除去：isnet-anime） |
| kagura.webp | カグラ（★5 火・盾） | AI生成（背景除去：isnet-anime） |
| nereia.webp | ネレイア（★5 闇・魔） | AI生成（背景除去：BiRefNet） |
| akane.webp | アカネ（★4 風・剣） | AI生成（背景除去：isnet-anime） |
| shizuku.webp | シズク（★4 闇・弓） | AI生成（背景除去：isnet-anime） |
| sylphina.webp | シルフィナ（★5 風・魔） | AI生成（背景除去：isnet-anime） |
| seira.webp | セイラ（★5 水・剣） | AI生成（背景除去：BiRefNet） |
| xeno.webp | ゼノ（★4 闇・盾） | AI生成（背景除去：BiRefNet） |
| karin.webp | カリン（★4 火・癒） | AI生成（背景除去：BiRefNet） |
| shigure.webp | シグレ（★4 水・弓） | AI生成・オリジナル（背景除去：isnet-anime） |
| lydia.webp | リディア（★5 光・剣） | AI生成（背景除去：BiRefNet） |
| soyo.webp | ソヨ（★3 風・癒） | AI生成（背景除去：isnet-anime） |
| hayate.webp | ハヤテ（★3 風・剣） | AI生成（背景除去：BiRefNet） |
| zephyr.webp | ゼファー（★4 風・弓） | AI生成（背景除去：isnet-anime） |
| viola.webp | ヴィオラ（★3 闇・魔） | AI生成（背景除去：BiRefNet） |
| aster.webp | アステル（★4 光・盾） | AI生成（背景除去：BiRefNet） |
