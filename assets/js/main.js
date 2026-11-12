/* ==========================================================================
   Sobhakrita Fintech Solutions — site interactions
   Vanilla JS, no dependencies.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var INR = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
  var INR2 = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function formatINR(n) { return "₹" + INR.format(Math.round(n)); }

  /* ---------------- 1. Sticky header ---------------- */
  var header = $(".site-header");
  var toTop = $(".fab-top");
  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    if (header) header.classList.toggle("is-stuck", y > 8);
    if (toTop) toTop.classList.toggle("is-visible", y > 700);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ---------------- 2. Mobile drawer ---------------- */
  var navToggle = $(".nav-toggle");
  var drawer = $(".drawer");
  var lastFocus = null;

  function openNav() {
    document.body.classList.add("nav-open");
    if (navToggle) navToggle.setAttribute("aria-expanded", "true");
    lastFocus = document.activeElement;
    var first = drawer ? drawer.querySelector("a, button") : null;
    if (first) setTimeout(function () { first.focus(); }, 250);
  }
  function closeNav() {
    document.body.classList.remove("nav-open");
    if (navToggle) navToggle.setAttribute("aria-expanded", "false");
    if (lastFocus) lastFocus.focus();
  }
  if (navToggle) {
    navToggle.addEventListener("click", function () {
      document.body.classList.contains("nav-open") ? closeNav() : openNav();
    });
  }
  $$("[data-close-nav]").forEach(function (el) {
    el.addEventListener("click", closeNav);
  });
  if (drawer) {
    drawer.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeNav();
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeNav();
      $$(".has-menu.is-open").forEach(function (m) {
        m.classList.remove("is-open");
        var b = m.querySelector(".nav-link");
        if (b) b.setAttribute("aria-expanded", "false");
      });
    }
  });

  // Drawer sub-menu
  $$("[data-drawer-sub]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var sub = document.getElementById(btn.getAttribute("aria-controls"));
      var open = sub.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      var chev = btn.querySelector(".chev");
      if (chev) chev.style.transform = open ? "rotate(180deg)" : "";
    });
  });

  /* ---------------- 3. Desktop dropdown (click + keyboard) ---------------- */
  $$(".has-menu > .nav-link").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      if (window.innerWidth <= 980) return;
      e.preventDefault();
      var parent = btn.parentElement;
      var isOpen = parent.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      $$(".has-menu.is-open").forEach(function (m) {
        if (m !== parent) m.classList.remove("is-open");
      });
    });
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".has-menu")) {
      $$(".has-menu.is-open").forEach(function (m) { m.classList.remove("is-open"); });
    }
  });

  /* ---------------- 4. Active nav item ---------------- */
  var path = window.location.pathname.split("/").pop() || "index.html";
  if (path === "") path = "index.html";
  var navKey = "";
  if (path === "index.html") navKey = "home";
  else if (/^(personal|business|home|mortgage|car|education|industrial)-loan\.html$/.test(path) || path === "loans.html") navKey = "loans";
  else if (path === "about.html") navKey = "about";
  else if (path === "emi-calculator.html") navKey = "emi";
  else if (path === "contact.html" || path === "book-a-call.html" || path === "apply.html") navKey = "contact";
  else if (path === "careers.html") navKey = "careers";
  $$("[data-nav]").forEach(function (el) {
    if (el.getAttribute("data-nav") === navKey) {
      el.classList.add("is-active");
      el.setAttribute("aria-current", "page");
    }
  });

  /* ---------------- 5. Scroll reveal ---------------- */
  var revealEls = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------------- 6. Animated counters ---------------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var decimals = (el.getAttribute("data-count").split(".")[1] || "").length;
    var suffixEl = el.querySelector(".suffix");
    var textNode = el.firstChild && el.firstChild.nodeType === 3 ? el.firstChild : null;
    var start = null;
    var dur = 1500;
    function frame(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = target * eased;
      var str = decimals ? val.toFixed(decimals) : INR.format(Math.round(val));
      if (textNode) textNode.nodeValue = str;
      else el.textContent = str;
      if (suffixEl) el.appendChild(suffixEl);
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  var counters = $$("[data-count]");
  if (counters.length) {
    if ("IntersectionObserver" in window && !reduceMotion) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            cio.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      counters.forEach(function (c) { cio.observe(c); });
    } else {
      counters.forEach(function (c) {
        var suffix = c.querySelector(".suffix");
        c.textContent = c.getAttribute("data-count").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        if (suffix) c.appendChild(suffix);
      });
    }
  }

  /* ---------------- 7. Testimonial slider ---------------- */
  $$("[data-testi]").forEach(function (root) {
    var track = $(".testi-track", root);
    var slides = $$(".testi-slide", root);
    var dotsWrap = $(".testi-dots", root);
    var prev = $("[data-testi-prev]", root);
    var next = $("[data-testi-next]", root);
    if (!track || slides.length < 2) return;

    var index = 0;
    var timer = null;

    function visibleCount() {
      var w = window.innerWidth;
      return w <= 720 ? 1 : w <= 980 ? 2 : 3;
    }
    function maxIndex() { return Math.max(0, slides.length - visibleCount()); }

    function buildDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = "";
      for (var i = 0; i <= maxIndex(); i++) {
        var b = document.createElement("button");
        b.className = "testi-dot" + (i === index ? " is-active" : "");
        b.type = "button";
        b.setAttribute("aria-label", "Go to testimonial group " + (i + 1));
        b.addEventListener("click", function (i) {
          return function () { go(i); resetTimer(); };
        }(i));
        dotsWrap.appendChild(b);
      }
    }

    function go(i) {
      index = Math.max(0, Math.min(i, maxIndex()));
      var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 20;
      var step = slides[0].getBoundingClientRect().width + gap;
      track.style.transform = "translateX(" + (-index * step) + "px)";
      if (dotsWrap) {
        $$(".testi-dot", dotsWrap).forEach(function (d, di) {
          d.classList.toggle("is-active", di === index);
        });
      }
    }

    function startTimer() {
      if (reduceMotion) return;
      timer = setInterval(function () {
        go(index >= maxIndex() ? 0 : index + 1);
      }, 6500);
    }
    function resetTimer() { clearInterval(timer); startTimer(); }

    if (prev) prev.addEventListener("click", function () { go(index - 1 < 0 ? maxIndex() : index - 1); resetTimer(); });
    if (next) next.addEventListener("click", function () { go(index + 1 > maxIndex() ? 0 : index + 1); resetTimer(); });

    root.addEventListener("mouseenter", function () { clearInterval(timer); });
    root.addEventListener("mouseleave", startTimer);
    root.addEventListener("focusin", function () { clearInterval(timer); });
    root.addEventListener("focusout", startTimer);

    var rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () { buildDots(); go(Math.min(index, maxIndex())); }, 150);
    });

    buildDots();
    go(0);
    startTimer();

    // Basic swipe support
    var sx = 0, dx = 0;
    root.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; dx = 0; }, { passive: true });
    root.addEventListener("touchmove", function (e) { dx = e.touches[0].clientX - sx; }, { passive: true });
    root.addEventListener("touchend", function () {
      if (Math.abs(dx) > 45) { go(index + (dx < 0 ? 1 : -1)); resetTimer(); }
    });
  });

  /* ---------------- 8. EMI calculator ---------------- */
  function setupCalculator(root) {
    var amountNum = $("[data-emi-amount]", root);
    var amountRange = $("[data-range-amount]", root);
    var rateNum = $("[data-emi-rate]", root);
    var rateRange = $("[data-range-rate]", root);
    var tenureNum = $("[data-emi-tenure]", root);
    var tenureRange = $("[data-range-tenure]", root);
    if (!amountNum || !rateNum || !tenureNum) return;

    var outEmi = $("[data-out-emi]", root);
    var outInterest = $("[data-out-interest]", root);
    var outTotal = $("[data-out-total]", root);
    var outPrincipal = $("[data-out-principal]", root);
    var donutP = $("[data-donut-principal]", root);
    var donutI = $("[data-donut-interest]", root);
    var amortBody = $("[data-amort-body]", root.closest(".section") || document);
    var summary = $("[data-emi-summary]", root);

    // Sync a number input with a range input
    function pair(num, range, onChange) {
      if (!range) return;
      range.addEventListener("input", function () {
        num.value = range.value;
        paint(range);
        onChange();
      });
      num.addEventListener("input", function () {
        var v = parseFloat(num.value);
        if (!isNaN(v)) {
          range.value = v;
          paint(range);
          onChange();
        }
      });
      num.addEventListener("blur", function () {
        var min = parseFloat(num.min), max = parseFloat(num.max);
        var v = parseFloat(num.value);
        if (isNaN(v)) v = parseFloat(range.value);
        v = Math.min(Math.max(v, min), max);
        num.value = v;
        range.value = v;
        paint(range);
        onChange();
      });
    }

    function paint(range) {
      var min = parseFloat(range.min);
      var max = parseFloat(range.max);
      var pct = ((parseFloat(range.value) - min) / (max - min)) * 100;
      range.style.setProperty("--fill", pct + "%");
    }

    function compute() {
      var P = Math.max(0, parseFloat(amountNum.value) || 0);
      var annual = Math.max(0.1, parseFloat(rateNum.value) || 0);
      var years = Math.max(0.5, parseFloat(tenureNum.value) || 1);
      var n = Math.round(years * 12);
      var r = annual / 1200;
      var emi = r === 0 ? P / n : (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      var total = emi * n;
      var interest = total - P;

      if (outEmi) outEmi.innerHTML = formatINR(emi) + " <small>/ month</small>";
      if (outInterest) outInterest.textContent = formatINR(interest);
      if (outTotal) outTotal.textContent = formatINR(total);
      if (outPrincipal) outPrincipal.textContent = formatINR(P);
      if (summary) {
        summary.textContent = "For a loan of " + formatINR(P) + " at " + annual + "% p.a. for " + years +
          " year" + (years === 1 ? "" : "s") + ", your EMI is " + formatINR(emi) + ".";
      }

      // Donut
      if (donutP && donutI) {
        var C = 2 * Math.PI * 42;
        var pPct = total > 0 ? P / total : 1;
        donutP.setAttribute("stroke-dasharray", (pPct * C) + " " + C);
        donutI.setAttribute("stroke-dasharray", ((1 - pPct) * C) + " " + C);
        donutI.setAttribute("stroke-dashoffset", (-pPct * C).toFixed(2));
      }

      // Amortisation (year-wise)
      if (amortBody) {
        amortBody.innerHTML = "";
        var balance = P;
        var rows = Math.min(Math.ceil(n / 12), 30);
        for (var y = 1; y <= rows; y++) {
          var yearInterest = 0, yearPrincipal = 0;
          for (var m = 0; m < 12 && balance > 0.5; m++) {
            var intPart = balance * r;
            var prinPart = emi - intPart;
            if (prinPart > balance) prinPart = balance;
            yearInterest += intPart;
            yearPrincipal += prinPart;
            balance -= prinPart;
          }
          var tr = document.createElement("tr");
          tr.innerHTML = "<td><b>Year " + y + "</b></td><td>" + formatINR(yearPrincipal) +
            "</td><td>" + formatINR(yearInterest) + "</td><td>" + formatINR(Math.max(balance, 0)) + "</td>";
          amortBody.appendChild(tr);
        }
      }
    }

    pair(amountNum, amountRange, compute);
    pair(rateNum, rateRange, compute);
    pair(tenureNum, tenureRange, compute);
    if (amountRange) paint(amountRange);
    if (rateRange) paint(rateRange);
    if (tenureRange) paint(tenureRange);
    compute();

    // Loan-type presets on the full calculator page
    $$("[data-loan-tab]", root.closest(".section") || document).forEach(function (tab) {
      tab.addEventListener("click", function () {
        $$("[data-loan-tab]", tab.closest(".loan-tabs")).forEach(function (t) {
          t.classList.remove("is-active");
          t.setAttribute("aria-pressed", "false");
        });
        tab.classList.add("is-active");
        tab.setAttribute("aria-pressed", "true");

        var amount = parseFloat(tab.getAttribute("data-amount"));
        var rate = parseFloat(tab.getAttribute("data-rate"));
        var tenure = parseFloat(tab.getAttribute("data-tenure"));
        var maxAmount = parseFloat(tab.getAttribute("data-max-amount") || amount);
        var maxTenure = parseFloat(tab.getAttribute("data-max-tenure") || tenure);

        [amountNum, amountRange].forEach(function (el) {
          if (!el) return;
          el.max = maxAmount;
          el.value = amount;
        });
        [tenureNum, tenureRange].forEach(function (el) {
          if (!el) return;
          el.max = maxTenure;
          el.value = tenure;
        });
        [rateNum, rateRange].forEach(function (el) {
          if (!el) return;
          el.value = rate;
        });
        if (amountRange) paint(amountRange);
        if (rateRange) paint(rateRange);
        if (tenureRange) paint(tenureRange);
        compute();
      });
    });
  }

  $$("[data-calc]").forEach(setupCalculator);

  /* ---------------- 9. Forms ---------------- */
  function validateField(field) {
    var input = field.querySelector("input, select, textarea");
    if (!input) return true;
    var wrap = input.closest(".field") || field;
    var value = (input.value || "").trim();
    var ok = true;
    var msg = "";

    if (input.required && !value) {
      ok = false;
      msg = "This field is required.";
    } else if (value) {
      if (input.type === "email" && !/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(value)) {
        ok = false; msg = "Enter a valid email address.";
      }
      if (input.type === "url" && !/^https?:\/\/[^\s.]+\.[^\s]{2,}$/i.test(value)) {
        ok = false; msg = "Enter a full URL starting with http:// or https://.";
      }
      if (input.type === "date" && input.min && value < input.min) {
        ok = false; msg = "Choose today or a future date.";
      }
      if (input.type === "tel") {
        var digits = value.replace(/\D/g, "").replace(/^91/, "").replace(/^0/, "");
        if (!/^[6-9]\d{9}$/.test(digits)) { ok = false; msg = "Enter a valid 10-digit Indian mobile number."; }
      }
      if (input.type === "number") {
        var num = parseFloat(value);
        if (input.min !== "" && num < parseFloat(input.min)) { ok = false; msg = "Minimum is " + input.min + "."; }
        if (input.max !== "" && num > parseFloat(input.max)) { ok = false; msg = "Maximum is " + input.max + "."; }
      }
    }
    if (input.type === "checkbox" && input.required && !input.checked) {
      ok = false; msg = "Please tick this box to continue.";
    }

    wrap.classList.toggle("has-error", !ok);
    var err = wrap.querySelector(".field-error");
    if (err) err.textContent = msg || "Please check this field.";
    input.setAttribute("aria-invalid", ok ? "false" : "true");
    return ok;
  }

  $$("[data-lead-form]").forEach(function (form) {
    var fields = $$(".field, .check-field", form);
    fields.forEach(function (field) {
      var input = field.querySelector("input, select, textarea");
      if (input) {
        input.addEventListener("blur", function () { validateField(field); });
        input.addEventListener("input", function () {
          if (field.classList.contains("has-error")) validateField(field);
        });
      }
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      var firstBad = null;
      fields.forEach(function (field) {
        var valid = validateField(field);
        if (!valid && !firstBad) firstBad = field;
        ok = ok && valid;
      });

      if (!ok) {
        if (firstBad) {
          firstBad.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
          var i = firstBad.querySelector("input, select, textarea");
          if (i) i.focus({ preventScroll: true });
        }
        return;
      }

      // Honeypot check
      var hp = form.querySelector("[name='company_website']");
      if (hp && hp.value) return;

      var btn = form.querySelector("[type='submit']");
      if (btn) { btn.disabled = true; btn.dataset.label = btn.innerHTML; btn.innerHTML = "Sending…"; }

      /* ------------------------------------------------------------------
         INTEGRATION POINT
         This static build shows a local success message. To receive leads,
         POST the form to your CRM / Google Apps Script / Formspree endpoint:

         fetch("https://your-endpoint.example", {
           method: "POST",
           body: new FormData(form)
         }).finally(showSuccess);

         See README.md → "Connecting the forms".
      ------------------------------------------------------------------ */
      setTimeout(function () {
        var card = form.closest(".form-card") || form.parentElement;
        var success = card.querySelector(".form-success");
        form.style.display = "none";
        if (success) {
          success.classList.add("is-visible");
          success.setAttribute("tabindex", "-1");
          success.focus({ preventScroll: true });
          success.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
        }
        if (btn) { btn.disabled = false; btn.innerHTML = btn.dataset.label; }
        form.reset();
      }, 750);
    });
  });

  /* ---------------- 10. Current year ---------------- */
  $$("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------------- 11. Copy / print helpers ---------------- */
  $$("[data-print]").forEach(function (btn) {
    btn.addEventListener("click", function () { window.print(); });
  });

  /* ---------------- 12. Prefill loan type on apply page ---------------- */
  var params = new URLSearchParams(window.location.search);
  var loanParam = params.get("loan");
  if (loanParam) {
    var sel = document.getElementById("loanType");
    if (sel) {
      var opt = Array.prototype.find.call(sel.options, function (o) {
        return o.value.toLowerCase() === loanParam.toLowerCase();
      });
      if (opt) sel.value = opt.value;
    }
  }

  /* ---------------- 13. Careers: prefill role from listing link ---------------- */
  $$("[data-role]").forEach(function (link) {
    link.addEventListener("click", function () {
      var roleSelect = document.getElementById("crRole");
      if (!roleSelect) return;
      var wanted = link.getAttribute("data-role").toLowerCase();
      var match = Array.prototype.find.call(roleSelect.options, function (o) {
        return o.value.toLowerCase() === wanted || o.text.toLowerCase() === wanted;
      });
      if (match) {
        roleSelect.value = match.value;
        roleSelect.classList.remove("is-invalid");
        var field = roleSelect.closest(".field");
        if (field) field.classList.remove("has-error");
      }
    });
  });

  /* ---------------- 14. Date inputs cannot be in the past ---------------- */
  $$('input[type="date"]').forEach(function (input) {
    if (input.min) return;
    var now = new Date();
    var iso = now.getFullYear() + "-" +
      String(now.getMonth() + 1).padStart(2, "0") + "-" +
      String(now.getDate()).padStart(2, "0");
    input.min = iso;
  });

  /* ---------------- 15. Partner logo marquee pause toggle ---------------- */
  $$('[data-marquee]').forEach(function (marquee) {
    var toggle = marquee.parentElement && marquee.parentElement.querySelector('[data-marquee-toggle]');
    if (!toggle) return;
    var track = marquee.querySelector('.logo-track');
    if (!track) return;
    var label = toggle.querySelector('span');
    var icon = toggle.querySelector('use');
    var paused = false;

    function setPaused(next) {
      paused = next;
      track.classList.toggle('is-paused', paused);
      toggle.setAttribute('aria-pressed', String(paused));
      toggle.setAttribute('aria-label', paused ? 'Resume partner logo scroll' : 'Pause partner logo scroll');
      if (label) label.textContent = paused ? 'Play' : 'Pause';
      if (icon) icon.setAttribute('href', paused ? '#i-play' : '#i-pause');
    }

    toggle.addEventListener('click', function () { setPaused(!paused); });

    // Respect the visitor's reduced-motion preference.
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPaused(true);
    }
  });
})();
