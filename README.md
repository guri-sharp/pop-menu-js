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
- 🔎 **type-ahead と RTL**: 文字入力でメニュー項目を検索し、`dir="rtl"` に合わせて配置とグリッド操作を反転。
- 🏷️ **宣言的利用**: データ属性と `<template>` からメニューを作り、`autoInit()` で委譲初期化。
- 📱 **ボトムシート**: 背景オーバーレイとドラッグハンドル付きのシート表示を選択可能。

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
| `presentation` | `'popover'` \| `'sheet'` | `'popover'` | 表示形式。`sheet` は画面下部に固定 |
| `backdrop` | `boolean` | `true` | `sheet` 表示時に背景オーバーレイを表示 |
| `swipeToDismiss` | `boolean` | `true` | `sheet` のドラッグハンドルを下へスワイプして閉じる |
| `trigger` | `'contextmenu'` \| `'click'` \| `'longpress'` \| `'manual'` | `'contextmenu'` | 起動トリガー |
| `delegate` | `string` \| `null` | `null` | 親要素上で動的な子要素のイベントを委譲する CSS セレクター |
| `longPressDuration` | `number` | `500` | 長押し成立までの時間（ms） |
| `longPressMoveTolerance` | `number` | `10` | この距離を超えて移動した場合に長押しをキャンセル（px） |
| `haptic` | `boolean` | `false` | 長押し成立時に対応環境で短く振動 |
| `arrow` | `boolean` | `false` | 吹き出しの尻尾（矢印）を表示するか |
| `customContent` | `string` \| `HTMLElement` \| `Function` | `null` | メニュー内を自由なHTMLや要素で置き換えるカスタム枠 |
| `theme` | `'default'` \| `'dark'` \| `'none'` | `'default'` | カラーテーマ |
| `autoFlip` | `boolean` | `true` | 画面端での自動位置反転補正 |
| `offset` | `{ x: number, y: number }` | `{ x: 0, y: 0 }` | 配置位置の補正 |
| `anchor` | `'pointer'` \| `'element'` | `'pointer'` | 座標またはトリガー要素を基準に配置 |
| `placement` | `string` | `'bottom-start'` | 配置方向（例: `bottom-start`, `top-end`, `right-start`, `auto`） |
| `viewportPadding` | `number` | `8` | 境界から確保する最小余白（px） |
| `boundary` | `Element` \| `null` | `null` | 配置境界。省略時は表示領域 |
| `toggle` | `boolean` | `false` | 同じトリガーを再操作したときに閉じる |
| `preventDefaultTrigger` | `boolean` | `true` | click トリガーの既定動作を抑止 |
| `followScroll` / `followResize` | `boolean` | `false` | `hideOnScroll` / `hideOnResize` を `false` にした場合に追従 |
| `hideOnScroll` / `hideOnResize` | `boolean` | `true` | スクロール／リサイズ時に閉じる（追従より優先） |
| `closeOnSelect` / `closeOnOutsideClick` / `closeOnEscape` | `boolean` | `true` | 各操作時にメニューを閉じる |
| `openClass` | `string` | `''` | 表示中にターゲットへ付けるクラス |
| `syncHidden` | `boolean` | `false` | `menuEl.hidden` を表示状態に同期 |
| `zIndex` | `number` | `999999` | メニューの z-index |
| `arrowOffset` | `number` \| `null` | `null` | 矢印の水平位置（px） |
| `aria` | `object` | `{ haspopup: 'menu', controls: null, expanded: true }` | トリガーに付与する ARIA 属性を制御 |
| `ariaLabel` | `string` | `''` | メニューの `aria-label` |
| `role` | `string` \| `null` | `null` | メニューの role。未指定時は items が `menu`、customContent が `dialog` |
| `emptyText` | `string` | `''` | 有効な項目がない場合に表示する文言 |
| `onBeforeShow` | `Function` \| `null` | `null` | 表示直前に呼び出すフック |

`trigger` には `'manual'` も指定できます。手動トリガーでは要素イベントを登録せず、`show()` / `hide()` で制御します。`anchor: 'element'` と組み合わせる場合は `setTarget(element)` で表示基準を切り替えられます。

