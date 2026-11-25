/**
 * PopContext v2.4.0
 * Lightweight, accessible, multi-trigger custom context menu library with Custom Content & Arrow support.
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

  function bindGlobalEvents() {
    if (globalEventsBound || typeof window === 'undefined') return;
    globalEventsBound = true;
    window.addEventListener('click', handleGlobalClick, true);
    window.addEventListener('contextmenu', handleGlobalContextMenu, true);
    window.addEventListener('touchstart', handleGlobalTouchStart, { passive: true });
    window.addEventListener('scroll', handleGlobalScroll, { passive: true });
    window.addEventListener('resize', handleGlobalResize, { passive: true });
    window.addEventListener('keydown', handleGlobalKeyDown, true);
  }

  function unbindGlobalEvents() {
    if (!globalEventsBound || instances.size > 0) return;
    globalEventsBound = false;
    window.removeEventListener('click', handleGlobalClick, true);
    window.removeEventListener('contextmenu', handleGlobalContextMenu, true);
    window.removeEventListener('touchstart', handleGlobalTouchStart);
    window.removeEventListener('scroll', handleGlobalScroll);
    window.removeEventListener('resize', handleGlobalResize);
    window.removeEventListener('keydown', handleGlobalKeyDown, true);
  }

  function handleGlobalClick(e) {
    instances.forEach(inst => {
      if (inst.visible && inst.menuEl && !inst.menuEl.contains(e.target)) {
        inst.hide();
      }
    });
  }

  function handleGlobalContextMenu(e) {
    instances.forEach(inst => {
      if (inst.visible && inst.menuEl && !inst.menuEl.contains(e.target)) {
        if (!inst.targetEls.some(el => el.contains(e.target))) {
          inst.hide();
        }
      }
    });
  }

  function handleGlobalTouchStart(e) {
    instances.forEach(inst => {
      if (inst.visible && inst.menuEl && !inst.menuEl.contains(e.target)) {
        inst.hide();
      }
    });
  }

  function handleGlobalScroll() {
    instances.forEach(inst => {
      if (inst.visible && inst.options.hideOnScroll) {
        inst.hide();
      }
    });
  }

  function handleGlobalResize() {
    instances.forEach(inst => {
      if (inst.visible) {
        if (inst.options.hideOnResize) {
          inst.hide();
        } else {
          inst._reposition();
        }
      }
    });
  }

  function handleGlobalKeyDown(e) {
    const activeInst = Array.from(instances).find(inst => inst.visible);
    if (!activeInst) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      activeInst.hide();
      if (activeInst.triggerOrigin && typeof activeInst.triggerOrigin.focus === 'function') {
        activeInst.triggerOrigin.focus();
      }
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
        customContent: null, // string | HTMLElement | function(container, inst)
        trigger: 'contextmenu', // 'contextmenu' | 'click' | 'longpress'
        layout: 'list', // 'list' | 'grid'
        columns: 3,
        arrow: false, // 吹き出しの尻尾 (Arrow)
        longPressDuration: 500,
        theme: 'default', // 'default' | 'dark'
        className: '',
        offset: { x: 0, y: 0 },
        hideOnScroll: true,
        hideOnResize: true,
        autoFlip: true,
        onShow: null,
        onHide: null,
        onSelect: null
      }, options);

      this.targetEls = [];
      this.menuEl = null;
      this.arrowEl = null;
      this.visible = false;
      this.focusedIndex = -1;
      this.lastPosition = { x: 0, y: 0 };
      this.triggerOrigin = null;
      this.longPressTimer = null;
      this.currentFlipState = { flipX: false, flipY: false };

      this._initTargets(target);
      if (typeof document !== 'undefined') {
        this._createMenuElement();
        this._bindTargetEvents();
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
      } else if (target && (target instanceof NodeList || Array.isArray(target))) {
        this.targetEls = Array.from(target);
      }
    }

    _createMenuElement() {
      if (typeof document === 'undefined') return;
      this.menuEl = document.createElement('div');
      const layoutClass = this.options.customContent ? 'pc-layout-custom' : `pc-layout-${this.options.layout === 'grid' ? 'grid' : 'list'}`;
      const arrowClass = this.options.arrow ? 'has-arrow' : '';
      this.menuEl.className = `pop-context-menu theme-${this.options.theme} ${layoutClass} ${arrowClass} ${this.options.className}`.trim();
      this.menuEl.setAttribute('role', 'menu');
      this.menuEl.setAttribute('aria-hidden', 'true');
      this.menuEl.setAttribute('tabindex', '-1');

      if (this.options.layout === 'grid') {
        this.menuEl.style.setProperty('--pc-columns', this.options.columns);
      }

      if (this.options.arrow) {
        this.arrowEl = document.createElement('div');
        this.arrowEl.className = 'pc-arrow';
        this.menuEl.appendChild(this.arrowEl);
      }

      Object.assign(this.menuEl.style, {
        position: 'fixed',
        top: '0px',
        left: '0px',
        display: 'none',
        zIndex: '999999',
        outline: 'none'
      });

      this._renderContent();
      document.body.appendChild(this.menuEl);
    }

    _renderContent() {
      if (!this.menuEl || typeof document === 'undefined') return;

      // 古いアイテムリストまたはカスタムコンテナをクリア（矢印要素は残す）
      Array.from(this.menuEl.childNodes).forEach(node => {
        if (node !== this.arrowEl) {
          this.menuEl.removeChild(node);
        }
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
        this._renderItems(this.options.items);
      }
    }

    _renderItems(items) {
      const ul = document.createElement('ul');
      ul.className = 'pc-item-list';
      ul.setAttribute('role', 'presentation');

      items.forEach((item, index) => {
        if (item.divider) {
          const liDivider = document.createElement('li');
          liDivider.className = 'pc-divider';
          liDivider.setAttribute('role', 'separator');
          ul.appendChild(liDivider);
          return;
        }

        const li = document.createElement('li');
        const dangerClass = item.danger ? 'pc-danger' : '';
        li.className = `pc-item ${item.disabled ? 'is-disabled' : ''} ${dangerClass} ${item.className || ''}`.trim();
        li.setAttribute('role', 'menuitem');
        li.setAttribute('tabindex', '-1');
        li.dataset.index = index;

        if (item.disabled) {
          li.setAttribute('aria-disabled', 'true');
        }

        if (item.icon) {
          const iconContainer = document.createElement('span');
          iconContainer.className = 'pc-icon';
          this._renderIconContent(iconContainer, item.icon);
          li.appendChild(iconContainer);
        }

        if (item.label) {
          const labelSpan = document.createElement('span');
          labelSpan.className = 'pc-label';
          labelSpan.textContent = item.label || '';
          li.appendChild(labelSpan);
        }

        if (item.shortcut && this.options.layout !== 'grid') {
          const shortcutSpan = document.createElement('span');
          shortcutSpan.className = 'pc-shortcut';
          shortcutSpan.textContent = item.shortcut;
          li.appendChild(shortcutSpan);
        }

        if (!item.disabled) {
          li.addEventListener('click', (e) => {
            e.stopPropagation();
            this._handleItemClick(item, e);
          });
          li.addEventListener('mouseenter', () => {
            this._setFocusedIndex(index);
          });
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
        return;
      }

      if (trimmed.startsWith('<svg') && trimmed.endsWith('</svg>')) {
        try {
          if (typeof DOMParser !== 'undefined') {
            const parser = new DOMParser();
            const doc = parser.parseFromString(trimmed, 'image/svg+xml');
            const svgEl = doc.querySelector('svg');
            if (svgEl && !doc.querySelector('parsererror')) {
              const scripts = svgEl.querySelectorAll('script');
              scripts.forEach(s => s.remove());
              container.appendChild(document.importNode(svgEl, true));
              return;
            }
          }
        } catch (e) {
          console.warn('PopContext: SVG parsing failed', e);
        }
      }

      if (trimmed.includes(' ')) {
        const i = document.createElement('i');
        i.className = trimmed;
        container.appendChild(i);
      } else {
        container.textContent = trimmed;
      }
    }

    _bindTargetEvents() {
      this._onContextMenu = this._onContextMenu.bind(this);
      this._onClick = this._onClick.bind(this);
      this._onTouchStart = this._onTouchStart.bind(this);
      this._onTouchEnd = this._onTouchEnd.bind(this);

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

    _onContextMenu(e) {
      e.preventDefault();
      this.triggerOrigin = e.currentTarget;
      this.show(e.clientX, e.clientY);
    }

    _onClick(e) {
      e.preventDefault();
      this.triggerOrigin = e.currentTarget;
      this.show(e.clientX, e.clientY);
    }

    _onTouchStart(e) {
      if (e.touches.length > 1) return;
      const touch = e.touches[0];
      this.triggerOrigin = e.currentTarget;

      this.longPressTimer = setTimeout(() => {
        this.show(touch.clientX, touch.clientY);
      }, this.options.longPressDuration);
    }

    _onTouchEnd() {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
    }

    show(x, y) {
      instances.forEach(inst => {
        if (inst !== this && inst.visible) inst.hide();
      });

      this.lastPosition = { x, y };
      if (this.menuEl) {
        this.menuEl.style.display = 'block';
        this.menuEl.setAttribute('aria-hidden', 'false');
      }
      this.visible = true;

      this._reposition();
      this._setFocusedIndex(-1);

      if (typeof this.options.onShow === 'function') {
        this.options.onShow.call(this, { x, y });
      }
    }

    _reposition() {
      if (!this.menuEl || typeof window === 'undefined') return;
      const { x, y } = this.lastPosition;
      const rect = this.menuEl.getBoundingClientRect();
      const winWidth = window.innerWidth;
      const winHeight = window.innerHeight;
      const margin = 8;
      const arrowOffset = this.options.arrow ? 10 : 0;

      let posX = x + this.options.offset.x;
      let posY = y + this.options.offset.y + (this.options.arrow ? 8 : 0);
      let flipY = false;

      if (this.options.autoFlip) {
        if (posX + rect.width > winWidth - margin) {
          posX = x - rect.width - this.options.offset.x;
        }
        if (posY + rect.height > winHeight - margin) {
          posY = y - rect.height - this.options.offset.y - (this.options.arrow ? 16 : 0);
          flipY = true;
        }
      }

      posX = Math.max(margin, Math.min(posX, winWidth - rect.width - margin));
      posY = Math.max(margin, Math.min(posY, winHeight - rect.height - margin));

      this.menuEl.style.left = `${posX}px`;
      this.menuEl.style.top = `${posY}px`;

      if (this.options.arrow && this.arrowEl) {
        this.menuEl.classList.toggle('pc-arrow-top', !flipY);
        this.menuEl.classList.toggle('pc-arrow-bottom', flipY);
      }
    }

    hide() {
      if (!this.visible) return;

      if (this.menuEl) {
        this.menuEl.style.display = 'none';
        this.menuEl.setAttribute('aria-hidden', 'true');
      }
      this.visible = false;
      this.focusedIndex = -1;

      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }

      if (typeof this.options.onHide === 'function') {
        this.options.onHide.call(this);
      }
    }

    setCustomContent(content) {
      this.options.customContent = content;
      this._renderContent();
      if (this.visible) {
        this._reposition();
      }
    }

    _handleItemClick(item, e) {
      if (item.disabled) return;

      this.hide();

      if (typeof item.onClick === 'function') {
        item.onClick.call(this, item, e);
      }
      if (typeof this.options.onSelect === 'function') {
        this.options.onSelect.call(this, item, e);
      }
    }

    _setFocusedIndex(index) {
      if (!this.menuEl) return;
      const items = Array.from(this.menuEl.querySelectorAll('.pc-item:not(.is-disabled)'));
      if (items.length === 0) return;

      items.forEach(el => el.classList.remove('is-focused'));

      if (index >= 0 && index < items.length) {
        this.focusedIndex = index;
        items[index].classList.add('is-focused');
        if (typeof items[index].focus === 'function') {
          items[index].focus();
        }
      } else {
        this.focusedIndex = -1;
      }
    }

    _handleKeyboardNavigation(e) {
      if (!this.menuEl) return;
      const items = Array.from(this.menuEl.querySelectorAll('.pc-item:not(.is-disabled)'));
      if (items.length === 0) return;

      e.preventDefault();

      const cols = this.options.layout === 'grid' ? (this.options.columns || 3) : 1;

      if (e.key === 'ArrowDown') {
        const nextIndex = Math.min(items.length - 1, this.focusedIndex < 0 ? 0 : this.focusedIndex + cols);
        this._setFocusedIndex(nextIndex);
      } else if (e.key === 'ArrowUp') {
        const prevIndex = Math.max(0, this.focusedIndex < 0 ? 0 : this.focusedIndex - cols);
        this._setFocusedIndex(prevIndex);
      } else if (e.key === 'ArrowRight' && this.options.layout === 'grid') {
        const nextIndex = Math.min(items.length - 1, this.focusedIndex < 0 ? 0 : this.focusedIndex + 1);
        this._setFocusedIndex(nextIndex);
      } else if (e.key === 'ArrowLeft' && this.options.layout === 'grid') {
        const prevIndex = Math.max(0, this.focusedIndex < 0 ? 0 : this.focusedIndex - 1);
        this._setFocusedIndex(prevIndex);
      } else if (e.key === 'Home') {
        this._setFocusedIndex(0);
      } else if (e.key === 'End') {
        this._setFocusedIndex(items.length - 1);
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (this.focusedIndex >= 0 && this.focusedIndex < items.length) {
          const focusedEl = items[this.focusedIndex];
          const itemIndex = parseInt(focusedEl.dataset.index, 10);
          const item = this.options.items[itemIndex];
          if (item) {
            this._handleItemClick(item, e);
          }
        }
      }
    }

    updateItems(newItems) {
      this.options.items = newItems;
      this.options.customContent = null;
      this._renderContent();
    }

    destroy() {
      this.hide();
      this._unbindTargetEvents();

      instances.delete(this);
      unbindGlobalEvents();

      if (this.menuEl && this.menuEl.parentNode) {
        this.menuEl.parentNode.removeChild(this.menuEl);
      }

      this.menuEl = null;
      this.targetEls = [];
      this.triggerOrigin = null;
    }
  }

  return PopContext;
}));
