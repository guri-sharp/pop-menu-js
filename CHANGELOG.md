# Changelog

## 3.1.0

- Made popover opening motion easier to notice while continuing to respect reduced-motion preferences.
- Added keyboard support for interactive element items and preserved focused item state across `setItems()` updates.
- Preserved scrollability when rerendering oversized popover menus.

## 3.0.1

- Fixed sheet close completion stalling until the fallback timer when the backdrop is removed during the closing animation (for example, `setOptions({ backdrop: false })` or a `presentation` change).

## 3.0.0

- **Breaking:** Renamed the package from `pop-context` to `pop-menu-js` and the public constructor/global from `PopContext` to `PopMenu`.
- **Breaking:** Renamed the stylesheet entry point, root class, CSS prefixes, and declarative attributes; no legacy aliases are provided.
- Added migration guidance to the README.

## 2.9.0

- Fixed sheets closing on internal scrolling and being dismissed by visual viewport changes.
- Added scroll locking, inert background handling, modal semantics, focus trapping, and a keyboard-accessible sheet handle.
- Added visual viewport repositioning, coordinated close-animation completion, velocity-aware swipe dismissal, and optional sheet detents.
- Added popover height constraints, IME-safe type-ahead, delegated-target ARIA cleanup, and `PopContext.instancesCount()`.
- Warned about positioning options that do not apply to sheet presentation.

## 2.8.0

- Added an opt-in bottom-sheet presentation with a backdrop and swipe-to-dismiss handle.
- Added subtle open/close motion for bottom sheets, respecting reduced-motion preferences.
- Restored focus before hiding focused menu content from assistive technology.

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
