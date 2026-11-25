# PopContext

[日本語](#popcontext---日本語) | [English](#popcontext---english)

[デモ](https://guri-sharp.github.io/pop-context/demo/) | [Ko-fi で支援](https://ko-fi.com/guri01)

---

# PopContext - 日本語

軽量・高機能・アクセシビリティ対応のモダンな JavaScript コンテキストメニュー / ポップアップライブラリです。

マウス右クリック、要素の左クリック、モバイルでの長押し操作に対応し、**吹き出しの尻尾（Arrow / Triangle）表示**、**カスタム枠（`customContent`）**、自動位置補正（Auto-Flip）、キーボードナビゲーションを標準でサポートしています。

---

## ✨ 主な特徴

- 💬 **吹き出しの尻尾（Arrow）表示**: `arrow: true` オプションで、ツールチップや吹き出しのような矢印が付いたポップアップ表示が可能。
- 📦 **カスタム枠（`customContent`）**: リスト以外の任意の HTML や外部ピッカー（カラーピッカー / 日付選択など）を枠内に自由に埋め込み可能。
- 🚀 **マルチトリガー対応**: 右クリック（`contextmenu`）、左クリック（`click`）、モバイル端末の長押し（`longpress`）に対応。
- 📐 **スマートな表示補正 (Auto-Flip)**: 画面端からはみ出さないよう、メニューや矢印の位置を自動反転・マージン補正。
- ♿ **アクセシビリティ対応**: WAI-ARIA 属性やキーボード操作（`↑`/`↓`/`←`/`→`/`Escape`）に対応。

---

## 📦 導入方法

```html
<link rel="stylesheet" href="pop-context.css">
<script src="pop-context.js"></script>
```

---

## 🚀 使い方とサンプルコード

### 1. 吹き出しの尻尾（Arrow）付き絵文字リアクションピッカー
```javascript
new PopContext('.target', {
  trigger: 'click',
  layout: 'grid',
  columns: 5,
  arrow: true, // 吹き出しの尻尾を表示
  className: 'pc-pill',
  items: [
    { icon: '👍', onClick: () => console.log('👍') },
    { icon: '❤️', onClick: () => console.log('❤️') },
    { icon: '😂', onClick: () => console.log('😂') },
    { icon: '😮', onClick: () => console.log('😮') },
    { icon: '🔥', onClick: () => console.log('🔥') }
  ]
});
```

### 2. カスタム枠（`customContent`）で自作フォームやピッカーを表示
```javascript
new PopContext('#color-btn', {
  trigger: 'click',
  arrow: true,
  customContent: `
    <div style="padding: 12px;">
      <h4 style="margin: 0 0 8px 0; font-size: 13px;">色を選択</h4>
      <button onclick="selectColor('red')">🔴 Red</button>
      <button onclick="selectColor('blue')">🔵 Blue</button>
    </div>
  `
});
```

---

## 📖 API リファレンス

| オプション | 型 | 初期値 | 説明 |
| :--- | :--- | :--- | :--- |
| `items` | `Array<Object>` | `[]` | メニュー項目の配列 |
| `layout` | `'list'` \| `'grid'` | `'list'` | 表示レイアウト |
| `columns` | `number` | `3` | グリッドレイアウト時の列数 |
| `trigger` | `'contextmenu'` \| `'click'` \| `'longpress'` | `'contextmenu'` | 起動トリガー |
| `arrow` | `boolean` | `false` | 吹き出しの尻尾（矢印）を表示するか |
| `customContent` | `string` \| `HTMLElement` \| `Function` | `null` | メニュー内を自由なHTMLや要素で置き換えるカスタム枠 |
| `theme` | `'default'` \| `'dark'` | `'default'` | カラーテーマ |
| `autoFlip` | `boolean` | `true` | 画面端での自動位置反転補正 |

---

# PopContext - English

Lightweight, accessible, multi-trigger custom context menu & popup library in vanilla JavaScript.

Supports right-click, left-click, long-press triggers, **speech bubble arrows**, **custom container frames (`customContent`)**, auto-flipping position correction, and full keyboard navigation.

---

## ✨ Features

- 💬 **Speech Bubble Arrow**: Enable `arrow: true` to show a triangle/tail pointing to the trigger target.
- 📦 **Custom Content Container**: Render custom HTML or external pickers inside the popup.
- 🚀 **Multi-Trigger**: Supports `contextmenu` (right-click), `click`, and `longpress` (mobile).
- 📐 **Auto-Flip**: Automatically flips and clamps position when hitting screen edges.
- ♿ **Accessible**: WAI-ARIA compliant with keyboard navigation (`Arrow keys`, `Escape`, `Enter`).

---

## 🚀 Quick Start

```javascript
new PopContext('#target', {
  trigger: 'click',
  arrow: true,
  layout: 'grid',
  columns: 5,
  items: [
    { icon: '👍', onClick: () => console.log('Liked!') },
    { icon: '❤️', onClick: () => console.log('Hearted!') }
  ]
});
```

---

## 📄 License

MIT License