```javascript
const menu = new PopContext('#actions', {
  trigger: 'manual',
  anchor: 'element',
  placement: 'bottom-start',
  items: [{ label: '編集', onClick: () => {} }]
});
menu.setTarget(document.querySelector('#row-1'));
menu.show();
```

### 項目スキーマ

```javascript
{
  id: 'archive',
  label: 'Archive',
  icon: 'fa-solid fa-box-archive',
  shortcut: 'A',
  role: 'menuitemcheckbox', // 'menuitem' | 'menuitemradio' | 'menuitemcheckbox'
  checked: false,
  disabled: false,
  hidden: false,
  danger: false,
  className: '',
  onClick: (item, event, instance) => {}
}
```

項目には `divider: true` または `group: '見出し'` を指定できます。`html` は HTML 文字列をそのまま挿入するため、信頼できる内容だけを指定してください。`element` には `HTMLElement` を渡せます。ノードはメニュー内へ移動し、`destroy()` 時に元の親へは戻りません。また、この項目にはライブラリのクリックハンドラーを付けないため、フォームやボタンの既定動作を妨げません。`checked` は `.is-checked` と `aria-checked` に反映されます。`id` が一致し、新しい項目で `checked` が省略された場合は、既存の checked 状態を引き継ぎます。

`customContent` の既定 role は `dialog` です。表示時は items なら最初の有効項目、customContent なら最初のフォーカス可能な要素へフォーカスします。dialog 内の `Tab` はフォーカスを内部に保ち、menu の `Tab` は閉じてトリガーへ戻ります。`Escape` でも閉じてフォーカスを戻します。

### インスタンスメソッド

| メソッド | 説明 |
| :--- | :--- |
| `show(x, y)` / `hide()` | 表示・非表示。既定の pointer 配置では `show(x, y)` で座標を指定 |
| `toggle()` / `isVisible()` | 表示状態の切り替え・確認 |
| `setTarget(element)` | トリガー／アンカー要素を差し替え |
| `setItems(items)` / `updateItems(items)` | 項目を更新。`updateItems` は互換用エイリアス |
| `setCustomContent(content)` | カスタム内容を更新。`null` で `items` 表示に戻す |
| `setOptions(patch)` | オプションを部分更新（`items` と `customContent` は専用メソッドを使用） |
| `reposition()` | 現在のアンカーに合わせて再配置 |
| `destroy()` | リスナー、DOM、ライブラリが付与した属性を解放・復元 |

### 宣言的初期化

```html
<button data-pop-context
        data-pop-context-items="#actions-template"
        data-pop-context-placement="bottom-start">操作</button>

<template id="actions-template">
  <div data-pop-item><span data-pop-label>編集</span></div>
  <div data-pop-item data-pop-disabled="true">
    <span data-pop-label>利用不可</span>
  </div>
</template>
```

```javascript
const declarativeMenu = PopContext.autoInit(document);
PopContext.autoDestroy(document);
```

`autoInit(root)` は明示的に呼び出してください。root 内の `[data-pop-context]` 要素を click トリガーとして委譲し、後から追加された要素にも対応します。一致する要素がまだないrootでも初期化でき、同じrootへの再呼び出しでは既存インスタンスを返します。重複した委譲を避けるため、重なり合うrootを別々に初期化しないでください。各ボタンの `data-pop-context-items` は `<template>` のセレクター、`data-pop-context-placement` は配置を指定します。指定したセレクターが `<template>` に一致しない場合、表示時にエラーになります。テンプレート内では `[data-pop-item]` が項目、`[data-pop-label]` がラベルです。`data-pop-role` / `data-pop-checked` / `data-pop-disabled` / `data-pop-hidden` / `data-pop-danger` / `data-pop-icon` / `data-pop-shortcut` も指定できます。`data-pop-divider` と `data-pop-group` は区切りと見出しです。自動初期化は既定では実行されません。`autoDestroy(root)` は指定rootのインスタンスを破棄し、引数なしでは自動初期化した全インスタンスを破棄します。

### ボトムシート

```javascript
new PopContext('#share', {
  trigger: 'click',
  presentation: 'sheet',
  backdrop: true,
  swipeToDismiss: true,
  items: [{ label: 'リンクをコピー' }, { label: '共有' }]
});
```

