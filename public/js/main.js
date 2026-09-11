document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", nav.classList.contains("open"));
    });
  }

  // Lite video embed: load the YouTube player only when the facade is clicked
  document.querySelectorAll(".video-facade").forEach(function (facade) {
    facade.addEventListener("click", function () {
      var iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube.com/embed/" + facade.dataset.videoId + "?autoplay=1";
      iframe.title = facade.dataset.videoTitle || "Video";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      facade.replaceWith(iframe);
    }, { once: true });
  });

  // AO schedule: filter cards by workout type
  var filterBtns = document.querySelectorAll(".ao-filter");
  if (filterBtns.length) {
    var aoCards = document.querySelectorAll(".ao-card");
    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        filterBtns.forEach(function (b) { b.classList.toggle("active", b === btn); });
        var f = btn.dataset.filter;
        aoCards.forEach(function (card) {
          var types = Array.prototype.map.call(card.querySelectorAll(".ao-type"), function (t) {
            return t.textContent.trim().toLowerCase();
          });
          card.style.display = (f === "all" || types.indexOf(f) !== -1) ? "" : "none";
        });
      });
    });
  }

  // Theme toggle: dark | light | system (system = follow OS preference)
  var buttons = document.querySelectorAll(".theme-toggle button");
  if (buttons.length) {
    function applyTheme(mode) {
      if (mode === "dark" || mode === "light") {
        document.documentElement.dataset.theme = mode;
      } else {
        delete document.documentElement.dataset.theme;
      }
      buttons.forEach(function (b) {
        var active = b.dataset.setTheme === mode;
        b.classList.toggle("active", active);
        b.setAttribute("aria-pressed", active);
      });
    }

    var saved = "system";
    try { saved = localStorage.getItem("theme") || "system"; } catch (e) {}
    if (saved !== "dark" && saved !== "light") saved = "system";
    applyTheme(saved);

    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        var mode = b.dataset.setTheme;
        try { localStorage.setItem("theme", mode); } catch (e) {}
        applyTheme(mode);
      });
    });
  }
});
