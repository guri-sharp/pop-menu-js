# Changelog

## 2.7.0

- Added explicit declarative initialization and cleanup through `PopContext.autoInit()` and `autoDestroy()`.
- Added `<template>`-based menu item definitions through data attributes.
- Added menu type-ahead search and RTL-aware placement and grid keyboard navigation.

## 2.6.0

- Added movement-aware long-press handling, optional haptic feedback, and suppression of the follow-up click/context menu.
- Added selector-based event delegation for dynamic targets.
- Added custom-content role defaults, dialog focus management, and expanded keyboard navigation.
- Added rich menu items: HTML or element content, groups, hidden items, checked states, empty text, and item IDs.

## 2.5.0

- Added element-based anchors, placement options, boundaries, and manual controls.
- Added same-trigger toggle behavior, trigger default-action control, and target ARIA synchronization.
- Added item and option updates that preserve custom content, plus idempotent `destroy()`.
- Added scroll/resize repositioning options and configurable theme, arrow, and z-index styling.
- `updateItems()` remains supported and now delegates to `setItems()`; it no longer clears `customContent`.
- Existing pointer positioning and default hide-on-scroll/resize behavior remain the defaults.
