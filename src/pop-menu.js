/**
 * PopMenu JS v3.0.0
 * Lightweight, accessible, multi-trigger custom context menu with element positioning.
 */
(function (global, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define(factory);
  } else {
    global.PopMenu = factory();
  }
}(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  const instances = new Set();
  const declarativeInstances = new Map();
  let globalEventsBound = false;
  let menuId = 0;
  let scrollLockCount = 0;
  let scrollLockSnapshot = null;
  let isComposing = false;

  function getInlineStyle(element, property) {
    return {
      value: element.style.getPropertyValue(property),
      priority: element.style.getPropertyPriority(property)
    };
  }

  function restoreInlineStyle(element, property, saved) {
    if (saved.value) element.style.setProperty(property, saved.value, saved.priority);
    else element.style.removeProperty(property);
  }

  function acquireScrollLock() {
    if (typeof document === 'undefined' || !document.documentElement || !document.body) return;
    if (scrollLockCount > 0) {
      scrollLockCount += 1;
      return;
    }

    const root = document.documentElement;
    const body = document.body;
    const gutter = Math.max(0, window.innerWidth - root.clientWidth);
    const supportsGutter = typeof CSS !== 'undefined' && CSS.supports &&
      CSS.supports('scrollbar-gutter', 'stable');
    scrollLockSnapshot = {
      root,
      body,
      overflow: getInlineStyle(root, 'overflow'),
      scrollbarGutter: getInlineStyle(root, 'scrollbar-gutter'),
      paddingRight: getInlineStyle(body, 'padding-right'),
      addedClass: !root.classList.contains('pm-scroll-locked')
    };
    root.classList.add('pm-scroll-locked');
    root.style.setProperty('overflow', 'hidden');
    if (supportsGutter) {
      root.style.setProperty('scrollbar-gutter', 'stable');
    } else if (gutter > 0) {
      const currentPadding = parseFloat(window.getComputedStyle
        ? window.getComputedStyle(body).paddingRight
        : body.style.getPropertyValue('padding-right')) || 0;
      body.style.setProperty('padding-right', `${currentPadding + gutter}px`);
    }
    scrollLockCount = 1;
  }

  function releaseScrollLock() {
    if (scrollLockCount === 0) return;
    scrollLockCount -= 1;
    if (scrollLockCount > 0 || !scrollLockSnapshot) return;
    const snapshot = scrollLockSnapshot;
    scrollLockSnapshot = null;
    restoreInlineStyle(snapshot.root, 'overflow', snapshot.overflow);
    restoreInlineStyle(snapshot.root, 'scrollbar-gutter', snapshot.scrollbarGutter);
    restoreInlineStyle(snapshot.body, 'padding-right', snapshot.paddingRight);
    if (snapshot.addedClass) snapshot.root.classList.remove('pm-scroll-locked');
  }

  function bindGlobalEvents() {
    if (globalEventsBound || typeof window === 'undefined') return;
    globalEventsBound = true;
    window.addEventListener('click', handleGlobalClick, true);
    window.addEventListener('contextmenu', handleGlobalContextMenu, true);
    window.addEventListener('touchstart', handleGlobalTouchStart, { passive: true });
    window.addEventListener('scroll', handleGlobalScroll, { passive: true, capture: true });
    window.addEventListener('resize', handleGlobalResize, { passive: true });
    window.addEventListener('keydown', handleGlobalKeyDown, true);
    window.addEventListener('compositionstart', handleCompositionStart, true);
    window.addEventListener('compositionend', handleCompositionEnd, true);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange, { passive: true });
      window.visualViewport.addEventListener('scroll', handleVisualViewportChange, { passive: true });
    }
  }

  function unbindGlobalEvents() {
    if (!globalEventsBound || instances.size > 0) return;
    globalEventsBound = false;
    isComposing = false;
    window.removeEventListener('click', handleGlobalClick, true);
    window.removeEventListener('contextmenu', handleGlobalContextMenu, true);
    window.removeEventListener('touchstart', handleGlobalTouchStart);
    window.removeEventListener('scroll', handleGlobalScroll, true);
    window.removeEventListener('resize', handleGlobalResize);
    window.removeEventListener('keydown', handleGlobalKeyDown, true);
    window.removeEventListener('compositionstart', handleCompositionStart, true);
    window.removeEventListener('compositionend', handleCompositionEnd, true);
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
      window.visualViewport.removeEventListener('scroll', handleVisualViewportChange);
    }
  }

  function handleCompositionStart() {
    isComposing = true;
  }

  function handleCompositionEnd() {
    isComposing = false;
  }

  function isInsideTarget(inst, target) {
    return inst._isManagedTrigger(target);
  }

  function isEditableTarget(target) {
    return Boolean(target && (
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
      (target.closest && target.closest('[contenteditable="true"]'))
    ));
  }

  function handleGlobalClick(e) {
    instances.forEach(inst => {
      if (inst.options.closeOnOutsideClick && inst.visible && inst.menuEl && !inst.menuEl.contains(e.target) && !isInsideTarget(inst, e.target)) {
        inst.hide({ restoreFocus: inst.backdropEl === e.target });
      }
    });
  }

  function handleGlobalContextMenu(e) {
    instances.forEach(inst => {
      if (inst.options.closeOnOutsideClick && inst.visible && inst.menuEl && !inst.menuEl.contains(e.target) && !isInsideTarget(inst, e.target)) {
        inst.hide({ restoreFocus: inst.backdropEl === e.target });
      }
    });
  }

  function handleGlobalTouchStart(e) {
    instances.forEach(inst => {
      if (inst.options.closeOnOutsideClick && inst.visible && inst.menuEl && !inst.menuEl.contains(e.target) && !isInsideTarget(inst, e.target)) {
        inst.hide({ restoreFocus: inst.backdropEl === e.target });
      }
    });
  }

  function handleGlobalScroll(e) {
    instances.forEach(inst => {
      if (!inst.visible) return;
      const target = e && e.target;
      if (inst.menuEl && (target === inst.menuEl ||
          (target && target.nodeType && inst.menuEl.contains(target)))) return;
      if (inst.options.hideOnScroll) inst.hide();
      else if (inst.options.followScroll) inst._scheduleReposition();
    });
  }

  function handleGlobalResize(e) {
    instances.forEach(inst => {
      if (!inst.visible) return;
      if (inst.options.presentation === 'sheet' && e && e.target === window.visualViewport) {
        inst._scheduleReposition();
        return;
      }
      if (inst.options.hideOnResize) inst.hide();
      else inst._scheduleReposition();
    });
  }

  function handleVisualViewportChange(e) {
    instances.forEach(inst => {
      if (!inst.visible) return;
      if (inst.options.presentation === 'sheet') inst._scheduleReposition();
      else if (e.type === 'scroll') handleGlobalScroll(e);
      else handleGlobalResize(e);
    });
  }

  function handleGlobalKeyDown(e) {
    const activeInst = Array.from(instances).find(inst => inst.visible);
    if (!activeInst) return;

    if (e.key === 'Escape' && activeInst.options.closeOnEscape) {
      e.preventDefault();
      activeInst.hide({ restoreFocus: true });
      return;
    }

    if (e.key === 'Tab') {
      activeInst._handleTabNavigation(e);
      return;
    }

    if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter', ' '].includes(e.key)) {
      activeInst._handleKeyboardNavigation(e);
    } else if (!e.isComposing && e.keyCode !== 229 && !isComposing) {
      activeInst._handleTypeAhead(e);
    }
  }

  class PopMenu {
    constructor(target, options = {}) {
      this.options = Object.assign({
        items: [],
        customContent: null,
        layout: 'list',
        columns: 3,
        presentation: 'popover',
        backdrop: true,
        swipeToDismiss: true,
        scrollLock: true,
        inertBackground: true,
        sheetLabel: '閉じる',
        detents: ['content'],
        defaultDetent: 'content',
        onDetentChange: null,
        dismissThreshold: 0.25,
        dismissVelocity: 0.5,
        dismissDirection: 'vertical',
        trigger: 'contextmenu',
        delegate: null,
        toggle: false,
        preventDefaultTrigger: true,
        longPressDuration: 500,
        longPressMoveTolerance: 10,
        haptic: false,
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
        emptyText: '',
        role: null,
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
      this._validateDetents(this.options.detents);
      this.options.aria = Object.assign({ haspopup: 'menu', controls: null, expanded: true }, options.aria);
      this._placementExplicit = Object.prototype.hasOwnProperty.call(options, 'placement');
      this._hideOnScrollExplicit = Object.prototype.hasOwnProperty.call(options, 'hideOnScroll');
      this._hideOnResizeExplicit = Object.prototype.hasOwnProperty.call(options, 'hideOnResize');
      if (this.options.presentation === 'sheet') {
        if (!this._hideOnScrollExplicit) this.options.hideOnScroll = false;
        if (!this._hideOnResizeExplicit) this.options.hideOnResize = false;
      }

      this.targetEls = [];
      this.delegateRoot = null;
      this._sourceTarget = target;
      this.menuEl = null;
      this.arrowEl = null;
      this.backdropEl = null;
      this.sheetHandleEl = null;
      this._sheetDrag = null;
      this.visible = false;
      this.focusedIndex = -1;
      this.lastPosition = { x: 0, y: 0 };
      this.triggerOrigin = null;
      this.longPressTimer = null;
      this.longPressStart = null;
      this.longPressIdentifier = null;
      this.longPressTriggeredAt = 0;
      this._suppressNextContextMenu = false;
      this._suppressNextClick = false;
      this.currentFlipState = { flipX: false, flipY: false };
      this._originalAttributes = new Map();
      this._originalOpenClasses = new Map();
      this._managedTargets = new Set();
      this._rafId = null;
      this._rafIsTimeout = false;
      this._sheetCloseTimer = null;
      this._closing = null;
      this._closingToken = 0;
      this._scrollLockAcquired = false;
      this._inertRecords = [];
      this._warnedSheetOptions = false;
      this._appliedPopoverMaxHeight = null;
      this._appliedPopoverOverflowY = null;
      this.currentDetent = this.options.defaultDetent;
      this._showing = false;
      this._destroyed = false;
      this._typeAheadBuffer = '';
      this._typeAheadTimer = null;
      this._onSheetPointerDown = this._onSheetPointerDown.bind(this);
      this._onSheetPointerMove = this._onSheetPointerMove.bind(this);
      this._onSheetPointerUp = this._onSheetPointerUp.bind(this);
      this._onSheetPointerCancel = this._onSheetPointerCancel.bind(this);
      this._onSheetAnimationDone = this._onSheetAnimationDone.bind(this);
      this._onSheetAnimationCancel = this._onSheetAnimationCancel.bind(this);
      this._onBackdropTransitionDone = this._onBackdropTransitionDone.bind(this);
      this._onBackdropTransitionCancel = this._onBackdropTransitionCancel.bind(this);
      this._onSheetFocusIn = this._onSheetFocusIn.bind(this);

      this._initTargets(target);
      this.triggerOrigin = this.targetEls[0] || null;
      if (typeof document !== 'undefined') {
        this._createMenuElement();
        this._bindTargetEvents();
        this._syncTargetAttributes();
      }

      instances.add(this);
      bindGlobalEvents();
      this._warnIncompatibleSheetOptions(options);
    }

    static instancesCount() {
      return instances.size;
    }

    static autoInit(root = typeof document !== 'undefined' ? document : null) {
      if (!root || (root.nodeType !== 1 && root.nodeType !== 9) || typeof root.querySelectorAll !== 'function') {
        throw new TypeError('PopMenu.autoInit: root must be a Document or Element.');
      }
      if (declarativeInstances.has(root)) return declarativeInstances.get(root);

      const instance = new PopMenu(root, {
        trigger: 'click',
        delegate: '[data-pop-menu]',
        anchor: 'element',
        placement: 'bottom-start',
        onBeforeShow() {
          const trigger = this.triggerOrigin;
          if (!trigger) throw new Error('PopMenu.autoInit: show() requires an active data-pop-menu trigger.');
          const selector = trigger.getAttribute('data-pop-menu-items');
          const template = selector ? trigger.ownerDocument.querySelector(selector) : null;
          if (selector && (!template || template.tagName !== 'TEMPLATE' || !template.content)) {
            throw new Error(`PopMenu.autoInit: item template "${selector}" was not found.`);
          }
          this.options.placement = trigger.getAttribute('data-pop-menu-placement') || 'bottom-start';
          const itemElements = template ? template.content.querySelectorAll('[data-pop-item]') : [];
          this.setItems(Array.from(itemElements, element => {
            if (element.hasAttribute('data-pop-divider')) return { divider: true };
            if (element.hasAttribute('data-pop-group')) {
              return { group: element.getAttribute('data-pop-group') || element.textContent.trim() };
            }
            const labelElement = element.matches('[data-pop-label]')
              ? element
              : element.querySelector('[data-pop-label]');
            const item = {
              label: (labelElement || element).textContent.trim()
            };
            const stringAttributes = {
              id: 'data-pop-id',
              icon: 'data-pop-icon',
              role: 'data-pop-role',
              shortcut: 'data-pop-shortcut'
            };
            Object.keys(stringAttributes).forEach(key => {
              const value = element.getAttribute(stringAttributes[key]);
              if (value != null) item[key] = value;
            });
            ['checked', 'disabled', 'hidden', 'danger'].forEach(key => {
              const attribute = `data-pop-${key}`;
              if (element.hasAttribute(attribute)) {
                item[key] = !['false', '0', 'no', 'off'].includes(element.getAttribute(attribute).toLowerCase());
              }
            });
            return item;
          }));
        }
      });
      declarativeInstances.set(root, instance);
      return instance;
    }

    static autoDestroy(root) {
      if (root) {
        const instance = declarativeInstances.get(root);
        if (!instance) return 0;
        instance.destroy();
        return 1;
      }
      const currentInstances = Array.from(declarativeInstances.values());
      currentInstances.forEach(instance => instance.destroy());
      return currentInstances.length;
    }

    _initTargets(target) {
      if (typeof document === 'undefined') return;
      this.delegateRoot = null;
      this.targetEls = [];
      if (this.options.delegate) {
        if (typeof target === 'string') {
          this.delegateRoot = document.querySelector(target);
        } else if (target && (target.nodeType === 1 || target.nodeType === 9)) {
          this.delegateRoot = target;
        }
        if (!this.delegateRoot) throw new Error('PopMenu: delegate target was not found.');
        this.delegateRoot.querySelectorAll(this.options.delegate);
        return;
      }
      if (typeof target === 'string') {
        this.targetEls = Array.from(document.querySelectorAll(target));
      } else if (target && target.nodeType === 1) {
        this.targetEls = [target];
      } else if (target && (typeof NodeList !== 'undefined' && target instanceof NodeList || Array.isArray(target))) {
        this.targetEls = Array.from(target).filter(el => el && el.nodeType === 1);
      }
    }

    _getRole() {
      return this.options.role || (
        this.options.presentation === 'sheet' && this.options.backdrop || this.options.customContent
          ? 'dialog'
          : 'menu'
      );
    }

    _warnIncompatibleSheetOptions(options = {}) {
      if (this._warnedSheetOptions || this.options.presentation !== 'sheet') return;
      const hasConflict = this.options.anchor === 'element' ||
        (this._placementExplicit && this.options.placement !== 'bottom-start') ||
        this.options.arrow;
      if (!hasConflict) return;
      this._warnedSheetOptions = true;
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('PopMenu: anchor, placement, and arrow options are ignored by sheet presentation.');
      }
    }

    _resolveDelegateTarget(target) {
      if (!this.delegateRoot || !this.options.delegate) return null;
      const element = target && target.nodeType === 1 ? target : target && target.parentElement;
      const match = element && element.closest(this.options.delegate);
      if (!match) return null;
      if (this.delegateRoot.nodeType === 9 || this.delegateRoot === match || this.delegateRoot.contains(match)) return match;
      return null;
    }

    _isManagedTrigger(target) {
      if (this.delegateRoot) return Boolean(this._resolveDelegateTarget(target));
      return this.targetEls.some(el => el === target || el.contains(target));
    }

    _createMenuElement() {
      if (typeof document === 'undefined') return;
      this.menuEl = document.createElement('div');
      this.menuEl.id = `pop-menu-${++menuId}`;
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
      this.menuEl.addEventListener('animationend', this._onSheetAnimationDone);
      this.menuEl.addEventListener('animationcancel', this._onSheetAnimationCancel);
      this.menuEl.addEventListener('focusin', this._onSheetFocusIn);
      this._updateMenuAttributes();
      this._renderContent();
      document.body.appendChild(this.menuEl);
      this._syncPresentationElements();
    }

    _syncPresentationElements() {
      if (!this.menuEl || typeof document === 'undefined') return;
      const needsBackdrop = this.options.presentation === 'sheet' && this.options.backdrop;
      if (needsBackdrop && !this.backdropEl) {
        this.backdropEl = document.createElement('div');
        this.backdropEl.className = 'pm-sheet-backdrop';
        this.backdropEl.setAttribute('aria-hidden', 'true');
        this.backdropEl.style.position = 'fixed';
        this.backdropEl.style.inset = '0';
        this.backdropEl.style.display = 'none';
        this.backdropEl.addEventListener('transitionend', this._onBackdropTransitionDone);
        this.backdropEl.addEventListener('transitioncancel', this._onBackdropTransitionCancel);
      } else if (!needsBackdrop && this.backdropEl) {
        this.backdropEl.removeEventListener('transitionend', this._onBackdropTransitionDone);
        this.backdropEl.removeEventListener('transitioncancel', this._onBackdropTransitionCancel);
        this.backdropEl.remove();
        this.backdropEl = null;
        this._markClosingDone('backdrop');
      }

      if (this.backdropEl) {
        const zIndex = Number(this.options.zIndex);
        this.backdropEl.style.zIndex = String(Number.isFinite(zIndex) ? Math.max(1, zIndex - 1) : 999998);
        this.backdropEl.setAttribute('aria-hidden', 'true');
        if (this.menuEl.parentNode) this.menuEl.parentNode.insertBefore(this.backdropEl, this.menuEl);
        this._setPresentationVisibility(this.visible);
      }
    }

    _setPresentationVisibility(visible, closing = false) {
      if (!this.backdropEl) return;
      const shown = visible && this.options.presentation === 'sheet' && this.options.backdrop;
      this.backdropEl.style.display = shown || closing ? 'block' : 'none';
      this.backdropEl.setAttribute('aria-hidden', 'true');
      this.backdropEl.classList.toggle('is-visible', shown);
      if (!this._sheetDrag) this.backdropEl.style.opacity = '';
    }

    _syncModalEffects() {
      const activeModal = this.visible && this.options.presentation === 'sheet' && this.options.backdrop;
      const shouldLock = activeModal && this.options.scrollLock;
      const shouldInert = activeModal && this.options.inertBackground;
      if (shouldLock && !this._scrollLockAcquired) {
        acquireScrollLock();
        this._scrollLockAcquired = true;
      } else if (!shouldLock && this._scrollLockAcquired) {
        releaseScrollLock();
        this._scrollLockAcquired = false;
      }

      if (shouldInert) this._inertBackground();
      else this._restoreBackground();
    }

    _inertBackground() {
      if (!document.body || this._inertRecords.length) return;
      Array.from(document.body.children).forEach(element => {
        if (element === this.menuEl || element === this.backdropEl) return;
        if ('inert' in element) {
          if (element.inert) return;
          this._inertRecords.push({ element, kind: 'inert', original: false });
          element.inert = true;
          return;
        }
        if (element.getAttribute('aria-hidden') === 'true') return;
        this._inertRecords.push({
          element,
          kind: 'aria-hidden',
          original: element.hasAttribute('aria-hidden') ? element.getAttribute('aria-hidden') : null
        });
        element.setAttribute('aria-hidden', 'true');
      });
    }

    _restoreBackground() {
      this._inertRecords.forEach(record => {
        if (record.kind === 'inert') {
          if (record.element.inert === true) record.element.inert = record.original;
        } else if (record.element.getAttribute('aria-hidden') === 'true') {
          if (record.original == null) record.element.removeAttribute('aria-hidden');
          else record.element.setAttribute('aria-hidden', record.original);
        }
      });
      this._inertRecords = [];
    }

    _updateMenuAttributes() {
      if (!this.menuEl) return;
      const themeClass = this.options.theme && this.options.theme !== 'none' ? `theme-${this.options.theme}` : '';
      const layoutClass = this.options.customContent ? 'pm-layout-custom' : `pm-layout-${this.options.layout === 'grid' ? 'grid' : 'list'}`;
      const sheet = this.options.presentation === 'sheet';
      const showArrow = this.options.arrow && !sheet;
      const classes = ['pop-menu', themeClass, layoutClass, showArrow ? 'has-arrow' : '', sheet ? 'pm-presentation-sheet' : '', this.options.className].filter(Boolean);
      this.menuEl.className = classes.join(' ');
      this.menuEl.setAttribute('role', this._getRole());
      if (sheet && this.options.backdrop) this.menuEl.setAttribute('aria-modal', 'true');
      else this.menuEl.removeAttribute('aria-modal');
      if (this.options.ariaLabel) this.menuEl.setAttribute('aria-label', this.options.ariaLabel);
      else this.menuEl.removeAttribute('aria-label');
      this.menuEl.style.zIndex = String(this.options.zIndex);
      if (this.options.layout === 'grid') {
        this.menuEl.style.setProperty('--pm-columns', this.options.columns);
      } else {
        this.menuEl.style.removeProperty('--pm-columns');
      }

      if (showArrow && !this.arrowEl) {
        this.arrowEl = document.createElement('div');
        this.arrowEl.className = 'pm-arrow';
        this.menuEl.insertBefore(this.arrowEl, this.menuEl.firstChild);
      } else if (!showArrow && this.arrowEl) {
        this.arrowEl.remove();
        this.arrowEl = null;
      }
      if (this.arrowEl && showArrow && this.options.arrowOffset != null) {
        this.menuEl.style.setProperty('--pm-arrow-offset', `${Number(this.options.arrowOffset)}px`);
      } else if (this.menuEl) {
        this.menuEl.style.removeProperty('--pm-arrow-offset');
      }
    }

    _renderContent() {
      if (!this.menuEl || typeof document === 'undefined') return;
      Array.from(this.menuEl.childNodes).forEach(node => {
        if (node !== this.arrowEl) node.remove();
      });
      this.sheetHandleEl = null;

      if (this.options.presentation === 'sheet') {
        this.sheetHandleEl = document.createElement('div');
        this.sheetHandleEl.className = `pm-sheet-handle${this.options.swipeToDismiss ? '' : ' is-close-only'}`;
        this.sheetHandleEl.setAttribute('role', 'button');
        this.sheetHandleEl.setAttribute('tabindex', '0');
        this.sheetHandleEl.setAttribute('aria-label', this.options.sheetLabel || '閉じる');
        const handleBar = document.createElement('span');
        handleBar.className = 'pm-sheet-handle-bar';
        handleBar.setAttribute('aria-hidden', 'true');
        this.sheetHandleEl.appendChild(handleBar);
        if (this.options.swipeToDismiss) {
          this.sheetHandleEl.addEventListener('pointerdown', this._onSheetPointerDown);
          this.sheetHandleEl.addEventListener('pointermove', this._onSheetPointerMove);
          this.sheetHandleEl.addEventListener('pointerup', this._onSheetPointerUp);
          this.sheetHandleEl.addEventListener('pointercancel', this._onSheetPointerCancel);
        }
        this.menuEl.appendChild(this.sheetHandleEl);
      }

      if (this.options.customContent) {
        const customContainer = document.createElement('div');
        customContainer.className = 'pm-custom-container';
        if (this._getRole() === 'menu') customContainer.setAttribute('role', 'none');
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
      ul.className = 'pm-item-list';
      ul.setAttribute('role', 'presentation');
      const hasEnabledItems = items.some(item => !item.hidden && !item.disabled && !item.divider && !item.group);
      if (!hasEnabledItems && this.options.emptyText) {
        const empty = document.createElement('li');
        empty.className = 'pm-empty';
        empty.setAttribute('role', 'presentation');
        empty.textContent = this.options.emptyText;
        ul.appendChild(empty);
      }
      items.forEach((item, index) => {
        if (item.hidden) return;
        if (item.divider) {
          const divider = document.createElement('li');
          divider.className = 'pm-divider';
          divider.setAttribute('role', 'separator');
          ul.appendChild(divider);
          return;
        }
        if (item.group) {
          const group = document.createElement('li');
          group.className = 'pm-group-label';
          group.setAttribute('role', 'presentation');
          group.textContent = item.group;
          ul.appendChild(group);
          return;
        }

        const li = document.createElement('li');
        li.className = `pm-item ${item.disabled ? 'is-disabled' : ''} ${item.danger ? 'pm-danger' : ''} ${item.checked ? 'is-checked' : ''} ${item.className || ''}`.trim();
        const itemRole = ['menuitem', 'menuitemradio', 'menuitemcheckbox'].includes(item.role) ? item.role : 'menuitem';
        li.setAttribute('role', itemRole);
        li.setAttribute('tabindex', '-1');
        li.dataset.index = index;
        if (item.id != null) li.dataset.id = item.id;
        if (item.disabled) li.setAttribute('aria-disabled', 'true');
        if (itemRole === 'menuitemradio' || itemRole === 'menuitemcheckbox') {
          li.setAttribute('aria-checked', item.checked ? 'true' : 'false');
        }

        if (item.element && item.element.nodeType === 1) {
          li.appendChild(item.element);
        } else if (typeof item.html === 'string') {
          li.innerHTML = item.html;
        } else if (item.icon) {
          const iconContainer = document.createElement('span');
          iconContainer.className = 'pm-icon';
          this._renderIconContent(iconContainer, item.icon);
          li.appendChild(iconContainer);
        }
        if (!item.element && typeof item.html !== 'string') {
          if (item.label) {
            const labelSpan = document.createElement('span');
            labelSpan.className = 'pm-label';
            labelSpan.textContent = item.label;
            li.appendChild(labelSpan);
          }
          if (item.shortcut && this.options.layout !== 'grid') {
            const shortcutSpan = document.createElement('span');
            shortcutSpan.className = 'pm-shortcut';
            shortcutSpan.textContent = item.shortcut;
            li.appendChild(shortcutSpan);
          }
        }
        if (!item.disabled && !item.element) {
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
        img.className = 'pm-icon-img';
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
      this._onTouchMove = this._onTouchMove.bind(this);
      this._onTouchEnd = this._onTouchEnd.bind(this);
      if (this.options.trigger === 'manual') return;
      const roots = this.delegateRoot ? [this.delegateRoot] : this.targetEls;
      roots.forEach(el => {
        if (this.options.trigger === 'contextmenu') {
          el.addEventListener('contextmenu', this._onContextMenu);
        } else if (this.options.trigger === 'click') {
          el.addEventListener('click', this._onClick);
        } else if (this.options.trigger === 'longpress') {
          el.addEventListener('touchstart', this._onTouchStart, { passive: true });
          el.addEventListener('touchmove', this._onTouchMove, { passive: true });
          el.addEventListener('touchend', this._onTouchEnd);
          el.addEventListener('touchcancel', this._onTouchEnd);
          el.addEventListener('contextmenu', this._onContextMenu);
          el.addEventListener('click', this._onClick);
        }
      });
    }

    _unbindTargetEvents() {
      const roots = this.delegateRoot ? [this.delegateRoot] : this.targetEls;
      roots.forEach(el => {
        el.removeEventListener('contextmenu', this._onContextMenu);
        el.removeEventListener('click', this._onClick);
        el.removeEventListener('touchstart', this._onTouchStart);
        el.removeEventListener('touchmove', this._onTouchMove);
        el.removeEventListener('touchend', this._onTouchEnd);
        el.removeEventListener('touchcancel', this._onTouchEnd);
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
      this.targetEls.forEach(el => this._applyTargetAttributes(el));
    }

    _applyTargetAttributes(el) {
      if (!el || (this.delegateRoot && !this.targetEls.includes(el))) return;
      this._managedTargets.add(el);
      if (this.options.aria) {
        if (this.options.aria.haspopup) this._recordAttribute(el, 'aria-haspopup', this.options.aria.haspopup);
        else this._restoreManagedAttribute(el, 'aria-haspopup');
        if (this.options.aria.controls && !el.hasAttribute('aria-controls')) {
          this._recordAttribute(el, 'aria-controls', this.options.aria.controls);
        } else if (!el.hasAttribute('aria-controls') && this.menuEl) {
          this._recordAttribute(el, 'aria-controls', this.menuEl.id);
        }
        if (this.options.aria.expanded) this._recordAttribute(el, 'aria-expanded', this.visible && el === this.triggerOrigin ? 'true' : 'false');
        else this._restoreManagedAttribute(el, 'aria-expanded');
      }
      if (this.options.openClass) {
        if (!this._originalOpenClasses.has(el)) {
          this._originalOpenClasses.set(el, el.classList.contains(this.options.openClass));
        }
        el.classList.toggle(this.options.openClass, this.visible && el === this.triggerOrigin);
      }
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
      if (!this.options.aria || !this.options.aria.expanded) return;
      this._managedTargets.forEach(el => this._recordAttribute(el, 'aria-expanded', value && el === this.triggerOrigin ? 'true' : 'false'));
    }

    _writeOpenClass(value) {
      if (!this.options.openClass) return;
      this._managedTargets.forEach(el => {
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
      this._managedTargets.clear();
    }

    _onContextMenu(e) {
      const target = this._getEventTrigger(e);
      if (!target) return;
      if (this.options.trigger === 'longpress' && this._suppressNextContextMenu && target === this.triggerOrigin) {
        if (Date.now() - this.longPressTriggeredAt < 500) {
          e.preventDefault();
          this._suppressNextContextMenu = false;
          return;
        }
        this._suppressNextContextMenu = false;
        this._suppressNextClick = false;
      }
      e.preventDefault();
      this.lastPosition = { x: e.clientX, y: e.clientY };
      this._applyTargetAttributes(target);
      this._toggleOrShow(target);
    }

    _onClick(e) {
      const target = this._getEventTrigger(e);
      if (!target) return;
      if (this.options.trigger === 'longpress') {
        if (target === this.triggerOrigin && this._suppressNextClick && Date.now() - this.longPressTriggeredAt < 500) {
          e.preventDefault();
          this._suppressNextClick = false;
        } else if (Date.now() - this.longPressTriggeredAt >= 500 && target === this.triggerOrigin) {
          this._suppressNextContextMenu = false;
          this._suppressNextClick = false;
        }
        return;
      }
      if (this.options.preventDefaultTrigger) e.preventDefault();
      this.lastPosition = { x: e.clientX, y: e.clientY };
      this._applyTargetAttributes(target);
      this._toggleOrShow(target);
    }

    _getEventTrigger(e) {
      return this.delegateRoot ? this._resolveDelegateTarget(e.target) : e.currentTarget;
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
      this._cancelLongPress();
      const target = this._getEventTrigger(e);
      if (!target) return;
      this.triggerOrigin = target;
      this._applyTargetAttributes(target);
      this.longPressStart = { x: touch.clientX, y: touch.clientY };
      this.longPressIdentifier = touch.identifier;
      this.longPressTimer = setTimeout(() => {
        this.longPressTimer = null;
        this.longPressTriggeredAt = Date.now();
        this._suppressNextContextMenu = true;
        this._suppressNextClick = true;
        this.show(touch.clientX, touch.clientY);
        this.longPressStart = null;
        if (this.options.haptic && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
          navigator.vibrate(10);
        }
      }, this.options.longPressDuration);
    }

    _onTouchMove(e) {
      if (!this.longPressTimer || !this.longPressStart || e.touches.length !== 1) {
        this._cancelLongPress();
        return;
      }
      const touch = Array.from(e.touches).find(item => item.identifier === this.longPressIdentifier);
      if (!touch) {
        this._cancelLongPress();
        return;
      }
      const distance = Math.hypot(touch.clientX - this.longPressStart.x, touch.clientY - this.longPressStart.y);
      if (distance > this.options.longPressMoveTolerance) this._cancelLongPress();
    }

    _onTouchEnd() {
      this._cancelLongPress();
    }

    _cancelLongPress() {
      if (this.longPressTimer) clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
      this.longPressStart = null;
      this.longPressIdentifier = null;
    }

    show(x, y) {
      if (this._destroyed || this.visible || !this.menuEl || this._showing) return;
      this._showing = true;
      try {
        if (typeof this.options.onBeforeShow === 'function') this.options.onBeforeShow.call(this, this);
      } finally {
        this._showing = false;
      }
      if (this._sheetCloseTimer != null) {
        clearTimeout(this._sheetCloseTimer);
        this._sheetCloseTimer = null;
      }
      if (this._closing) {
        this._closing = null;
        this._sheetCloseTimer = null;
      }
      this.menuEl.classList.remove('is-closing');
      if (this.options.anchor === 'pointer' && typeof x === 'number' && typeof y === 'number') {
        this.lastPosition = { x, y };
      }
      instances.forEach(inst => {
        if (inst !== this && inst.visible) inst.hide({ restoreFocus: false });
      });
      this.menuEl.style.display = 'block';
      if (this.options.syncHidden) this.menuEl.hidden = false;
      this.menuEl.setAttribute('aria-hidden', 'false');
      this._setPresentationVisibility(true);
      this.visible = true;
      this._writeExpanded(true);
      this._writeOpenClass(true);
      this._reposition();
      if (!this.visible) return;
      this._setFocusedIndex(-1);
      this._focusInitial();
      this._syncModalEffects();
      if (typeof this.options.onShow === 'function') {
        this.options.onShow.call(this, { x: this.lastPosition.x, y: this.lastPosition.y });
      }
    }

    _onSheetPointerDown(e) {
      if (this.options.presentation !== 'sheet' || !this.options.swipeToDismiss ||
          (e.button != null && e.button !== 0)) return;
      const now = e.timeStamp || Date.now();
      this._sheetDrag = {
        pointerId: e.pointerId,
        startX: e.clientX || 0,
        startY: e.clientY,
        startTime: now,
        lastX: e.clientX || 0,
        lastY: e.clientY,
        lastTime: now
      };
      this.menuEl.classList.add('is-dragging');
      this.backdropEl && this.backdropEl.classList.add('is-dragging');
      if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId);
      e.preventDefault();
    }

    _onSheetPointerMove(e) {
      if (!this._sheetDrag || e.pointerId !== this._sheetDrag.pointerId) return;
      const moveTime = e.timeStamp || Date.now();
      const moveElapsed = Math.max(1, moveTime - this._sheetDrag.lastTime);
      this._sheetDrag.velocity = (e.clientY - this._sheetDrag.lastY) / moveElapsed;
      this._sheetDrag.lastTime = moveTime;
      this._sheetDrag.lastY = e.clientY;
      this._sheetDrag.lastX = e.clientX || 0;
      const distance = Math.max(0, e.clientY - this._sheetDrag.startY);
      this.menuEl.style.transform = `translateY(${distance}px)`;
      if (this.backdropEl) {
        const height = this.menuEl.getBoundingClientRect().height || window.innerHeight;
        this.backdropEl.style.opacity = String(Math.max(0, 1 - distance / height));
      }
    }

    _onSheetPointerUp(e) {
      if (!this._sheetDrag || e.pointerId !== this._sheetDrag.pointerId) return;
      const drag = this._sheetDrag;
      const dx = (e.clientX || 0) - drag.startX;
      const dy = e.clientY - drag.startY;
      const endTime = e.timeStamp || Date.now();
      const finalElapsed = endTime - drag.lastTime;
      const velocity = finalElapsed > 0
        ? (e.clientY - drag.lastY) / finalElapsed
        : drag.velocity || 0;
      const height = this.menuEl.getBoundingClientRect().height || window.innerHeight;
      this._resetSheetDrag();
      if (this.options.dismissDirection === 'vertical' && Math.abs(dx) > Math.abs(dy)) return;
      const threshold = Math.max(72, height * (Number(this.options.dismissThreshold) || 0.25));
      const dismissByDistance = dy >= threshold;
      const dismissByVelocity = dy >= 24 && velocity >= (Number(this.options.dismissVelocity) || 0.5);
      const detents = this._getSortedDetents();
      if (detents.length <= 1) {
        if (dismissByDistance || dismissByVelocity) this.hide({ restoreFocus: true });
        return;
      }

      const currentIndex = detents.findIndex(detent => detent.value === this.currentDetent);
      const current = detents[Math.max(0, currentIndex)];
      const targetHeight = current.height - dy;
      const lowest = detents[0];
      const distanceBelowLowest = lowest.height - targetHeight;
      if ((currentIndex <= 0 || distanceBelowLowest >= threshold) &&
          (dismissByDistance || dismissByVelocity)) {
        this.hide({ restoreFocus: true });
        return;
      }
      const nearest = detents.reduce((best, detent) =>
        Math.abs(detent.height - targetHeight) < Math.abs(best.height - targetHeight) ? detent : best
      );
      this.setDetent(nearest.value);
    }

    _onSheetPointerCancel(e) {
      if (this._sheetDrag && e.pointerId === this._sheetDrag.pointerId) this._resetSheetDrag();
    }

    _resetSheetDrag() {
      const drag = this._sheetDrag;
      if (drag && this.sheetHandleEl && this.sheetHandleEl.hasPointerCapture &&
          this.sheetHandleEl.hasPointerCapture(drag.pointerId)) {
        this.sheetHandleEl.releasePointerCapture(drag.pointerId);
      }
      this._sheetDrag = null;
      if (this.menuEl) {
        this.menuEl.classList.remove('is-dragging');
        this.menuEl.style.transform = '';
      }
      if (this.backdropEl) {
        this.backdropEl.classList.remove('is-dragging');
        this.backdropEl.style.opacity = '';
      }
    }

    _getDetents() {
      return this._validateDetents(this.options.detents);
    }

    _validateDetents(values) {
      if (!Array.isArray(values) || values.length === 0) {
        throw new TypeError('PopMenu: detents must be a non-empty array.');
      }
      const isValid = value => value === 'content' || value === 'half' || value === 'full' ||
        (typeof value === 'number' && Number.isFinite(value) && value > 0);
      if (values.some(value => !isValid(value))) {
        const invalid = values.find(value => !isValid(value));
        throw new TypeError(`PopMenu: invalid sheet detent "${String(invalid)}".`);
      }
      return Array.from(new Set(values));
    }

    _getDetentHeight(detent) {
      if (detent === 'content') return this.menuEl.scrollHeight || this.menuEl.getBoundingClientRect().height || 0;
      const viewport = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      if (detent === 'half') return viewport * 0.5;
      if (detent === 'full') return viewport;
      return viewport * detent / 100;
    }

    _getSortedDetents() {
      return this._getDetents()
        .map(value => ({ value, height: this._getDetentHeight(value) }))
        .sort((a, b) => a.height - b.height);
    }

    _applyDetent() {
      if (!this.menuEl || this.options.presentation !== 'sheet') return;
      const detents = this._getDetents();
      if (!detents.length) {
        this.currentDetent = 'content';
        this.menuEl.style.setProperty('--pm-sheet-height', 'auto');
        return;
      }
      if (!detents.includes(this.currentDetent)) {
        this.currentDetent = detents.includes(this.options.defaultDetent)
          ? this.options.defaultDetent
          : detents[0];
      }
      const height = this.currentDetent === 'content'
        ? `${this.menuEl.scrollHeight || this.menuEl.getBoundingClientRect().height || 0}px`
        : `${this._getDetentHeight(this.currentDetent)}px`;
      this.menuEl.style.setProperty('--pm-sheet-height', height);
    }

    getDetent() {
      return this.currentDetent;
    }

    setDetent(detent) {
      if (!this._getDetents().includes(detent)) {
        throw new RangeError(`PopMenu: unsupported sheet detent "${detent}".`);
      }
      const previous = this.currentDetent;
      this.currentDetent = detent;
      this._applyDetent();
      if (previous !== detent && typeof this.options.onDetentChange === 'function') {
        this.options.onDetentChange.call(this, detent, this);
      }
    }

    _onSheetFocusIn(e) {
      if (this.options.presentation !== 'sheet' || !e.target || e.target === this.menuEl) return;
      if (typeof e.target.scrollIntoView === 'function') {
        e.target.scrollIntoView({ block: 'nearest' });
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
      if (this.options.presentation === 'sheet') {
        const viewport = window.visualViewport;
        if (viewport) {
          this.menuEl.style.setProperty('--pm-vv-height', `${viewport.height}px`);
          this.menuEl.style.setProperty('--pm-vv-offset-top', `${viewport.offsetTop}px`);
          this.menuEl.style.bottom = 'calc(100vh - var(--pm-vv-offset-top) - var(--pm-vv-height))';
        } else {
          this.menuEl.style.removeProperty('--pm-vv-height');
          this.menuEl.style.removeProperty('--pm-vv-offset-top');
          this.menuEl.style.bottom = '0px';
        }
        this.menuEl.style.top = 'auto';
        this.menuEl.style.left = '0px';
        this.menuEl.style.right = '0px';
        this.menuEl.style.width = '100%';
        this.menuEl.style.maxHeight = 'calc(var(--pm-vv-height, 100dvh) - env(safe-area-inset-top, 0px) - 16px)';
        this.menuEl.style.overflowY = '';
        this._applyDetent();
        this.currentFlipState = { flipX: false, flipY: false };
        return;
      }
      this.menuEl.style.bottom = 'auto';
      this.menuEl.style.right = 'auto';
      this.menuEl.style.width = '';
      this.menuEl.style.height = '';
      this.menuEl.style.removeProperty('--pm-vv-height');
      this.menuEl.style.removeProperty('--pm-vv-offset-top');
      this.menuEl.style.removeProperty('--pm-sheet-height');
      if (this._appliedPopoverMaxHeight && this.menuEl.style.maxHeight === this._appliedPopoverMaxHeight) {
        this.menuEl.style.maxHeight = '';
      }
      if (this._appliedPopoverOverflowY && this.menuEl.style.overflowY === this._appliedPopoverOverflowY) {
        this.menuEl.style.overflowY = '';
      }
      this._appliedPopoverMaxHeight = null;
      this._appliedPopoverOverflowY = null;
      this.menuEl.classList.remove('pm-scrollable');
      if (!this._sheetDrag) this.menuEl.style.transform = '';
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
      const availableWidth = Math.max(0, boundary.right - boundary.left - padding * 2);
      const availableHeight = Math.max(0, boundary.bottom - boundary.top - padding * 2);
      let rect = this.menuEl.getBoundingClientRect();
      if (rect.height > availableHeight && !this.menuEl.style.maxHeight) {
        this._appliedPopoverMaxHeight = `${availableHeight}px`;
        this._appliedPopoverOverflowY = 'auto';
        this.menuEl.style.maxHeight = this._appliedPopoverMaxHeight;
        this.menuEl.style.overflowY = this._appliedPopoverOverflowY;
        this.menuEl.classList.add('pm-scrollable');
        rect = this.menuEl.getBoundingClientRect();
      }
      let width = rect.width;
      let height = rect.height;
      const safe = this.menuEl.style.visibility;
      if (!width || !height) {
        this.menuEl.style.visibility = 'hidden';
        const measured = this.menuEl.getBoundingClientRect();
        width = measured.width || width;
        height = measured.height || height;
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
          this.menuEl.classList.toggle('pm-arrow-top', !this.currentFlipState.flipY);
          this.menuEl.classList.toggle('pm-arrow-bottom', this.currentFlipState.flipY);
          this.menuEl.classList.toggle('pm-arrow-left', false);
          this.menuEl.classList.toggle('pm-arrow-right', false);
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
        this.menuEl.classList.toggle('pm-arrow-top', side === 'bottom');
        this.menuEl.classList.toggle('pm-arrow-bottom', side === 'top');
        this.menuEl.classList.toggle('pm-arrow-left', side === 'right');
        this.menuEl.classList.toggle('pm-arrow-right', side === 'left');
        if (this.options.arrowOffset == null && (side === 'top' || side === 'bottom')) {
          const center = anchorRect.left + anchorRect.width / 2 - left;
          this.menuEl.style.setProperty('--pm-arrow-offset', `${Math.max(12, Math.min(width - 12, center))}px`);
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
      this._resetSheetDrag();
      const reduceMotion = typeof window !== 'undefined' && typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const animateSheet = this.options.presentation === 'sheet' && !reduceMotion;
      const backdropWasVisible = Boolean(this.backdropEl && this.backdropEl.classList.contains('is-visible'));
      this.visible = false;
      this._syncModalEffects();
      const restoreFocus = options.restoreFocus === true ||
        (options.restoreFocus !== false && this.options.presentation === 'sheet' && this.options.backdrop);
      if (restoreFocus) this._restoreFocus();
      if (this.menuEl) {
        if (animateSheet) {
          this.menuEl.classList.add('is-closing');
          if (this.options.syncHidden) this.menuEl.hidden = false;
        } else {
          this.menuEl.style.display = 'none';
          this.menuEl.classList.remove('is-closing');
          if (this.options.syncHidden) this.menuEl.hidden = true;
        }
        this.menuEl.setAttribute('aria-hidden', 'true');
      }
      this._setPresentationVisibility(false, animateSheet);
      this.focusedIndex = -1;
      this._writeExpanded(false);
      this._writeOpenClass(false);
      this._cancelLongPress();
      this._clearTypeAhead();
      if (animateSheet) {
        const sheetDuration = this._readCssDuration(this.menuEl, '--pm-sheet-out-duration', 220);
        const backdropDuration = this.backdropEl
          ? this._readCssDuration(this.backdropEl, '--pm-backdrop-fade-duration', 250)
          : 0;
        const closing = {
          token: ++this._closingToken,
          sheetDone: sheetDuration <= 0,
          backdropDone: !backdropWasVisible || !this.backdropEl || backdropDuration <= 0,
          timer: null,
          finished: false
        };
        this._closing = closing;
        closing.timer = setTimeout(() => {
          if (!this._closing || this._closing.token !== closing.token) return;
          this._sheetCloseTimer = null;
          closing.sheetDone = true;
          closing.backdropDone = true;
          this._checkClosingComplete(closing.token);
        }, Math.max(sheetDuration, backdropDuration) + 100);
        this._sheetCloseTimer = closing.timer;
        this._checkClosingComplete(closing.token);
      } else if (this.options.presentation === 'sheet') {
        this._closing = null;
        this._finishSheetClose();
      }
      if (this._rafId != null) {
        if (this._rafIsTimeout) clearTimeout(this._rafId);
        else if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this._rafId);
        this._rafId = null;
      }
      if (typeof this.options.onHide === 'function') this.options.onHide.call(this);
    }

    _readCssDuration(element, property, fallback) {
      if (!element || typeof window === 'undefined' || !window.getComputedStyle) return fallback;
      const style = window.getComputedStyle(element);
      const value = style && style.getPropertyValue ? style.getPropertyValue(property) : '';
      const match = String(value).trim().match(/^(-?(?:\d+(?:\.\d*)?|\.\d+))(ms|s)$/);
      if (!match) return fallback;
      const amount = Number(match[1]);
      return match[2] === 's' ? amount * 1000 : amount;
    }

    _onSheetAnimationDone(e) {
      if (e.target !== this.menuEl || e.animationName !== 'pm-sheet-out' || !this._closing) return;
      this._markClosingDone('sheet', this._closing.token);
    }

    _onSheetAnimationCancel(e) {
      this._onSheetAnimationDone(e);
    }

    _onBackdropTransitionDone(e) {
      if (e.target !== this.backdropEl || e.propertyName !== 'opacity' || !this._closing) return;
      this._markClosingDone('backdrop', this._closing.token);
    }

    _onBackdropTransitionCancel(e) {
      this._onBackdropTransitionDone(e);
    }

    _markClosingDone(which, token) {
      if (!this._closing || this._closing.token !== token) return;
      if (which === 'sheet') this._closing.sheetDone = true;
      else this._closing.backdropDone = true;
      this._checkClosingComplete(token);
    }

    _checkClosingComplete(token) {
      const closing = this._closing;
      if (!closing || closing.token !== token || closing.finished ||
          !closing.sheetDone || !closing.backdropDone) return;
      this._finishSheetClose(token);
    }

    _finishSheetClose(token) {
      if (!this.menuEl || (token != null && (!this._closing || this._closing.token !== token))) return;
      if (this._closing && this._closing.finished) return;
      const closing = this._closing;
      if (closing) {
        closing.finished = true;
        if (closing.timer != null) clearTimeout(closing.timer);
        this._closing = null;
        this._sheetCloseTimer = null;
      }
      if (this.visible) return;
      this.menuEl.style.display = 'none';
      this.menuEl.classList.remove('is-closing');
      if (this.options.syncHidden) this.menuEl.hidden = true;
      this._setPresentationVisibility(false);
    }

    _restoreFocus() {
      const target = this.triggerOrigin;
      if (target && typeof target.focus === 'function' && target.isConnected !== false) target.focus();
    }

    setTarget(target) {
      if (this._destroyed) return;
      this._unbindTargetEvents();
      this._restoreTargetState();
      this._sourceTarget = target;
      this._initTargets(target);
      if (!this.targetEls.includes(this.triggerOrigin)) this.triggerOrigin = this.targetEls[0] || null;
      this._bindTargetEvents();
      this._syncTargetAttributes();
      if (this.visible) this._reposition();
    }

    setItems(items) {
      const previousChecked = new Map((this.options.items || [])
        .filter(item => item.id != null && typeof item.checked === 'boolean')
        .map(item => [item.id, item.checked]));
      this.options.items = Array.isArray(items) ? items.map(item => {
        if (item.id != null && !Object.prototype.hasOwnProperty.call(item, 'checked') && previousChecked.has(item.id)) {
          return Object.assign({}, item, { checked: previousChecked.get(item.id) });
        }
        return item;
      }) : [];
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
      const oldDelegate = this.options.delegate;
      const oldOpenClass = this.options.openClass;
      const oldPresentation = this.options.presentation;
      const oldSwipeToDismiss = this.options.swipeToDismiss;
      const oldBackdrop = this.options.backdrop;
      const safePatch = Object.assign({}, patch);
      delete safePatch.items;
      delete safePatch.customContent;
      if (Object.prototype.hasOwnProperty.call(safePatch, 'detents')) this._validateDetents(safePatch.detents);
      if (Object.prototype.hasOwnProperty.call(safePatch, 'placement')) this._placementExplicit = true;
      if (Object.prototype.hasOwnProperty.call(safePatch, 'hideOnScroll')) this._hideOnScrollExplicit = true;
      if (Object.prototype.hasOwnProperty.call(safePatch, 'hideOnResize')) this._hideOnResizeExplicit = true;
      if (safePatch.aria) safePatch.aria = Object.assign({}, this.options.aria, safePatch.aria);
      Object.assign(this.options, safePatch);
      if (!this._hideOnScrollExplicit) this.options.hideOnScroll = this.options.presentation !== 'sheet';
      if (!this._hideOnResizeExplicit) this.options.hideOnResize = this.options.presentation !== 'sheet';
      this._warnIncompatibleSheetOptions(safePatch);
      if (oldPresentation !== this.options.presentation || oldSwipeToDismiss !== this.options.swipeToDismiss ||
          oldBackdrop !== this.options.backdrop) this._resetSheetDrag();
      this._syncPresentationElements();
      if (Object.prototype.hasOwnProperty.call(safePatch, 'syncHidden') && this.menuEl) {
        if (this.options.syncHidden) this.menuEl.hidden = !this.visible;
        else this.menuEl.hidden = false;
      }
      if (oldTrigger !== this.options.trigger || oldDelegate !== this.options.delegate) {
        this._cancelLongPress();
        this._unbindTargetEvents();
        if (oldDelegate !== this.options.delegate) {
          this._restoreTargetState();
          this._initTargets(this._sourceTarget);
          if (!this.targetEls.includes(this.triggerOrigin)) this.triggerOrigin = this.targetEls[0] || null;
        }
        this._bindTargetEvents();
        this._syncTargetAttributes();
      }
      if (oldOpenClass !== this.options.openClass) {
        this._managedTargets.forEach(el => {
          if (oldOpenClass && !this._originalOpenClasses.get(el)) el.classList.remove(oldOpenClass);
        });
        this._originalOpenClasses.clear();
        this._writeOpenClass(this.visible);
      }
      this._syncTargetAttributes();
      this._updateMenuAttributes();
      this._renderContent();
      this._applyDetent();
      this._syncModalEffects();
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
      if (typeof item.onClick === 'function') item.onClick.call(this, item, e, this);
      if (typeof this.options.onSelect === 'function') this.options.onSelect.call(this, item, e);
    }

    _getEnabledItems() {
      if (!this.menuEl) return [];
      return Array.from(this.menuEl.querySelectorAll('.pm-item:not(.is-disabled)')).filter(el => {
        const item = this.options.items[Number(el.dataset.index)];
        return !item || !item.element;
      });
    }

    _getFocusableElements(container) {
      if (!container) return [];
      const selector = 'a[href], button:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [contenteditable="true"], [tabindex]:not([tabindex="-1"])';
      return Array.from(container.querySelectorAll(selector)).filter(el => {
        if (el.disabled || el.hidden || el.getAttribute('aria-hidden') === 'true' || (el.closest && el.closest('[hidden]'))) return false;
        if (typeof window !== 'undefined' && window.getComputedStyle) {
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden') return false;
        }
        return true;
      });
    }

    _focusInitial() {
      if (this.options.customContent) {
        const container = this.menuEl.querySelector('.pm-custom-container');
        const focusable = this._getFocusableElements(container)[0];
        if (focusable) focusable.focus();
        else this.menuEl.focus();
        return;
      }
      if (this._getEnabledItems().length) this._setFocusedIndex(0);
      else this.menuEl.focus();
    }

    _handleTabNavigation(e) {
      const role = this._getRole();
      const modalSheet = this.options.presentation === 'sheet' && this.options.backdrop;
      if (modalSheet) {
        let focusable = this._getFocusableElements(this.menuEl);
        const candidates = new Set([...focusable, ...this._getEnabledItems()]);
        if (this.sheetHandleEl) candidates.add(this.sheetHandleEl);
        focusable = [];
        const visit = element => {
          element.childNodes.forEach(child => {
            if (candidates.has(child)) focusable.push(child);
            visit(child);
          });
        };
        visit(this.menuEl);
        if (!focusable.length) {
          e.preventDefault();
          this.menuEl.focus();
          return;
        }
        const activeIndex = focusable.indexOf(document.activeElement);
        e.preventDefault();
        if (activeIndex === -1) {
          (e.shiftKey ? focusable[focusable.length - 1] : focusable[0]).focus();
        } else {
          const direction = e.shiftKey ? -1 : 1;
          const nextIndex = (activeIndex + direction + focusable.length) % focusable.length;
          focusable[nextIndex].focus();
        }
        return;
      }
      if (role === 'menu') {
        e.preventDefault();
        this.hide({ restoreFocus: true });
        return;
      }
      if (role !== 'dialog') return;
      const container = this.options.customContent ? this.menuEl.querySelector('.pm-custom-container') : this.menuEl;
      const focusable = this._getFocusableElements(container);
      if (!focusable.length) {
        e.preventDefault();
        this.menuEl.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeIndex = focusable.indexOf(document.activeElement);
      if (activeIndex === -1) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && (document.activeElement === first || document.activeElement === this.menuEl)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || document.activeElement === this.menuEl)) {
        e.preventDefault();
        first.focus();
      }
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
      const target = e.target && e.target.nodeType === 1 ? e.target : e.target && e.target.parentElement;
      if (target === this.sheetHandleEl && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        this.hide({ restoreFocus: true });
        return;
      }
      if (isEditableTarget(target)) return;
      if ((e.isComposing || e.keyCode === 229 || isComposing) && ['Enter', ' '].includes(e.key)) return;
      if (!this.menuEl || this.options.customContent || this._getRole() === 'dialog') return;
      const items = this._getEnabledItems();
      if (items.length === 0) return;
      const navigable = ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '].includes(e.key) ||
        (this.options.layout === 'grid' && ['ArrowLeft', 'ArrowRight'].includes(e.key));
      if (!navigable) return;
      const owner = target && target.closest('.pm-item');
      if (owner && this.options.items[Number(owner.dataset.index)] && this.options.items[Number(owner.dataset.index)].element) return;
      e.preventDefault();
      const cols = this.options.layout === 'grid' ? (this.options.columns || 3) : 1;
      const rtl = typeof document !== 'undefined' && document.dir === 'rtl';
      if (e.key === 'ArrowDown') this._setFocusedIndex(Math.min(items.length - 1, this.focusedIndex < 0 ? 0 : this.focusedIndex + cols));
      else if (e.key === 'ArrowUp') this._setFocusedIndex(Math.max(0, this.focusedIndex < 0 ? 0 : this.focusedIndex - cols));
      else if (e.key === 'ArrowRight' && this.options.layout === 'grid') this._setFocusedIndex(Math.max(0, Math.min(items.length - 1, this.focusedIndex < 0 ? 0 : this.focusedIndex + (rtl ? -1 : 1))));
      else if (e.key === 'ArrowLeft' && this.options.layout === 'grid') this._setFocusedIndex(Math.max(0, Math.min(items.length - 1, this.focusedIndex < 0 ? 0 : this.focusedIndex + (rtl ? 1 : -1))));
      else if (e.key === 'Home') this._setFocusedIndex(0);
      else if (e.key === 'End') this._setFocusedIndex(items.length - 1);
      else if ((e.key === 'Enter' || e.key === ' ') && this.focusedIndex >= 0 && this.focusedIndex < items.length) {
        const itemIndex = parseInt(items[this.focusedIndex].dataset.index, 10);
        const item = this.options.items[itemIndex];
        if (item) this._handleItemClick(item, e);
      }
    }

    _handleTypeAhead(e) {
      if (!this.visible || this._getRole() !== 'menu' || e.ctrlKey || e.metaKey || e.altKey ||
          e.isComposing || e.keyCode === 229 || isComposing ||
          typeof e.key !== 'string' || Array.from(e.key).length !== 1 || e.key === ' ') return;
      const target = e.target && e.target.nodeType === 1 ? e.target : e.target && e.target.parentElement;
      if (isEditableTarget(target)) return;

      const character = e.key.toLocaleLowerCase();
      if (this._typeAheadBuffer && this._typeAheadBuffer.split('').every(value => value === character)) {
        this._typeAheadBuffer = character;
      } else {
        this._typeAheadBuffer += character;
      }
      if (this._typeAheadTimer) clearTimeout(this._typeAheadTimer);
      this._typeAheadTimer = setTimeout(() => this._clearTypeAhead(), 500);

      const items = this._getEnabledItems();
      const findMatch = query => {
        for (let offset = 1; offset <= items.length; offset += 1) {
          const index = (this.focusedIndex + offset + items.length) % items.length;
          const itemIndex = Number(items[index].dataset.index);
          const item = this.options.items[itemIndex];
          const label = (item && typeof item.label === 'string' ? item.label : items[index].textContent).trim().toLocaleLowerCase();
          if (label.startsWith(query)) {
            this._setFocusedIndex(index);
            return true;
          }
        }
        return false;
      };

      if (!findMatch(this._typeAheadBuffer) && this._typeAheadBuffer.length > character.length) {
        this._typeAheadBuffer = character;
        findMatch(character);
      }
      e.preventDefault();
    }

    _clearTypeAhead() {
      if (this._typeAheadTimer) clearTimeout(this._typeAheadTimer);
      this._typeAheadTimer = null;
      this._typeAheadBuffer = '';
    }

    updateItems(items) {
      this.setItems(items);
    }

    destroy() {
      if (this._destroyed) return;
      this._destroyed = true;
      this.hide({ restoreFocus: false });
      this._closing = null;
      if (this._sheetCloseTimer != null) {
        clearTimeout(this._sheetCloseTimer);
        this._sheetCloseTimer = null;
      }
      this._unbindTargetEvents();
      this._cancelLongPress();
      this._clearTypeAhead();
      if (this._rafId != null) {
        if (this._rafIsTimeout) clearTimeout(this._rafId);
        else if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this._rafId);
      }
      this._syncModalEffects();
      this._restoreBackground();
      this._restoreTargetState();
      instances.delete(this);
      unbindGlobalEvents();
      if (this.menuEl) {
        this.menuEl.removeEventListener('animationend', this._onSheetAnimationDone);
        this.menuEl.removeEventListener('animationcancel', this._onSheetAnimationCancel);
        this.menuEl.removeEventListener('focusin', this._onSheetFocusIn);
      }
      if (this.backdropEl) {
        this.backdropEl.removeEventListener('transitionend', this._onBackdropTransitionDone);
        this.backdropEl.removeEventListener('transitioncancel', this._onBackdropTransitionCancel);
        if (this.backdropEl.parentNode) this.backdropEl.parentNode.removeChild(this.backdropEl);
      }
      if (this.menuEl && this.menuEl.parentNode) this.menuEl.parentNode.removeChild(this.menuEl);
      this.menuEl = null;
      this.arrowEl = null;
      this.backdropEl = null;
      this.sheetHandleEl = null;
      this.targetEls = [];
      this.triggerOrigin = null;
      declarativeInstances.forEach((instance, root) => {
        if (instance === this) declarativeInstances.delete(root);
      });
    }
  }

  return PopMenu;
}));
