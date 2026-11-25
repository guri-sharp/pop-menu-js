# Changelog

## 2.5.0

- Added element-based anchors, placement options, boundaries, and manual controls.
- Added same-trigger toggle behavior, trigger default-action control, and target ARIA synchronization.
- Added item and option updates that preserve custom content, plus idempotent `destroy()`.
- Added scroll/resize repositioning options and configurable theme, arrow, and z-index styling.
- `updateItems()` remains supported and now delegates to `setItems()`; it no longer clears `customContent`.
- Existing pointer positioning and default hide-on-scroll/resize behavior remain the defaults.
