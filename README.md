# PopContext

[日本語](#popcontext---日本語) | [English](#popcontext---english)

---

## PopContext - 日本語

軽量・高機能・アクセシビリティ対応のモダンな JavaScript コンテキストメニュー（右クリック / 長押し / タップ / リアクションピッカー）ライブラリです。

マウス右クリック、要素の左クリック、モバイルでの長押し操作に柔軟に対応し、自動位置補正（Auto-Flip）、キーボードナビゲーション、XSS対策、メモリ管理を標準でサポートしています。

### ✨ 主な特徴

- 🚀 **マルチトリガー対応**: 右クリック（`contextmenu`）、左クリック（`click`）、モバイル端末の長押し（`longpress`）に対応。
- 📐 **スマートな表示補正 (Auto-Flip)**: 画面端からはみ出さないよう、メニューの位置を自動で上下左右に反転・マージン補正。
- ♿ **アクセシビリティ（a11y）対応**: WAI-ARIA 属性（`role="menu"`, `role="menuitem"`）やキーボード操作（`↑`/`↓`/`←`/`→`/`Home`/`End`/`Enter`/`Escape`）に対応。
- 🛡️ **XSS 対策済み**: SVG パース時の `<script>` 除去やテキストエスケープ処理により、セキュアにアイコンやラベルを描画。
- 🧹 **メモリリークフリー**: インスタンス破棄（`destroy()`）時にイベントリスナーや参照を完全にクリーンアップ。
- 🎨 **柔軟なレイアウト**: リスト表示・グリッド表示（テーブル風 / リアクションピッカー）に対応。CSS 変数（`--pc-*`）による簡単カスタマイズ。
- 🛡️ **スコープ保護**: CSS クラス名に `.pc-` プレフィックスを採用し、外部ライブラリとのスタイル競合を防止。

### 📦 導入方法

```html
<!-- CSSの読み込み -->
<link rel="stylesheet" href="pop-context.css">

<!-- JavaScriptの読み込み -->
<script src="pop-context.js"></script>
```

※ npm / ES Module 環境の場合:
```javascript
import PopContext from './pop-context.js';
import './pop-context.css';
```

### 🚀 クイックスタート

```javascript
// 基本的なコンテキストメニューの初期化
const menu = new PopContext('.my-target-element', {
  theme: 'default',
  items: [
    { label: '編集', icon: 'fa fa-edit', shortcut: 'Ctrl+E', onClick: (item) => console.log('Edit clicked') },
    { label: 'コピー', icon: 'fa fa-copy', shortcut: 'Ctrl+C', onClick: (item) => console.log('Copy clicked') },
    { divider: true },
    { label: '削除', icon: 'fa fa-trash', danger: true, onClick: (item) => console.log('Delete clicked') }
  ]
});
```

### 💡 サンプルコード集

#### 1. 絵文字リアクションピッカー（ピル型・横並び5個）

```javascript
new PopContext('.message-item', {
  layout: 'grid',
  columns: 5,
  trigger: 'click',
  className: 'pc-pill-reaction',
  items: [
    { icon: '👍', onClick: () => console.log('👍') },
    { icon: '❤️', onClick: () => console.log('❤️') },
    { icon: '😂', onClick: () => console.log('😂') },
    { icon: '😮', onClick: () => console.log('😮') },
    { icon: '🔥', onClick: () => console.log('🔥') }
  ]
});
```

#### 2. モバイル向け長押し（Long Press）メニュー

```javascript
new PopContext('.mobile-card', {
  trigger: 'longpress',
  longPressDuration: 400,
  items: [
    { label: '保存', icon: 'fa fa-bookmark', onClick: () => {} },
    { label: '共有', icon: 'fa fa-share', onClick: () => {} }
  ]
});
```

### 📖 API リファレンス

#### コンストラクタ
```javascript
const instance = new PopContext(target, options);
```

##### `target` (必須)
- `string`: CSS セレクタ（例: `'.target'`, `#app`）
- `HTMLElement`: 対象となる DOM 要素
- `NodeList` / `Array<HTMLElement>`: 複数の DOM 要素

##### `options` (任意)

| オプション | 型 | 初期値 | 説明 |
| :--- | :--- | :--- | :--- |
| `items` | `Array<Object>` | `[]` | メニュー項目の配列 |
| `layout` | `'list'` \| `'grid'` | `'list'` | 表示レイアウト |
| `columns` | `number` | `3` | グリッドレイアウト時の列数 |
| `trigger` | `'contextmenu'` \| `'click'` \| `'longpress'` | `'contextmenu'` | メニューを開くトリガー |
| `longPressDuration` | `number` | `500` | 長押し判定時間（ミリ秒） |
| `theme` | `'default'` \| `'dark'` | `'default'` | カラーテーマ |
| `className` | `string` | `''` | カスタム CSS クラス |
| `offset` | `{ x: number, y: number }` | `{ x: 0, y: 0 }` | 座標オフセット |
| `hideOnScroll` | `boolean` | `true` | スクロール時に閉じるか |
| `hideOnResize` | `boolean` | `true` | リサイズ時に閉じるか |
| `autoFlip` | `boolean` | `true` | 自動反転補正を行うか |
| `onShow` | `Function` | `null` | 表示時コールバック `({x, y}) => {}` |
| `onHide` | `Function` | `null` | 非表示時コールバック `() => {}` |
| `onSelect` | `Function` | `null` | 項目選択時コールバック `(item, event) => {}` |

---

## PopContext - English

Lightweight, feature-rich, and accessible JavaScript custom context menu library for mouse, touch, and reaction pickers.

### ✨ Features

- 🚀 **Multi-Trigger Support**: Right-click (`contextmenu`), left-click (`click`), and touch long-press (`longpress`).
- 📐 **Smart Position Adjustment (Auto-Flip)**: Automatically flips and clamps position within viewport margins.
- ♿ **Accessible (a11y)**: Built with WAI-ARIA roles (`role="menu"`, `role="menuitem"`) and full keyboard navigation (`↑`/`↓`/`←`/`→`/`Home`/`End`/`Enter`/`Escape`).
- 🛡️ **XSS Protection**: Safe SVG sanitization and text escaping.
- 🧹 **Zero Memory Leaks**: Full event and reference cleanup on `destroy()`.
- 🎨 **Flexible Layouts**: Supports list, grid, and emoji reaction picker layouts with CSS variables (`--pc-*`).
- 🛡️ **Scoped Styling**: Prefixed CSS class names (`.pc-*`) to prevent style collisions.

### 📦 Installation

```html
<!-- Load CSS -->
<link rel="stylesheet" href="pop-context.css">

<!-- Load JavaScript -->
<script src="pop-context.js"></script>
```

ES Modules:
```javascript
import PopContext from './pop-context.js';
import './pop-context.css';
```

### 🚀 Quick Start

```javascript
const menu = new PopContext('.my-target-element', {
  theme: 'default',
  items: [
    { label: 'Edit', icon: 'fa fa-edit', shortcut: 'Ctrl+E', onClick: (item) => console.log('Edit clicked') },
    { label: 'Copy', icon: 'fa fa-copy', shortcut: 'Ctrl+C', onClick: (item) => console.log('Copy clicked') },
    { divider: true },
    { label: 'Delete', icon: 'fa fa-trash', danger: true, onClick: (item) => console.log('Delete clicked') }
  ]
});
```

### 💡 Code Examples

#### 1. Emoji Reaction Picker (Pill Shape / 5 Columns)

```javascript
new PopContext('.message-item', {
  layout: 'grid',
  columns: 5,
  trigger: 'click',
  className: 'pc-pill-reaction',
  items: [
    { icon: '👍', onClick: () => console.log('👍') },
    { icon: '❤️', onClick: () => console.log('❤️') },
    { icon: '😂', onClick: () => console.log('😂') },
    { icon: '😮', onClick: () => console.log('😮') },
    { icon: '🔥', onClick: () => console.log('🔥') }
  ]
});
```

### 📖 API Reference

#### Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `items` | `Array<Object>` | `[]` | Array of menu items |
| `layout` | `'list'` \| `'grid'` | `'list'` | Layout mode |
| `columns` | `number` | `3` | Number of columns in grid layout |
| `trigger` | `'contextmenu'` \| `'click'` \| `'longpress'` | `'contextmenu'` | Menu trigger event |
| `longPressDuration` | `number` | `500` | Long-press threshold in milliseconds |
| `theme` | `'default'` \| `'dark'` | `'default'` | Theme mode |
| `className` | `string` | `''` | Custom CSS class name |
| `offset` | `{ x: number, y: number }` | `{ x: 0, y: 0 }` | Coordinate offset |
| `hideOnScroll` | `boolean` | `true` | Hide menu on scroll |
| `hideOnResize` | `boolean` | `true` | Hide menu on window resize |
| `autoFlip` | `boolean` | `true` | Enable smart auto-flip positioning |
| `onShow` | `Function` | `null` | Callback on show `({x, y}) => {}` |
| `onHide` | `Function` | `null` | Callback on hide `() => {}` |
| `onSelect` | `Function` | `null` | Callback on item selection `(item, event) => {}` |

### 📄 License

MIT License
