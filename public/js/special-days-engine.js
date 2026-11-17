/* ==========================================================================
   Special Days — engine
   Resolves ?festival=<slug> or the current IST date, renders one illustrated
   greeting card, rotates slides, and remembers dismissal for the session.
   ========================================================================== */
(function () {
  'use strict';

  var REGISTRY = window.SPECIAL_DAYS_REGISTRY || [];
  var ALIASES = window.SPECIAL_DAYS_ALIASES || {};
  var LIB = window.SVG_LIBRARY || { patterns: {}, emblems: {}, decor: {} };
  var ART = window.SD_ART || {};
  var DEFS = window.SD_GOLD_DEFS || '';
  var STORAGE_PREFIX = 'sd_closed_';
  var ROTATE_MS = 5500;
  var FADE_MS = 250;

  var root = document.getElementById('special-day-root');
  if (!root || !REGISTRY.length) return;

  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (err) { /* ignore */ }

  /* ---------------- resolution ---------------- */

  function readPreview() {
    var value = null;
    try {
      value = new URLSearchParams(window.location.search).get('festival');
    } catch (err) { /* ignore */ }
    return value ? String(value).trim().toLowerCase() : null;
  }

  function bySlug(slug) {
    if (!slug) return null;
    var key = ALIASES[slug] || slug;
    for (var i = 0; i < REGISTRY.length; i++) {
      if (REGISTRY[i].slug === key) return REGISTRY[i];
    }
    return null;
  }

  function istDate() {
    var parts;
    try {
      parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).formatToParts(new Date());
    } catch (err) {
      parts = null;
    }
    if (parts) {
      var out = {};
      for (var i = 0; i < parts.length; i++) {
        if (parts[i].type === 'year' || parts[i].type === 'month' || parts[i].type === 'day') {
          out[parts[i].type] = parts[i].value;
        }
      }
      if (out.year && out.month && out.day) {
        return { ymd: out.year + '-' + out.month + '-' + out.day, md: out.month + '-' + out.day };
      }
    }
    var now = new Date();
    var m = String(now.getMonth() + 1).padStart(2, '0');
    var d = String(now.getDate()).padStart(2, '0');
    return { ymd: now.getFullYear() + '-' + m + '-' + d, md: m + '-' + d };
  }

  function byDate() {
    var today = istDate();
    var i;
    for (i = 0; i < REGISTRY.length; i++) {
      if (REGISTRY[i].date === today.ymd) return REGISTRY[i];
    }
    for (i = 0; i < REGISTRY.length; i++) {
      if (REGISTRY[i].date === today.md) return REGISTRY[i];
    }
    return null;
  }

  function wasClosed(slug) {
    try {
      return window.sessionStorage.getItem(STORAGE_PREFIX + slug) === '1';
    } catch (err) {
      return false;
    }
  }

  function markClosed(slug) {
    try {
      window.sessionStorage.setItem(STORAGE_PREFIX + slug, '1');
    } catch (err) { /* ignore */ }
  }

  var previewSlug = readPreview();
  if (previewSlug === 'none' || previewSlug === 'off' || previewSlug === '0') {
    return;
  }

  var entry = null;
  var isPreview = false;

  if (previewSlug) {
    entry = bySlug(previewSlug);
    isPreview = !!entry;
  }

  if (!entry) {
    entry = byDate();
    if (!entry) return;
  }

  if (!isPreview && wasClosed(entry.slug)) return;

  /* ---------------- rendering ---------------- */

  function el(tag, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  function svg(source) {
    var box = el('div');
    box.innerHTML = source || '';
    return box.firstElementChild;
  }

  function artBox(className, source) {
    if (!source) return null;
    var node = el('div', className);
    node.setAttribute('aria-hidden', 'true');
    var mark = svg(source);
    if (!mark) return null;
    node.appendChild(mark);
    return node;
  }

  function patternMarkup(key) {
    return LIB.patterns[key] || LIB.patterns.none || '';
  }

  function emblemMarkup(key) {
    return LIB.emblems[key] || LIB.emblems.sparkle || '';
  }

  function decorMarkup(key) {
    return LIB.decor[key] || '';
  }

  var card = el('section', 'sd-card ' + (entry.theme || 'theme-royal'));
  card.setAttribute('role', 'region');
  card.setAttribute('aria-label', 'Special Day Greeting');
  card.setAttribute('data-decor', entry.decor || 'none');

  /* cream sky with fireworks either side of the arch */
  var fireLeft = artBox('sd-fireworks sd-fireworks--left', ART.fireworks);
  if (fireLeft) card.appendChild(fireLeft);

  var fireRight = artBox('sd-fireworks sd-fireworks--right', ART.fireworks);
  if (fireRight) card.appendChild(fireRight);

  var panel = el('div', 'sd-panel');

  /* marigold garland hugging the arch dome + side strands */
  var archArt = artBox('sd-archart', ART.archGarland);
  if (archArt) panel.appendChild(archArt);

  /* lanterns hanging inside the arch shoulders */
  var lanternLeft = artBox('sd-lantern sd-lantern--left', ART.lantern);
  if (lanternLeft) panel.appendChild(lanternLeft);

  var lanternRight = artBox('sd-lantern sd-lantern--right', ART.lantern);
  if (lanternRight) panel.appendChild(lanternRight);

  /* greeting copy */
  var content = el('div', 'sd-content');

  var eyebrow = el('div', 'sd-eyebrow');
  var title = el('h2', 'sd-title');
  var subtitle = el('p', 'sd-subtitle');

  content.appendChild(eyebrow);
  content.appendChild(title);
  content.appendChild(subtitle);
  panel.appendChild(content);

  /* the day's own ornament, resting on the arch base */
  var decorBox = artBox('sd-decor', decorMarkup(entry.decor));
  if (decorBox) panel.appendChild(decorBox);

  var dots = el('div', 'sd-dots');
  dots.setAttribute('role', 'tablist');
  dots.setAttribute('aria-label', 'Greeting slides');
  panel.appendChild(dots);

  var closeBtn = el('button', 'sd-close');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close greeting');
  closeBtn.innerHTML = '&times;';

  card.appendChild(panel);
  card.appendChild(closeBtn);

  if (DEFS) {
    var defsBox = svg(DEFS);
    if (defsBox) root.appendChild(defsBox);
  }
  root.appendChild(card);
  root.setAttribute('data-active', 'true');
  root.setAttribute('data-slug', entry.slug);

  var slides = entry.slides || [];
  var index = 0;
  var timer = null;
  var paused = false;
  var manual = false;

  function paint(i) {
    var slide = slides[i];
    if (!slide) return;
    eyebrow.textContent = slide.eyebrow || '';
    title.textContent = slide.title || '';
    subtitle.textContent = slide.subtitle || '';
  }

  function syncDots() {
    var buttons = dots.children;
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-selected', i === index ? 'true' : 'false');
      buttons[i].tabIndex = i === index ? 0 : -1;
    }
  }

  if (slides.length > 1) {
    for (var d = 0; d < slides.length; d++) {
      (function (i) {
        var dot = el('button');
        dot.type = 'button';
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', 'Greeting ' + (i + 1) + ' of ' + slides.length);
        dot.addEventListener('click', function () {
          manual = true;
          stopTimer();
          goTo(i, true);
        });
        dots.appendChild(dot);
      })(d);
    }
  }

  function goTo(i, immediate) {
    if (!slides.length || i === index) {
      if (immediate) syncDots();
      return;
    }
    if (immediate || reduceMotion) {
      index = i;
      paint(index);
      syncDots();
      return;
    }
    content.classList.add('is-fading');
    window.setTimeout(function () {
      index = i;
      paint(index);
      syncDots();
      content.classList.remove('is-fading');
    }, FADE_MS);
  }

  function advance() {
    if (slides.length < 2) return;
    goTo((index + 1) % slides.length, false);
  }

  function stopTimer() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  function startTimer() {
    stopTimer();
    if (slides.length < 2 || paused || manual || reduceMotion) return;
    timer = window.setInterval(advance, ROTATE_MS);
  }

  paint(0);
  syncDots();
  startTimer();

  card.addEventListener('mouseenter', function () {
    paused = true;
    stopTimer();
  });
  card.addEventListener('mouseleave', function () {
    paused = false;
    startTimer();
  });
  card.addEventListener('focusin', function () {
    paused = true;
    stopTimer();
  });
  card.addEventListener('focusout', function (event) {
    if (!card.contains(event.relatedTarget)) {
      paused = false;
      startTimer();
    }
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      stopTimer();
    } else {
      startTimer();
    }
  });

  closeBtn.addEventListener('click', function () {
    stopTimer();
    if (!isPreview) markClosed(entry.slug);
    root.classList.add('sd-leaving');
    var finish = function () {
      root.classList.remove('sd-leaving');
      root.removeAttribute('data-active');
      root.style.display = 'none';
      card.setAttribute('hidden', '');
    };
    if (reduceMotion) {
      finish();
      return;
    }
    window.setTimeout(finish, 300);
  });

  /* expose a tiny hook for QA scripts */
  window.specialDays = {
    slug: entry.slug,
    slides: slides.length,
    preview: isPreview,
    next: function () { manual = true; stopTimer(); advance(); },
    goTo: function (i) { manual = true; stopTimer(); goTo(i, true); }
  };
})();