`presentation: 'sheet'` は明示指定で有効になり、既存の popover 表示は変わりません。シートは画面下部に固定され、長い内容はシート内でスクロールします。表示時は下からスライドしてフェードインし、閉じる時は下へスライドしてフェードアウトします。`prefers-reduced-motion` が有効な環境ではアニメーションを抑えます。既定の背景オーバーレイはクリックで閉じ、上部ハンドルを下へドラッグしても閉じられます。`backdrop` と `swipeToDismiss` は個別に無効化できます。

menu 表示中に文字を入力すると、有効項目のラベルを先頭一致で検索します。連続した同じ文字は候補を順送りし、入力バッファは500ms後にリセットされます。`document.dir === 'rtl'` の場合は `-start` / `-end` の配置とグリッドの左右キーを反転します。

`setItems()` は `customContent` を変更しません。カスタム内容と項目表示の切り替えは `setCustomContent()` で行ってください。`theme: 'none'` ではテーマクラスを付けず、`.pop-context-menu` 上の `--pc-*` CSS 変数を利用できます。

---

# PopContext - English

PopContext is a lightweight, dependency-free JavaScript library for context menus and popups. It supports pointer, element, and manually controlled anchors, with keyboard interaction and ARIA state management.

Right-click, click, and long-press triggers are supported, along with custom content, optional arrows, automatic placement adjustments, and reusable menu instances.

---

## ✨ Features

- **Flexible triggers:** Use `contextmenu`, `click`, `longpress`, or `manual`.
- **Element positioning:** Place a menu relative to its trigger with `anchor` and `placement`; menus can flip or clamp at the viewport edge.
- **Custom content and layouts:** Render a list, grid, or custom content such as a form or picker.
- **Reusable controls:** Retarget one instance with `setTarget()`, and update its items or options without recreating it.
- **Accessibility:** Synchronize trigger ARIA attributes, navigate menu items with the keyboard, and restore trigger attributes on `destroy()`.
- **Type-ahead and RTL:** Find menu items by typing; placement alignment and grid arrow navigation follow the document direction.
- **Declarative setup:** Initialize delegated triggers and `<template>` items from data attributes with `PopContext.autoInit()`.
- **Bottom sheets:** Opt in to a fixed bottom panel with a backdrop and swipe-to-dismiss handle.
- **No runtime dependencies:** Use the library directly from its JavaScript and CSS files.

---

## 📦 Installation

```html
<link rel="stylesheet" href="pop-context.css">
<script src="pop-context.js"></script>
```

## 🚀 Quick Start

```javascript
new PopContext('#target', {
  trigger: 'click',
  items: [
    { label: 'Edit', onClick: () => console.log('Edit') },
    { label: 'Delete', danger: true, onClick: () => console.log('Delete') }
  ]
});
```

## 🎯 Element Anchors and Placement

The default `anchor: 'pointer'` preserves coordinate-based positioning. Use `anchor: 'element'` to position the popup relative to its trigger:

```javascript
new PopContext('#actions', {
  trigger: 'click',
  anchor: 'element',
  placement: 'bottom-start',
  offset: { x: 0, y: 8 },
  toggle: true,
  items: [{ label: 'Edit', onClick: () => console.log('Edit') }]
});
```

Supported placements include `top`, `bottom`, `left`, and `right`, with `-start` or `-end` alignment (for example, `bottom-start` or `right-end`). Use `placement: 'auto'` to choose the side with the most available space. `boundary` can be set to an element; otherwise, the viewport is used.

## 🧩 Manual Control

With `trigger: 'manual'`, PopContext does not register trigger event listeners. Open and close the menu from your own code:

```javascript
const menu = new PopContext('#actions', {
  trigger: 'manual',
  anchor: 'element',
  placement: 'bottom-start',
  items: [{ label: 'Edit', onClick: () => console.log('Edit') }]
});

menu.setTarget(document.querySelector('#row-1'));
menu.show();
```

## 📖 API Reference

### Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `items` | `Array<Object>` | `[]` | Menu item definitions. |
| `layout` | `'list'` \| `'grid'` | `'list'` | Item layout. |
| `columns` | `number` | `3` | Number of columns for a grid layout. |
| `presentation` | `'popover'` \| `'sheet'` | `'popover'` | Presentation style. `'sheet'` pins the panel to the bottom of the viewport. |
| `backdrop` | `boolean` | `true` | Show a backdrop for sheet presentation. |
| `swipeToDismiss` | `boolean` | `true` | Allow dismissing a sheet by dragging its handle downward. |
| `trigger` | `'contextmenu'` \| `'click'` \| `'longpress'` \| `'manual'` | `'contextmenu'` | How the menu is opened. |
| `longPressDuration` | `number` | `500` | Hold duration in milliseconds for the `longpress` trigger. |
| `longPressMoveTolerance` | `number` | `10` | Cancel a long press when the pointer moves farther than this distance, in pixels. |
| `haptic` | `boolean` | `false` | Request a short vibration when a long press succeeds, if supported. |
| `delegate` | `string` \| `null` | `null` | CSS selector for event delegation from the target element or document. |
| `customContent` | `string` \| `HTMLElement` \| `Function` \| `null` | `null` | Custom content rendered inside the popup. Pass only trusted HTML strings. |
| `anchor` | `'pointer'` \| `'element'` | `'pointer'` | Position relative to pointer coordinates or the trigger element. |
| `placement` | `string` | `'bottom-start'` | Preferred side and alignment, or `'auto'`. |
| `offset` | `{ x: number, y: number }` | `{ x: 0, y: 0 }` | Position adjustment in pixels. |
| `autoFlip` | `boolean` | `true` | Flip to the opposite side when there is not enough space. |
| `viewportPadding` | `number` | `8` | Minimum gap from the positioning boundary, in pixels. |
| `boundary` | `Element` \| `null` | `null` | Positioning boundary. Defaults to the viewport. |
| `toggle` | `boolean` | `false` | Close the menu when its open trigger is activated again. |
| `preventDefaultTrigger` | `boolean` | `true` | Prevent the default action for a `click` trigger. `contextmenu` is always prevented. |
| `hideOnScroll` / `hideOnResize` | `boolean` | `true` | Close the menu on scroll or resize. These take precedence over repositioning. |
| `followScroll` / `followResize` | `boolean` | `false` | Reposition while scrolling or resizing when the corresponding hide option is disabled. |
| `openClass` | `string` | `''` | Class added to the active trigger while the menu is open. |
| `syncHidden` | `boolean` | `false` | Synchronize `menuEl.hidden` with the menu visibility. |
| `closeOnSelect` / `closeOnOutsideClick` / `closeOnEscape` | `boolean` | `true` | Close the menu for the corresponding interaction. |
| `theme` | `'default'` \| `'dark'` \| `'none'` | `'default'` | Visual theme. `'none'` omits the theme class. |
| `className` | `string` | `''` | Additional class name for the popup. |
| `arrow` | `boolean` | `false` | Show the optional arrow. |
| `arrowOffset` | `number` \| `null` | `null` | Arrow position in pixels; `null` centers it on the anchor. |
| `zIndex` | `number` | `999999` | Popup stacking order. |
| `aria` | `object` | `{ haspopup: 'menu', controls: null, expanded: true }` | Configure ARIA attributes managed on the trigger. Existing `aria-controls` values are preserved. |
| `ariaLabel` | `string` | `''` | Accessible label applied to the popup. |
| `role` | `string` \| `null` | `null` | Popup role. Defaults to `menu` for items and `dialog` for custom content. |
| `emptyText` | `string` | `''` | Message shown when there are no enabled items. |
| `onBeforeShow` | `Function` \| `null` | `null` | Called immediately before the menu opens. |
| `onShow` / `onHide` / `onSelect` | `Function` \| `null` | `null` | Lifecycle and item-selection callbacks. |

### Instance Methods

