/* ============================================================
   PopMenu JS — Demo site
   - 右のコードをそのまま実行してプレビューに反映
   - 軽量なシンタックスハイライト
   - コピー、スクロールスパイ、トースト
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     Toast（デモ共通の log ヘルパー）
     ---------------------------------------------------------- */

  const toast = document.getElementById('toast');
  const toastText = toast ? toast.querySelector('.toast-text') : null;
  let toastTimer = 0;

  function log(message) {
    if (!toast || !toastText) return;
    toastText.textContent = String(message);
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 2400);
  }

  // customContent 内の onclick 属性からも呼べるように公開
  window.log = log;

  /* ----------------------------------------------------------
     Utilities
     ---------------------------------------------------------- */

  const escapeHtml = value => String(value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));

  const JS_KEYWORDS = new Set([
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'of', 'in',
    'new', 'class', 'extends', 'this', 'true', 'false', 'null', 'undefined',
    'typeof', 'instanceof', 'await', 'async', 'import', 'export', 'from',
    'default', 'try', 'catch', 'throw', 'while', 'do', 'switch', 'case',
    'break', 'continue', 'delete', 'void'
  ]);

  // `<pre>` 内のインデントを、共通の最小インデントぶんだけ解除する
  function normalizeCode(text) {
    const lines = String(text)
      .replace(/\t/g, '  ')
      .replace(/^\n+/, '')
      .replace(/\s+$/, '')
      .split('\n');

    let base = Infinity;
    lines.forEach(line => {
      if (!line.trim()) return;
      const indent = line.match(/^ */)[0].length;
      if (indent < base) base = indent;
    });
    if (!isFinite(base)) base = 0;

    return lines.map(line => line.slice(base)).join('\n');
  }

  /* ----------------------------------------------------------
     Syntax highlighting
     ---------------------------------------------------------- */

  function highlightJS(source) {
    const pattern = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(`(?:\\.|[^`\\])*`|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*")|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)/g;
    let out = '';
    let last = 0;
    let match;

    while ((match = pattern.exec(source))) {
      out += escapeHtml(source.slice(last, match.index));

      if (match[1]) {
        out += `<span class="tok-comment">${escapeHtml(match[1])}</span>`;
      } else if (match[2]) {
        out += `<span class="tok-string">${escapeHtml(match[2])}</span>`;
      } else if (match[3]) {
        out += `<span class="tok-number">${escapeHtml(match[3])}</span>`;
      } else {
        const word = match[4];
        const isCall = /^\s*\(/.test(source.slice(match.index + word.length));
        if (JS_KEYWORDS.has(word)) {
          out += `<span class="tok-keyword">${word}</span>`;
        } else if (/^[A-Z]/.test(word)) {
          out += `<span class="tok-class">${word}</span>`;
        } else if (isCall) {
          out += `<span class="tok-fn">${word}</span>`;
        } else if (source[match.index - 1] === '.') {
          out += `<span class="tok-prop">${word}</span>`;
        } else {
          out += word;
        }
      }

      last = pattern.lastIndex;
    }

    out += escapeHtml(source.slice(last));
    return out;
  }

  function highlightAttrs(raw) {
    const token = /([a-zA-Z_:][\w:.-]*)(\s*=\s*)("[^"]*"|'[^']*')|([a-zA-Z_:][\w:.-]*)|(\s+)|([\s\S])/g;
    let out = '';
    let match;

    while ((match = token.exec(raw))) {
      if (match[1]) {
        out += `<span class="tok-attr">${escapeHtml(match[1])}</span>`;
        out += escapeHtml(match[2]);
        out += `<span class="tok-string">${escapeHtml(match[3])}</span>`;
      } else if (match[4]) {
        out += `<span class="tok-attr">${escapeHtml(match[4])}</span>`;
      } else {
        out += escapeHtml(match[0]);
      }
    }

    return out;
  }

  function highlightHTML(source) {
    const tag = /(<!--[\s\S]*?-->)|(<\/?)([a-zA-Z][\w-]*)([^>]*?)(\/?>)/g;
    let out = '';
    let last = 0;
    let match;

    while ((match = tag.exec(source))) {
      out += escapeHtml(source.slice(last, match.index));

      if (match[1]) {
        out += `<span class="tok-comment">${escapeHtml(match[1])}</span>`;
      } else {
        out += `<span class="tok-punct">${escapeHtml(match[2])}</span>`;
        out += `<span class="tok-tag">${escapeHtml(match[3])}</span>`;
        out += highlightAttrs(match[4]);
        out += `<span class="tok-punct">${escapeHtml(match[5])}</span>`;
      }

      last = tag.lastIndex;
    }

    out += escapeHtml(source.slice(last));
    return out;
  }

  const LANGUAGES = {
    js: { label: 'JavaScript', highlight: highlightJS },
    html: { label: 'HTML', highlight: highlightHTML },
    bash: { label: 'Shell', highlight: highlightJS },
    css: { label: 'CSS', highlight: highlightJS }
  };

  /* ----------------------------------------------------------
     Clipboard
     ---------------------------------------------------------- */

  function fallbackCopy(text) {
    return new Promise((resolve, reject) => {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.top = '-1000px';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      try {
        const copied = document.execCommand('copy');
        if (copied) resolve();
        else reject(new Error('copy command failed'));
      } catch (error) {
        reject(error);
      } finally {
        area.remove();
      }
    });
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    }
    return fallbackCopy(text);
  }

  function flashCopied(button, originalHtml, timeout) {
    if (button.dataset.copying === 'true') return;
    button.dataset.copying = 'true';
    button.classList.add('is-copied');
    button.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i><span>コピーしました</span>';
    window.setTimeout(() => {
      button.innerHTML = originalHtml;
      button.classList.remove('is-copied');
      button.dataset.copying = 'false';
    }, timeout);
  }

  /* ----------------------------------------------------------
     Code blocks: highlight, copy bar, live run
     ---------------------------------------------------------- */

  const codeSources = new WeakMap();

  function setUpCodeBlocks() {
    document.querySelectorAll('pre.code').forEach(pre => {
      const source = normalizeCode(pre.textContent);
      codeSources.set(pre, source);

      const language = LANGUAGES[pre.dataset.lang] ? pre.dataset.lang : 'js';
      const config = LANGUAGES[language];

      pre.innerHTML = config.highlight(source);

      const block = pre.closest('.code-block');
      if (!block) return;

      const bar = document.createElement('div');
      bar.className = 'code-bar';

      const label = document.createElement('span');
      label.className = 'code-lang';
      label.textContent = config.label;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'copy-btn';
      button.innerHTML = '<i class="fa-regular fa-copy" aria-hidden="true"></i><span>コピー</span>';
      button.setAttribute('aria-label', `${config.label} のコードをコピー`);

      const originalHtml = button.innerHTML;
      button.addEventListener('click', () => {
        copyText(codeSources.get(pre) || '').then(() => {
          flashCopied(button, originalHtml, 1600);
        }).catch(() => {
          log('コピーできませんでした');
        });
      });

      bar.appendChild(label);
      bar.appendChild(button);
      block.insertBefore(bar, pre);
    });
  }

  function runDemos() {
    document.querySelectorAll('pre.code[data-run]').forEach(pre => {
      const source = codeSources.get(pre);
      if (!source) return;

      try {
        // 表示されているコードをそのまま実行する
        new Function('PopMenu', 'log', source)(window.PopMenu, log);
      } catch (error) {
        console.error('PopMenu demo failed:', error);
        const message = document.createElement('p');
        message.className = 'run-error';
        message.textContent = `サンプルの実行に失敗しました: ${error.message}`;
        pre.insertAdjacentElement('afterend', message);
      }
    });
  }

  /* ----------------------------------------------------------
     Small copy buttons (install command etc.)
     ---------------------------------------------------------- */

  function setUpQuickCopies() {
    document.querySelectorAll('[data-copy-text]').forEach(button => {
      const originalHtml = button.innerHTML;
      const originalLabel = button.getAttribute('aria-label');
      button.addEventListener('click', () => {
        copyText(button.dataset.copyText).then(() => {
          button.classList.add('is-copied');
          button.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i>';
          if (originalLabel) button.setAttribute('aria-label', 'コピーしました');
          window.setTimeout(() => {
            button.classList.remove('is-copied');
            button.innerHTML = originalHtml;
            if (originalLabel) button.setAttribute('aria-label', originalLabel);
          }, 1600);
        }).catch(() => {
          log('コピーできませんでした');
        });
      });
    });
  }

  /* ----------------------------------------------------------
     Header & category navigation
     ---------------------------------------------------------- */

  function setUpNavigation() {
    const header = document.getElementById('site-header');
    const links = Array.from(document.querySelectorAll('.category-nav a'));
    const sections = links
      .map(link => document.querySelector(link.getAttribute('href')))
      .filter(Boolean);

    let ticking = false;

    function update() {
      ticking = false;

      if (header) {
        header.classList.toggle('is-scrolled', window.scrollY > 6);
      }

      if (!sections.length) return;

      const offset = 140;
      let current = null;
      sections.forEach(section => {
        if (section.getBoundingClientRect().top <= offset) current = section;
      });

      links.forEach(link => {
        const isActive = Boolean(current) && link.getAttribute('href') === `#${current.id}`;
        link.classList.toggle('is-active', isActive);
        if (isActive) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    }

    function requestUpdate() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    update();
  }

  /* ----------------------------------------------------------
     Init
     ---------------------------------------------------------- */

  function init() {
    setUpCodeBlocks();
    setUpQuickCopies();
    runDemos();
    setUpNavigation();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
