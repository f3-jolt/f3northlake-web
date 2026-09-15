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

  // AO schedule: filter cards by workout type and day of week (combined)
  var typeBtns = document.querySelectorAll(".ao-filter[data-filter]");
  var dayBtns = document.querySelectorAll(".ao-filter[data-day]");
  if (typeBtns.length) {
    var aoCards = document.querySelectorAll(".ao-card");
    var filterState = { type: "all", day: "all" };

    function cardTypes(card) {
      return Array.prototype.map.call(card.querySelectorAll(".ao-type"), function (t) {
        return t.textContent.trim().toLowerCase();
      });
    }

    function cardDays(card) {
      var days = [];
      card.querySelectorAll(".ao-meta b").forEach(function (b) {
        var m = b.textContent.toLowerCase().match(/\b(mon|tue|wed|thu|fri|sat|sun)\b/g);
        if (m) days = days.concat(m);
      });
      return days;
    }

    function applyFilters() {
      aoCards.forEach(function (card) {
        var okType = filterState.type === "all" || cardTypes(card).indexOf(filterState.type) !== -1;
        var okDay = filterState.day === "all" || cardDays(card).indexOf(filterState.day) !== -1;
        card.style.display = okType && okDay ? "" : "none";
      });
    }

    typeBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        typeBtns.forEach(function (b) { b.classList.toggle("active", b === btn); });
        filterState.type = btn.dataset.filter;
        applyFilters();
      });
    });

    dayBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        dayBtns.forEach(function (b) { b.classList.toggle("active", b === btn); });
        filterState.day = btn.dataset.day;
        applyFilters();
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