| Method | Description |
| :--- | :--- |
| `show(x, y)` / `hide()` | Open or close the menu. In the default pointer mode, pass coordinates to `show(x, y)`. |
| `toggle()` / `isVisible()` | Toggle the menu or check whether it is open. |
| `setTarget(element)` | Replace the trigger or element anchor. |
| `setItems(items)` / `updateItems(items)` | Replace the items. `updateItems()` remains as a compatibility alias. |
| `setCustomContent(content)` | Replace custom content; pass `null` to return to the item list. |
| `setOptions(patch)` | Shallow-merge option updates. Use the dedicated methods to update `items` or `customContent`. |
| `reposition()` | Recalculate the current position. |
| `destroy()` | Remove the popup and listeners, and restore attributes managed by the instance. Safe to call more than once. |

### Declarative Initialization

```html
<button data-pop-context
        data-pop-context-items="#actions-template"
        data-pop-context-placement="bottom-start">Actions</button>

<template id="actions-template">
  <div data-pop-item><span data-pop-label>Edit</span></div>
  <div data-pop-item data-pop-disabled="true">
    <span data-pop-label>Unavailable</span>
  </div>
</template>
```

```javascript
const declarativeMenu = PopContext.autoInit(document);
PopContext.autoDestroy(document);
```

Call `autoInit(root)` explicitly; it delegates click handling for `[data-pop-context]` elements in the root, including matching elements added later. It can be called before any matching elements exist, and repeated calls with the same root return the existing instance. Avoid initializing overlapping roots to prevent duplicate delegated handlers. Each trigger can select a `<template>` with `data-pop-context-items` and choose a placement with `data-pop-context-placement`; a specified selector that does not resolve to a template causes an error when the menu opens. Inside the template, `[data-pop-item]` marks an item and `[data-pop-label]` provides its label. Supported item attributes include `data-pop-role`, `data-pop-checked`, `data-pop-disabled`, `data-pop-hidden`, `data-pop-danger`, `data-pop-icon`, and `data-pop-shortcut`; use `data-pop-divider` and `data-pop-group` for separators and group labels. No automatic initialization runs unless requested. `autoDestroy(root)` destroys the instance for that exact root; without a root, it destroys all declaratively initialized instances.

### Bottom Sheets

```javascript
new PopContext('#share', {
  trigger: 'click',
  presentation: 'sheet',
  backdrop: true,
  swipeToDismiss: true,
  items: [{ label: 'Copy link' }, { label: 'Share' }]
});
```

The sheet presentation is opt-in and does not change existing popovers. It pins the panel to the bottom of the viewport and scrolls long content within the panel. It slides and fades in from the bottom when opening, then slides down and fades out when closing. Animations are reduced when `prefers-reduced-motion` is enabled. By default, the backdrop closes the sheet when clicked, and dragging the top handle downward also dismisses it. Disable either behavior with `backdrop: false` or `swipeToDismiss: false`.

While a menu is open, typing searches enabled labels by prefix. Repeating a character cycles through matching items, and the search buffer resets after 500 ms. When `document.dir` is `rtl`, `-start` / `-end` placement and horizontal grid-key navigation are reversed.

`setItems()` does not clear or replace `customContent`. Use `setCustomContent()` to switch between custom content and the item list. With `theme: 'none'`, customize the popup using the `--pc-*` CSS variables defined on `.pop-context-menu`.

### Item Schema

```javascript
{
  id: 'archive',
  label: 'Archive',
  icon: 'fa-solid fa-box-archive',
  shortcut: 'A',
  role: 'menuitemcheckbox', // 'menuitem' | 'menuitemradio' | 'menuitemcheckbox'
  checked: false,
  disabled: false,
  hidden: false,
  danger: false,
  className: '',
  onClick: (item, event, instance) => {}
}
```

Use `{ divider: true }` for a separator or `{ group: 'Heading' }` for a group label. The `html` field is inserted without sanitization; only use trusted HTML. The `element` field accepts an `HTMLElement`, which is moved into the popup and is not returned to its original parent by `destroy()`. Items with `element` do not receive a library click handler, so native form and button behavior is preserved. `checked` updates `.is-checked` and `aria-checked`. When an updated item has the same `id` and omits `checked`, its previous checked state is retained.

Custom content defaults to `role: 'dialog'`. On open, focus moves to the first enabled item or the first focusable custom-content element. `Tab` stays within a dialog; in a menu it closes the popup and returns focus to the trigger. `Escape` also closes the popup and restores focus.

---

## 📄 License

MIT License
