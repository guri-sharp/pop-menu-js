/**
 * PopContext v2.5.0
 * Lightweight, accessible, multi-trigger custom context menu with element positioning.
 */
(function (global, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define(factory);
  } else {
    global.PopContext = factory();
  }
}(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  const instances = new Set();
  let globalEventsBound = false;
  let menuId = 0;

  function bindGlobalEvents() {
    if (globalEventsBound || typeof window === 'undefined') return;
    globalEventsBound = true;
    window.addEventListener('click', handleGlobalClick, true);
    window.addEventListener('contextmenu', handleGlobalContextMenu, true);
    window.addEventListener('touchstart', handleGlobalTouchStart, { passive: true });
    window.addEventListener('scroll', handleGlobalScroll, { passive: true, capture: true });
    window.addEventListener('resize', handleGlobalResize, { passive: true });
    window.addEventListener('keydown', handleGlobalKeyDown, true);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleGlobalResize, { passive: true });
      window.visualViewport.addEventListener('scroll', handleGlobalScroll, { passive: true });
    }
  }

  function unbindGlobalEvents() {
    if (!globalEventsBound || instances.size > 0) return;
    globalEventsBound = false;
    window.removeEventListener('click', handleGlobalClick, true);
    window.removeEventListener('contextmenu', handleGlobalContextMenu, true);
    window.removeEventListener('touchstart', handleGlobalTouchStart);
    window.removeEventListener('scroll', handleGlobalScroll, true);
    window.removeEventListener('resize', handleGlobalResize);
    window.removeEventListener('keydown', handleGlobalKeyDown, true);
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', handleGlobalResize);
      window.visualViewport.removeEventListener('scroll', handleGlobalScroll);
    }
  }

  function isInsideTarget(inst, target) {
    return inst.targetEls.some(el => el === target || el.contains(target));
  }

  function handleGlobalClick(e) {
    instances.forEach(inst => {
      if (inst.options.closeOnOutsideClick && inst.visible && inst.menuEl && !inst.menuEl.contains(e.target) && !isInsideTarget(inst, e.target)) {
        inst.hide();
      }
    });
  }

  function handleGlobalContextMenu(e) {
    instances.forEach(inst => {
      if (inst.options.closeOnOutsideClick && inst.visible && inst.menuEl && !inst.menuEl.contains(e.target) && !isInsideTarget(inst, e.target)) {
        inst.hide();
      }
    });
  }

  function handleGlobalTouchStart(e) {
    instances.forEach(inst => {
      if (inst.options.closeOnOutsideClick && inst.visible && inst.menuEl && !inst.menuEl.contains(e.target) && !isInsideTarget(inst, e.target)) {
        inst.hide();
      }
    });
  }

  function handleGlobalScroll() {
    instances.forEach(inst => {
      if (!inst.visible) return;
      if (inst.options.hideOnScroll) inst.hide();
      else if (inst.options.followScroll) inst._scheduleReposition();
    });
  }

  function handleGlobalResize() {
    instances.forEach(inst => {
      if (!inst.visible) return;
      if (inst.options.hideOnResize) inst.hide();
      else inst._scheduleReposition();
    });
  }

  function handleGlobalKeyDown(e) {
    const activeInst = Array.from(instances).find(inst => inst.visible);
    if (!activeInst) return;

    if (e.key === 'Escape' && activeInst.options.closeOnEscape) {
      e.preventDefault();
      activeInst.hide({ restoreFocus: false });
      activeInst._restoreFocus();
      return;
    }

    if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter', ' '].includes(e.key)) {
      activeInst._handleKeyboardNavigation(e);
    }
  }

  class PopContext {
    constructor(target, options = {}) {
      this.options = Object.assign({
        items: [],
        customContent: null,
        layout: 'list',
        columns: 3,
        trigger: 'contextmenu',
        toggle: false,
        preventDefaultTrigger: true,
        longPressDuration: 500,
        anchor: 'pointer',
        placement: 'bottom-start',
        offset: { x: 0, y: 0 },
        autoFlip: true,
        viewportPadding: 8,
        boundary: null,
        followScroll: false,
        followResize: false,
        openClass: '',
        syncHidden: false,
        closeOnSelect: true,
        closeOnOutsideClick: true,
        closeOnEscape: true,
        hideOnScroll: true,
        hideOnResize: true,
        ariaLabel: '',
        aria: { haspopup: 'menu', controls: null, expanded: true },
        theme: 'default',
        className: '',
        arrow: false,
        arrowOffset: null,
        zIndex: 999999,
        onBeforeShow: null,
        onShow: null,
        onHide: null,
        onSelect: null
      }, options);
      this.options.aria = Object.assign({ haspopup: 'menu', controls: null, expanded: true }, options.aria);
      this._placementExplicit = Object.prototype.hasOwnProperty.call(options, 'placement');

      this.targetEls = [];
      this.menuEl = null;
      this.arrowEl = null;
      this.visible = false;
      this.focusedIndex = -1;
      this.lastPosition = { x: 0, y: 0 };
      this.triggerOrigin = null;
      this.longPressTimer = null;
      this.currentFlipState = { flipX: false, flipY: false };
      this._originalAttributes = new Map();
      this._originalOpenClasses = new Map();
      this._rafId = null;
      this._rafIsTimeout = false;
      this._showing = false;
      this._destroyed = false;

      this._initTargets(target);
      if (this.options.anchor === 'element') this.triggerOrigin = this.targetEls[0] || null;
      if (typeof document !== 'undefined') {
        this._createMenuElement();
        this._bindTargetEvents();
        this._syncTargetAttributes();
      }

      instances.add(this);
      bindGlobalEvents();
    }

    _initTargets(target) {
      if (typeof document === 'undefined') return;
      if (typeof target === 'string') {
        this.targetEls = Array.from(document.querySelectorAll(target));
      } else if (target && target.nodeType === 1) {
        this.targetEls = [target];
      } else if (target && (typeof NodeList !== 'undefined' && target instanceof NodeList || Array.isArray(target))) {
        this.targetEls = Array.from(target).filter(el => el && el.nodeType === 1);
      }
    }

    _createMenuElement() {
      if (typeof document === 'undefined') return;
      this.menuEl = document.createElement('div');
      this.menuEl.id = `pop-context-menu-${++menuId}`;
      this.arrowEl = null;
      Object.assign(this.menuEl.style, {
        position: 'fixed',
        top: '0px',
        left: '0px',
        display: 'none',
        zIndex: String(this.options.zIndex),
        outline: 'none'
      });
      this.menuEl.setAttribute('aria-hidden', 'true');
      this.menuEl.setAttribute('tabindex', '-1');
      this.menuEl.hidden = Boolean(this.options.syncHidden);
      this._updateMenuAttributes();
      this._renderContent();
      document.body.appendChild(this.menuEl);
    }

    _updateMenuAttributes() {
      if (!this.menuEl) return;
      const themeClass = this.options.theme && this.options.theme !== 'none' ? `theme-${this.options.theme}` : '';
      const layoutClass = this.options.customContent ? 'pc-layout-custom' : `pc-layout-${this.options.layout === 'grid' ? 'grid' : 'list'}`;
      const classes = ['pop-context-menu', themeClass, layoutClass, this.options.arrow ? 'has-arrow' : '', this.options.className].filter(Boolean);
      this.menuEl.className = classes.join(' ');
      this.menuEl.setAttribute('role', 'menu');
      if (this.options.ariaLabel) this.menuEl.setAttribute('aria-label', this.options.ariaLabel);
      else this.menuEl.removeAttribute('aria-label');
      this.menuEl.style.zIndex = String(this.options.zIndex);
      if (this.options.layout === 'grid') {
        this.menuEl.style.setProperty('--pc-columns', this.options.columns);
      } else {
        this.menuEl.style.removeProperty('--pc-columns');
      }

      if (this.options.arrow && !this.arrowEl) {
        this.arrowEl = document.createElement('div');
        this.arrowEl.className = 'pc-arrow';
        this.menuEl.insertBefore(this.arrowEl, this.menuEl.firstChild);
      } else if (!this.options.arrow && this.arrowEl) {
        this.arrowEl.remove();
        this.arrowEl = null;
      }
      if (this.arrowEl && this.options.arrowOffset != null) {
        this.menuEl.style.setProperty('--pc-arrow-offset', `${Number(this.options.arrowOffset)}px`);
      } else if (this.menuEl) {
        this.menuEl.style.removeProperty('--pc-arrow-offset');
      }
    }

    _renderContent() {
      if (!this.menuEl || typeof document === 'undefined') return;
      Array.from(this.menuEl.childNodes).forEach(node => {
        if (node !== this.arrowEl) node.remove();
      });

      if (this.options.customContent) {
        const customContainer = document.createElement('div');
        customContainer.className = 'pc-custom-container';
        if (typeof this.options.customContent === 'string') {
          customContainer.innerHTML = this.options.customContent;
        } else if (this.options.customContent && this.options.customContent.nodeType === 1) {
          customContainer.appendChild(this.options.customContent);
        } else if (typeof this.options.customContent === 'function') {
          this.options.customContent.call(this, customContainer, this);
        }
        this.menuEl.appendChild(customContainer);
      } else {
        this._renderItems(this.options.items || []);
      }
      this._updateMenuAttributes();
    }

    _renderItems(items) {
      const ul = document.createElement('ul');
      ul.className = 'pc-item-list';
      ul.setAttribute('role', 'presentation');
      items.forEach((item, index) => {
        if (item.divider) {
          const divider = document.createElement('li');
          divider.className = 'pc-divider';
          divider.setAttribute('role', 'separator');
          ul.appendChild(divider);
          return;
        }

        const li = document.createElement('li');
        li.className = `pc-item ${item.disabled ? 'is-disabled' : ''} ${item.danger ? 'pc-danger' : ''} ${item.className || ''}`.trim();
        li.setAttribute('role', 'menuitem');
        li.setAttribute('tabindex', '-1');
        li.dataset.index = index;
        if (item.disabled) li.setAttribute('aria-disabled', 'true');

        if (item.icon) {
          const iconContainer = document.createElement('span');
          iconContainer.className = 'pc-icon';
          this._renderIconContent(iconContainer, item.icon);
          li.appendChild(iconContainer);
        }
        if (item.label) {
          const labelSpan = document.createElement('span');
          labelSpan.className = 'pc-label';
          labelSpan.textContent = item.label;
          li.appendChild(labelSpan);
        }
        if (item.shortcut && this.options.layout !== 'grid') {
          const shortcutSpan = document.createElement('span');
          shortcutSpan.className = 'pc-shortcut';
          shortcutSpan.textContent = item.shortcut;
          li.appendChild(shortcutSpan);
        }
        if (!item.disabled) {
          li.addEventListener('click', e => this._handleItemClick(item, e));
          li.addEventListener('mouseenter', () => this._setFocusedIndex(this._getEnabledItems().indexOf(li)));
        }
        ul.appendChild(li);
      });
      this.menuEl.appendChild(ul);
    }

    _renderIconContent(container, icon) {
      if (typeof icon !== 'string' || typeof document === 'undefined') return;
      const trimmed = icon.trim();
      if (/^(https?:\/\/|data:image\/|\/|\.\/|\.\.\/).+\.(png|jpg|jpeg|gif|svg|webp)/i.test(trimmed) || trimmed.startsWith('data:image/')) {
        const img = document.createElement('img');
        img.src = trimmed;
        img.alt = '';
        img.className = 'pc-icon-img';
        container.appendChild(img);
      } else if (trimmed.startsWith('<svg') && trimmed.endsWith('</svg>') && typeof DOMParser !== 'undefined') {
        const parser = new DOMParser();
        const doc = parser.parseFromString(trimmed, 'image/svg+xml');
        const svgEl = doc.querySelector('svg');
        if (svgEl && !doc.querySelector('parsererror')) {
          svgEl.querySelectorAll('script').forEach(script => script.remove());
          container.appendChild(document.importNode(svgEl, true));
        } else {
          container.textContent = trimmed;
        }
      } else if (trimmed.includes(' ')) {
        const iconEl = document.createElement('i');
        iconEl.className = trimmed;
        container.appendChild(iconEl);
      } else {
        container.textContent = trimmed;
      }
    }

    _bindTargetEvents() {
      this._onContextMenu = this._onContextMenu.bind(this);
      this._onClick = this._onClick.bind(this);
      this._onTouchStart = this._onTouchStart.bind(this);
      this._onTouchEnd = this._onTouchEnd.bind(this);
      if (this.options.trigger === 'manual') return;
      this.targetEls.forEach(el => {
        if (this.options.trigger === 'contextmenu') {
          el.addEventListener('contextmenu', this._onContextMenu);
        } else if (this.options.trigger === 'click') {
          el.addEventListener('click', this._onClick);
        } else if (this.options.trigger === 'longpress') {
          el.addEventListener('touchstart', this._onTouchStart, { passive: true });
          el.addEventListener('touchend', this._onTouchEnd);
          el.addEventListener('contextmenu', this._onContextMenu);
        }
      });
    }

    _unbindTargetEvents() {
      this.targetEls.forEach(el => {
        el.removeEventListener('contextmenu', this._onContextMenu);
        el.removeEventListener('click', this._onClick);
        el.removeEventListener('touchstart', this._onTouchStart);
        el.removeEventListener('touchend', this._onTouchEnd);
      });
    }

    _recordAttribute(el, name, value) {
      let attrs = this._originalAttributes.get(el);
      if (!attrs) {
        attrs = new Map();
        this._originalAttributes.set(el, attrs);
      }
      if (!attrs.has(name)) {
        attrs.set(name, { original: el.hasAttribute(name) ? el.getAttribute(name) : null, written: value });
      }
      attrs.get(name).written = value;
      el.setAttribute(name, value);
    }

    _syncTargetAttributes() {
      if (!this.options.aria) return;
      this.targetEls.forEach(el => {
        if (this.options.aria.haspopup) this._recordAttribute(el, 'aria-haspopup', this.options.aria.haspopup);
        else this._restoreManagedAttribute(el, 'aria-haspopup');
        if (this.options.aria.controls && !el.hasAttribute('aria-controls')) {
          this._recordAttribute(el, 'aria-controls', this.options.aria.controls);
        } else if (!el.hasAttribute('aria-controls') && this.menuEl) {
          this._recordAttribute(el, 'aria-controls', this.menuEl.id);
        }
        if (this.options.aria.expanded) this._recordAttribute(el, 'aria-expanded', this.visible && el === this.triggerOrigin ? 'true' : 'false');
        else this._restoreManagedAttribute(el, 'aria-expanded');
        if (this.options.openClass) {
          if (!this._originalOpenClasses.has(el)) {
            this._originalOpenClasses.set(el, el.classList.contains(this.options.openClass));
          }
          el.classList.toggle(this.options.openClass, this.visible && el === this.triggerOrigin);
        }
      });
    }

    _restoreManagedAttribute(el, name) {
      const attrs = this._originalAttributes.get(el);
      if (!attrs || !attrs.has(name)) return;
      const record = attrs.get(name);
      if (el.getAttribute(name) === record.written) {
        if (record.original == null) el.removeAttribute(name);
        else el.setAttribute(name, record.original);
      }
      attrs.delete(name);
      if (attrs.size === 0) this._originalAttributes.delete(el);
    }

    _writeExpanded(value) {
      if (!this.options.aria.expanded) return;
      this.targetEls.forEach(el => {
        this._recordAttribute(el, 'aria-expanded', value && el === this.triggerOrigin ? 'true' : 'false');
      });
    }

    _writeOpenClass(value) {
      if (!this.options.openClass) return;
      this.targetEls.forEach(el => {
        if (!this._originalOpenClasses.has(el)) {
          this._originalOpenClasses.set(el, el.classList.contains(this.options.openClass));
        }
        el.classList.toggle(this.options.openClass, value && el === this.triggerOrigin);
      });
    }

    _restoreTargetState() {
      this._originalAttributes.forEach((attrs, el) => {
        attrs.forEach((record, name) => {
          if (el.getAttribute(name) !== record.written) return;
          if (record.original == null) el.removeAttribute(name);
          else el.setAttribute(name, record.original);
        });
      });
      this._originalAttributes.clear();
      this._originalOpenClasses.forEach((hadClass, el) => {
        if (!hadClass) el.classList.remove(this.options.openClass);
      });
      this._originalOpenClasses.clear();
    }

    _onContextMenu(e) {
      e.preventDefault();
      this.lastPosition = { x: e.clientX, y: e.clientY };
      this._toggleOrShow(e.currentTarget);
    }

    _onClick(e) {
      if (this.options.preventDefaultTrigger) e.preventDefault();
      this.lastPosition = { x: e.clientX, y: e.clientY };
      this._toggleOrShow(e.currentTarget);
    }

    _toggleOrShow(target) {
      if (this.visible) {
        if (this.options.toggle && this.triggerOrigin === target) {
          this.hide();
          return;
        }
        if (this.triggerOrigin !== target) this.hide({ restoreFocus: false });
        else return;
      }
      this.triggerOrigin = target;
      this.show();
    }

    _onTouchStart(e) {
      if (e.touches.length !== 1) {
        this._cancelLongPress();
        return;
      }
      const touch = e.touches[0];
      this.triggerOrigin = e.currentTarget;
      this._cancelLongPress();
      this.longPressTimer = setTimeout(() => {
        this.longPressTimer = null;
        this.show(touch.clientX, touch.clientY);
      }, this.options.longPressDuration);
    }

    _onTouchEnd() {
      this._cancelLongPress();
    }

    _cancelLongPress() {
      if (this.longPressTimer) clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    show(x, y) {
      if (this._destroyed || this.visible || !this.menuEl || this._showing) return;
      this._showing = true;
      try {
        if (typeof this.options.onBeforeShow === 'function') this.options.onBeforeShow.call(this, this);
      } finally {
        this._showing = false;
      }
      if (this.options.anchor === 'pointer' && typeof x === 'number' && typeof y === 'number') {
        this.lastPosition = { x, y };
      }
      instances.forEach(inst => {
        if (inst !== this && inst.visible) inst.hide({ restoreFocus: false });
      });
      this.menuEl.style.display = 'block';
      if (this.options.syncHidden) this.menuEl.hidden = false;
      this.menuEl.setAttribute('aria-hidden', 'false');
      this.visible = true;
      this._writeExpanded(true);
      this._writeOpenClass(true);
      this._reposition();
      if (!this.visible) return;
      this._setFocusedIndex(-1);
      if (typeof this.options.onShow === 'function') {
        this.options.onShow.call(this, { x: this.lastPosition.x, y: this.lastPosition.y });
      }
    }

    _getAnchorRect() {
      if (this.options.anchor === 'element') {
        const anchor = this.triggerOrigin || this.targetEls[0];
        if (!anchor || !anchor.getBoundingClientRect) return null;
        const rect = anchor.getBoundingClientRect();
        if (!rect.width || !rect.height || anchor.isConnected === false) return null;
        return rect;
      }
      return {
        left: this.lastPosition.x,
        right: this.lastPosition.x,
        top: this.lastPosition.y,
        bottom: this.lastPosition.y,
        width: 0,
        height: 0
      };
    }

    _getBoundaryRect() {
      if (this.options.boundary && this.options.boundary.getBoundingClientRect) {
        return this.options.boundary.getBoundingClientRect();
      }
      const viewport = window.visualViewport;
      if (viewport) {
        return { left: viewport.offsetLeft, top: viewport.offsetTop, right: viewport.offsetLeft + viewport.width, bottom: viewport.offsetTop + viewport.height };
      }
      return { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
    }

    _reposition() {
      if (!this.menuEl || typeof window === 'undefined' || !this.visible) return;
      const anchorRect = this._getAnchorRect();
      if (!anchorRect) {
        this.hide();
        return;
      }
      const boundary = this._getBoundaryRect();
      if (this.options.anchor === 'element' &&
          (anchorRect.right <= boundary.left || anchorRect.left >= boundary.right ||
           anchorRect.bottom <= boundary.top || anchorRect.top >= boundary.bottom)) {
        this.hide();
        return;
      }

      const padding = Math.max(0, Number(this.options.viewportPadding) || 0);
      const rect = this.menuEl.getBoundingClientRect();
      const availableWidth = Math.max(0, boundary.right - boundary.left - padding * 2);
      const availableHeight = Math.max(0, boundary.bottom - boundary.top - padding * 2);
      let width = rect.width;
      let height = rect.height;
      const safe = this.menuEl.style.visibility;
      if (!width || !height) {
        this.menuEl.style.visibility = 'hidden';
        const measured = this.menuEl.getBoundingClientRect();
        width = measured.width;
        height = measured.height;
        this.menuEl.style.visibility = safe;
      }

      if (this.options.anchor === 'pointer' && !this._placementExplicit) {
        this.currentFlipState = { flipX: false, flipY: false };
        let left = anchorRect.left + (Number(this.options.offset.x) || 0);
        let top = anchorRect.top + (Number(this.options.offset.y) || 0) + (this.options.arrow ? 8 : 0);
        if (this.options.autoFlip && left + width > boundary.right - padding) {
          left = anchorRect.left - width - (Number(this.options.offset.x) || 0);
          this.currentFlipState.flipX = true;
        }
        if (this.options.autoFlip && top + height > boundary.bottom - padding) {
          top = anchorRect.top - height - (Number(this.options.offset.y) || 0) - (this.options.arrow ? 16 : 0);
          this.currentFlipState.flipY = true;
        }
        left = Math.max(boundary.left + padding, Math.min(left, boundary.right - width - padding));
        top = Math.max(boundary.top + padding, Math.min(top, boundary.bottom - height - padding));
        this.menuEl.style.left = `${left}px`;
        this.menuEl.style.top = `${top}px`;
        if (this.options.arrow && this.arrowEl) {
          this.menuEl.classList.toggle('pc-arrow-top', !this.currentFlipState.flipY);
          this.menuEl.classList.toggle('pc-arrow-bottom', this.currentFlipState.flipY);
          this.menuEl.classList.toggle('pc-arrow-left', false);
          this.menuEl.classList.toggle('pc-arrow-right', false);
        }
        return;
      }

      const placement = this.options.placement || 'bottom-start';
      const split = placement.split('-');
      let side = split[0] === 'auto' ? this._bestSide(anchorRect, width, height, boundary, padding) : split[0];
      const align = split[1] || 'start';
      if (!['top', 'right', 'bottom', 'left'].includes(side)) side = 'bottom';
      let flipX = false;
      let flipY = false;
      const opposite = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
      if (this.options.autoFlip && side !== 'auto') {
        const needed = side === 'top' || side === 'bottom' ? height : width;
        const available = this._spaceForSide(side, anchorRect, boundary, padding);
        const oppositeAvailable = this._spaceForSide(opposite[side], anchorRect, boundary, padding);
        if (available < needed && oppositeAvailable > available) {
          side = opposite[side];
          flipY = side === 'top';
          flipX = side === 'left';
        }
      }

      const rtl = typeof document !== 'undefined' && document.dir === 'rtl';
      const offset = this.options.offset || { x: 0, y: 0 };
      let left;
      let top;
      if (side === 'top' || side === 'bottom') {
        const logicalAlign = rtl ? (align === 'start' ? 'end' : align === 'end' ? 'start' : align) : align;
        left = logicalAlign === 'end' ? anchorRect.right - width : logicalAlign === 'center' ? anchorRect.left + (anchorRect.width - width) / 2 : anchorRect.left;
        left += Number(offset.x) || 0;
        top = side === 'bottom' ? anchorRect.bottom + (Number(offset.y) || 0) : anchorRect.top - height - (Number(offset.y) || 0);
      } else {
        top = align === 'end' ? anchorRect.bottom - height : align === 'center' ? anchorRect.top + (anchorRect.height - height) / 2 : anchorRect.top;
        top += Number(offset.y) || 0;
        left = side === 'right' ? anchorRect.right + (Number(offset.x) || 0) : anchorRect.left - width - (Number(offset.x) || 0);
      }

      left = Math.max(boundary.left + padding, Math.min(left, boundary.right - padding - Math.min(width, availableWidth)));
      top = Math.max(boundary.top + padding, Math.min(top, boundary.bottom - padding - Math.min(height, availableHeight)));
      this.menuEl.style.left = `${left}px`;
      this.menuEl.style.top = `${top}px`;
      this.currentFlipState = { flipX, flipY };
      if (this.options.arrow && this.arrowEl) {
        this.menuEl.classList.toggle('pc-arrow-top', side === 'bottom');
        this.menuEl.classList.toggle('pc-arrow-bottom', side === 'top');
        this.menuEl.classList.toggle('pc-arrow-left', side === 'right');
        this.menuEl.classList.toggle('pc-arrow-right', side === 'left');
        if (this.options.arrowOffset == null && (side === 'top' || side === 'bottom')) {
          const center = anchorRect.left + anchorRect.width / 2 - left;
          this.menuEl.style.setProperty('--pc-arrow-offset', `${Math.max(12, Math.min(width - 12, center))}px`);
        }
      }
    }

    _spaceForSide(side, rect, boundary, padding) {
      if (side === 'top') return rect.top - boundary.top - padding;
      if (side === 'bottom') return boundary.bottom - rect.bottom - padding;
      if (side === 'left') return rect.left - boundary.left - padding;
      return boundary.right - rect.right - padding;
    }

    _bestSide(rect, width, height, boundary, padding) {
      const sides = ['bottom', 'top', 'right', 'left'];
      return sides.reduce((best, side) => {
        const needed = side === 'top' || side === 'bottom' ? height : width;
        const score = Math.min(needed, this._spaceForSide(side, rect, boundary, padding));
        return score > best.score ? { side, score } : best;
      }, { side: 'bottom', score: -Infinity }).side;
    }

    _scheduleReposition() {
      if (this._rafId != null || !this.visible) return;
      if (typeof requestAnimationFrame === 'function') {
        this._rafIsTimeout = false;
        this._rafId = requestAnimationFrame(() => {
          this._rafId = null;
          this._reposition();
        });
      } else {
        this._rafIsTimeout = true;
        this._rafId = setTimeout(() => {
          this._rafId = null;
          this._reposition();
        }, 16);
      }
    }

    hide(options = {}) {
      if (!this.visible) return;
      if (this.menuEl) {
        this.menuEl.style.display = 'none';
        if (this.options.syncHidden) this.menuEl.hidden = true;
        this.menuEl.setAttribute('aria-hidden', 'true');
      }
      this.visible = false;
      this.focusedIndex = -1;
      this._writeExpanded(false);
      this._writeOpenClass(false);
      this._cancelLongPress();
      if (this._rafId != null) {
        if (this._rafIsTimeout) clearTimeout(this._rafId);
        else if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this._rafId);
        this._rafId = null;
      }
      if (options.restoreFocus === true) this._restoreFocus();
      if (typeof this.options.onHide === 'function') this.options.onHide.call(this);
    }

    _restoreFocus() {
      const target = this.triggerOrigin;
      if (target && typeof target.focus === 'function' && target.isConnected !== false) target.focus();
    }

    setTarget(target) {
      if (this._destroyed) return;
      this._unbindTargetEvents();
      this._restoreTargetState();
      this.targetEls = [];
      this._initTargets(target);
      if (this.options.anchor === 'element') this.triggerOrigin = this.targetEls[0] || null;
      this._bindTargetEvents();
      this._syncTargetAttributes();
      if (this.visible) this._reposition();
    }

    setItems(items) {
      this.options.items = Array.isArray(items) ? items : [];
      this._renderContent();
      if (this.visible) this._reposition();
    }

    setCustomContent(content) {
      this.options.customContent = content;
      this._updateMenuAttributes();
      this._renderContent();
      if (this.visible) this._reposition();
    }

    setOptions(patch = {}) {
      if (!patch || typeof patch !== 'object') return;
      const oldTrigger = this.options.trigger;
      const oldOpenClass = this.options.openClass;
      const safePatch = Object.assign({}, patch);
      delete safePatch.items;
      delete safePatch.customContent;
      if (Object.prototype.hasOwnProperty.call(safePatch, 'placement')) this._placementExplicit = true;
      if (safePatch.aria) safePatch.aria = Object.assign({}, this.options.aria, safePatch.aria);
      Object.assign(this.options, safePatch);
      if (Object.prototype.hasOwnProperty.call(safePatch, 'syncHidden') && this.menuEl) {
        if (this.options.syncHidden) this.menuEl.hidden = !this.visible;
        else this.menuEl.hidden = false;
      }
      if (oldTrigger !== this.options.trigger) {
        this._cancelLongPress();
        this._unbindTargetEvents();
        this._bindTargetEvents();
      }
      if (oldOpenClass !== this.options.openClass) {
        this.targetEls.forEach(el => {
          if (oldOpenClass && !this._originalOpenClasses.get(el)) el.classList.remove(oldOpenClass);
        });
        this._originalOpenClasses.clear();
        this._writeOpenClass(this.visible);
      }
      this._syncTargetAttributes();
      this._updateMenuAttributes();
      this._renderContent();
      if (this.visible) this._reposition();
    }

    reposition() {
      this._reposition();
    }

    toggle() {
      if (this.visible) this.hide();
      else this.show();
    }

    isVisible() {
      return this.visible;
    }

    _handleItemClick(item, e) {
      if (item.disabled) return;
      if (this.options.closeOnSelect) this.hide({ restoreFocus: true });
      if (typeof item.onClick === 'function') item.onClick.call(this, item, e);
      if (typeof this.options.onSelect === 'function') this.options.onSelect.call(this, item, e);
    }

    _getEnabledItems() {
      return this.menuEl ? Array.from(this.menuEl.querySelectorAll('.pc-item:not(.is-disabled)')) : [];
    }

    _setFocusedIndex(index) {
      if (!this.menuEl) return;
      const items = this._getEnabledItems();
      items.forEach(el => el.classList.remove('is-focused'));
      if (index >= 0 && index < items.length) {
        this.focusedIndex = index;
        items[index].classList.add('is-focused');
        items[index].focus();
      } else {
        this.focusedIndex = -1;
      }
    }

    _handleKeyboardNavigation(e) {
      if (!this.menuEl) return;
      const items = this._getEnabledItems();
      if (items.length === 0) return;
      e.preventDefault();
      const cols = this.options.layout === 'grid' ? (this.options.columns || 3) : 1;
      if (e.key === 'ArrowDown') this._setFocusedIndex(Math.min(items.length - 1, this.focusedIndex < 0 ? 0 : this.focusedIndex + cols));
      else if (e.key === 'ArrowUp') this._setFocusedIndex(Math.max(0, this.focusedIndex < 0 ? 0 : this.focusedIndex - cols));
      else if (e.key === 'ArrowRight' && this.options.layout === 'grid') this._setFocusedIndex(Math.min(items.length - 1, this.focusedIndex < 0 ? 0 : this.focusedIndex + 1));
      else if (e.key === 'ArrowLeft' && this.options.layout === 'grid') this._setFocusedIndex(Math.max(0, this.focusedIndex < 0 ? 0 : this.focusedIndex - 1));
      else if (e.key === 'Home') this._setFocusedIndex(0);
      else if (e.key === 'End') this._setFocusedIndex(items.length - 1);
      else if ((e.key === 'Enter' || e.key === ' ') && this.focusedIndex >= 0 && this.focusedIndex < items.length) {
        const itemIndex = parseInt(items[this.focusedIndex].dataset.index, 10);
        const item = this.options.items[itemIndex];
        if (item) this._handleItemClick(item, e);
      }
    }

    updateItems(items) {
      this.setItems(items);
    }

    destroy() {
      if (this._destroyed) return;
      this._destroyed = true;
      this.hide({ restoreFocus: false });
      this._unbindTargetEvents();
      this._cancelLongPress();
      if (this._rafId != null) {
        if (this._rafIsTimeout) clearTimeout(this._rafId);
        else if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this._rafId);
      }
      this._restoreTargetState();
      instances.delete(this);
      unbindGlobalEvents();
      if (this.menuEl && this.menuEl.parentNode) this.menuEl.parentNode.removeChild(this.menuEl);
      this.menuEl = null;
      this.arrowEl = null;
      this.targetEls = [];
      this.triggerOrigin = null;
    }
  }

  return PopContext;
}));
