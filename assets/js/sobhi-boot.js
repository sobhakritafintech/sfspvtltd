/* Lightweight chat launcher: loads the full assistant only when needed. */
(function () {
  "use strict";

  var CHAT_SRC = "assets/js/sobhi-chat.js?v=20261114c";
  var loading = false;
  var loaded = false;
  var pendingOpen = false;

  var pill = document.getElementById("sfsGreetingPill");
  if (pill) {
    setTimeout(function () { pill.classList.add("is-hidden"); }, 5000);
  }

  function startChat() {
    pendingOpen = true;
    if (loaded) {
      pendingOpen = false;
      window.dispatchEvent(new Event("sobhi:open"));
      return;
    }
    if (loading) return;
    loading = true;
    var script = document.createElement("script");
    script.src = CHAT_SRC;
    script.defer = true;
    script.onload = function () {
      loaded = true;
      loading = false;
      if (pendingOpen) {
        pendingOpen = false;
        window.dispatchEvent(new Event("sobhi:open"));
      }
    };
    script.onerror = function () {
      loading = false;
      pendingOpen = false;
    };
    document.head.appendChild(script);
  }

  function preload() {
    if (loaded || loading) return;
    startChat();
    pendingOpen = false;
  }

  // Warm the module when a visitor shows intent, without blocking the page.
  document.addEventListener("pointerover", function (event) {
    var target = event.target.closest ? event.target.closest("[data-sobhi-toggle]") : null;
    if (target) preload();
  }, { passive: true });

  document.addEventListener("focusin", function (event) {
    var target = event.target.closest ? event.target.closest("[data-sobhi-toggle]") : null;
    if (target) preload();
  });

  // Capture the very first click so the panel opens as soon as the script lands.
  document.addEventListener("click", function (event) {
    var target = event.target.closest ? event.target.closest("[data-sobhi-toggle]") : null;
    if (!target || loaded) return;
    event.preventDefault();
    event.stopPropagation();
    startChat();
  }, true);
})();
