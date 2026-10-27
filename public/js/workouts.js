// Workouts page: render the AO schedule from live F3 Nation data.
//
// Fetches /api/workouts (a Worker route that proxies the F3 Nation API) and
// rebuilds the .ao-grid cards from it. If the fetch fails for any reason, the
// static cards in the HTML stay in place as the fallback.

document.addEventListener("DOMContentLoaded", function () {
  var grid = document.querySelector(".ao-grid");
  if (!grid) return;

  fetch("/api/workouts")
    .then(function (res) {
      if (!res.ok) throw new Error("API " + res.status);
      return res.json();
    })
    .then(function (data) {
      if (!data || !Array.isArray(data.events) || data.events.length === 0) return;
      renderGrid(grid, data.events);
      pruneTypeFilters(data.events);
      updateMap(data.locations);
      document.dispatchEvent(new CustomEvent("ao:grid-updated"));
    })
    .catch(function () {
      // Keep the static fallback cards.
    });

  // Upcoming workouts: concrete instances for the next two days.
  var upSection = document.getElementById("upcoming");
  if (upSection) {
    fetch("/api/upcoming")
      .then(function (res) {
        if (!res.ok) throw new Error("API " + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!data || !Array.isArray(data.instances)) return;
        renderUpcoming(upSection, data);
      })
      .catch(function () {
        // Section stays hidden if the API is unavailable.
      });
  }

  function renderUpcoming(section, data) {
    var today = data.today;
    var now = parseInt(data.now, 10) || 0;

    // Drop today's workouts that already started (region time).
    var future = data.instances.filter(function (i) {
      if (!i.date) return false;
      if (i.date > today) return true;
      if (i.date < today) return false;
      var t = parseInt(String(i.startTime || "").replace(/[^0-9]/g, ""), 10);
      return isNaN(t) ? true : t > now;
    });

    // Group by date; show the next two days that have workouts.
    var byDate = {};
    var dates = [];
    future.forEach(function (i) {
      if (!byDate[i.date]) {
        byDate[i.date] = [];
        dates.push(i.date);
      }
      byDate[i.date].push(i);
    });
    dates = dates.slice(0, 2);
    if (!dates.length) return;

    section.querySelector(".up-days").innerHTML = dates.map(function (d) {
      return renderUpcomingDay(d, byDate[d], today);
    }).join("");
    section.hidden = false;
  }

  function renderUpcomingDay(dateStr, instances, today) {
    var d = new Date(dateStr + "T12:00:00");
    var full = d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    var diff = Math.round(
      (d - new Date(today + "T12:00:00")) / 86400000
    );
    var rel = diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : null;
    var head = rel
      ? '<span class="up-day-rel">' + rel + "</span> — " + full
      : full;

    var rows = instances.map(function (i) {
      var range = formatRange(i.startTime, i.endTime) || "Time TBD";
      var flag = "";
      if (i.exception === "different-time") {
        flag = '<span class="up-flag">Special time</span>';
      } else if (i.exception) {
        flag = '<span class="up-flag">Check Slack</span>';
      }
      var title = i.name && i.name.trim() ? i.name.trim() : i.ao || "Workout";
      var chips = (i.types || []).map(function (t) {
        return '<span class="ao-type' + typeClass(t) + '">' + escapeHtml(t) + "</span>";
      }).join("");
      var qLine =
        Array.isArray(i.qs) && i.qs.length
          ? '<div class="up-q">Q: <b>' + i.qs.map(escapeHtml).join(", ") + "</b></div>"
          : '<div class="up-q">Q: <b class="up-q-open">Open</b></div>';
      var sub = "";
      if (i.ao && title !== i.ao) {
        sub = "<b>" + escapeHtml(i.ao) + "</b>";
        if (i.location && i.location.name) sub += " — " + escapeHtml(i.location.name);
      } else if (i.location && i.location.name) {
        sub = escapeHtml(i.location.name);
      }
      var addr = fullAddress(i.location);
      var mapBtn = addr
        ? '<a class="btn btn-navy" href="https://www.google.com/maps/search/?api=1&query=' +
          encodeURIComponent(addr) +
          '" target="_blank" rel="noopener">Map It</a>'
        : "";
      var thumb = i.logo
        ? '<img class="up-logo" src="' + escapeHtml(i.logo) + '" alt="" loading="lazy">'
        : "";
      return (
        '<div class="up-row">' +
        thumb +
        '<div class="up-time">' + escapeHtml(range) + "</div>" +
        '<div class="up-what">' +
        "<h3>" + escapeHtml(title) + chips + flag + "</h3>" +
        (sub ? '<div class="up-ao">' + sub + "</div>" : "") +
        (addr ? '<div class="up-addr">' + escapeHtml(addr) + "</div>" : "") +
        qLine +
        "</div>" +
        mapBtn +
        "</div>"
      );
    }).join("");

    return (
      '<div class="up-day">' +
      '<h3 class="up-day-head">' + head + "</h3>" +
      '<div class="up-list">' + rows + "</div>" +
      "</div>"
    );
  }

  var DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  var DAY_LABEL = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" };

  function slugify(name) {
    return String(name || "")
      .toLowerCase()
      .replace(/^the\s+/, "")
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function dayKey(dayOfWeek) {
    var d = String(dayOfWeek || "").toLowerCase().slice(0, 3);
    return DAY_ORDER.indexOf(d) !== -1 ? d : null;
  }

  // "0530", "05:30" or "05:30:00" -> "5:30 AM"
  function formatTime(t) {
    var digits = String(t || "").replace(/[^0-9]/g, "");
    if (digits.length < 3) return null;
    if (digits.length === 3) digits = "0" + digits;
    var h = parseInt(digits.slice(0, 2), 10);
    var m = digits.slice(2, 4);
    var ampm = h >= 12 ? "PM" : "AM";
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + ":" + m + " " + ampm;
  }

  function formatRange(start, end) {
    var s = formatTime(start);
    var e = formatTime(end);
    if (!s) return null;
    if (!e) return s;
    // Drop the AM/PM on the start when it matches the end: "5:30–6:15 AM"
    var sParts = s.split(" ");
    var eParts = e.split(" ");
    if (sParts[1] === eParts[1]) return sParts[0] + "–" + e;
    return s + "–" + e;
  }

  function fullAddress(loc) {
    if (!loc) return null;
    var line = [loc.address, loc.address2].filter(Boolean).join(" ");
    var cityState = [loc.city, loc.state].filter(Boolean).join(", ");
    var parts = [line, cityState, loc.zip].filter(Boolean);
    return parts.length ? parts.join(", ") : null;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function typeClass(type) {
    var t = String(type || "").toLowerCase();
    return ["bootcamp", "ruck", "run"].indexOf(t) !== -1 ? " " + t : "";
  }

  // Re-center the embedded F3 Nation map on the region's live workout
  // locations: center on the bounding box, zoom to roughly fit it.
  function updateMap(locations) {
    var locs = (locations || []).filter(function (l) {
      return typeof l.lat === "number" && typeof l.lon === "number";
    });
    var iframe = document.querySelector(".map-embed iframe");
    if (!locs.length || !iframe) return;

    var lats = locs.map(function (l) { return l.lat; });
    var lons = locs.map(function (l) { return l.lon; });
    var latMin = Math.min.apply(null, lats);
    var latMax = Math.max.apply(null, lats);
    var lonMin = Math.min.apply(null, lons);
    var lonMax = Math.max.apply(null, lons);
    var lat = (latMin + latMax) / 2;
    var lon = (lonMin + lonMax) / 2;

    // Span in degrees (longitude corrected for latitude), padded 60%,
    // translated to a web-map zoom level and clamped to sane bounds.
    var span = Math.max(
      latMax - latMin,
      (lonMax - lonMin) * Math.cos((lat * Math.PI) / 180),
      0.02
    ) * 1.6;
    var zoom = Math.max(9, Math.min(13, Math.floor(Math.log(360 / span) / Math.LN2)));

    var src =
      "https://map.f3nation.com/?lat=" + lat.toFixed(4) +
      "&lon=" + lon.toFixed(4) +
      "&zoom=" + zoom;
    if (iframe.src !== src) iframe.src = src;
  }

  // Hide type-filter buttons for workout types the live data doesn't have
  // (e.g. the static page's 30/30 and Blackops buttons).
  function pruneTypeFilters(events) {
    var present = {};
    events.forEach(function (e) {
      (e.types || []).forEach(function (t) {
        present[String(t).toLowerCase()] = true;
      });
    });
    document.querySelectorAll(".ao-filter[data-filter]").forEach(function (btn) {
      var f = btn.dataset.filter;
      if (f !== "all" && !present[f]) btn.style.display = "none";
    });
  }

  function renderGrid(grid, events) {
    // Group events by AO name.
    var aoMap = {};
    var aoOrder = [];
    events.forEach(function (e) {
      var key = e.ao || e.name;
      if (!aoMap[key]) {
        aoMap[key] = { name: key, events: [] };
        aoOrder.push(key);
      }
      aoMap[key].events.push(e);
    });
    aoOrder.sort(function (a, b) {
      return slugify(a).localeCompare(slugify(b));
    });

    var html = aoOrder.map(function (key) {
      return renderCard(aoMap[key]);
    }).join("\n");

    grid.innerHTML = html;
  }

  function renderCard(ao) {
    // Distinct type badges across the AO's events.
    var badges = [];
    ao.events.forEach(function (e) {
      (e.types || []).forEach(function (t) {
        if (badges.indexOf(t) === -1) badges.push(t);
      });
    });

    // Group schedule lines by (types + time range): days collapse onto one line.
    var lines = {};
    var lineOrder = [];
    var addresses = [];
    ao.events.forEach(function (e) {
      var day = dayKey(e.dayOfWeek);
      var range = formatRange(e.startTime, e.endTime);
      var label = (e.types || []).join(" + ");
      var addr = fullAddress(e.location);
      if (addr && addresses.indexOf(addr) === -1) addresses.push(addr);
      if (!day || !range) return;
      var k = label + "|" + range;
      if (!lines[k]) {
        lines[k] = { days: [], range: range, label: label };
        lineOrder.push(k);
      }
      if (lines[k].days.indexOf(day) === -1) lines[k].days.push(day);
    });

    var multiType = badges.length > 1;
    lineOrder.forEach(function (k) {
      lines[k].days.sort(function (a, b) { return DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b); });
    });
    // Order schedule lines by their earliest day of the week.
    lineOrder.sort(function (a, b) {
      return DAY_ORDER.indexOf(lines[a].days[0]) - DAY_ORDER.indexOf(lines[b].days[0]);
    });
    var metaItems = lineOrder.map(function (k) {
      var l = lines[k];
      var dayText = l.days.map(function (d) { return DAY_LABEL[d]; }).join(" / ");
      var suffix = multiType && l.label ? " (" + escapeHtml(l.label) + ")" : "";
      return "<li><b>" + dayText + ":</b> " + escapeHtml(l.range) + suffix + "</li>";
    });

    if (!metaItems.length) {
      metaItems.push("<li><b>When:</b> TBD — announced in Slack</li>");
    }

    var mapBtn = "";
    if (addresses.length) {
      metaItems.push("<li><b>Where:</b> " + escapeHtml(addresses[0]) + "</li>");
      mapBtn =
        '<a class="btn btn-navy" href="https://www.google.com/maps/search/?api=1&query=' +
        encodeURIComponent(addresses[0]) +
        '" target="_blank" rel="noopener">Map It</a>';
    } else {
      metaItems.push("<li><b>Where:</b> Announced in Slack</li>");
    }

    // Background photo keyed by the AO's primary workout type, with the AO
    // logo from the F3 Nation API overlaid (screen blend drops its black
    // background, like the old transparent local logos).
    var logo = null;
    ao.events.some(function (e) {
      if (e.logo) logo = e.logo;
      return !!logo;
    });
    var TYPE_BG = { bootcamp: "/img/types/bootcamp.jpg", ruck: "/img/types/ruck.jpg", run: "/img/types/run.jpg" };
    var lowerBadges = badges.map(function (b) { return String(b).toLowerCase(); });
    // Any AO that rucks gets the ruck background; otherwise its primary type.
    var bg = lowerBadges.indexOf("ruck") !== -1
      ? TYPE_BG.ruck
      : TYPE_BG[lowerBadges[0]] || "/img/types/default.jpg";
    var imgHtml =
      '<img src="' + bg + '" alt="' + escapeHtml(ao.name) + ' AO" loading="lazy">' +
      (logo
        ? '<img class="ao-logo ao-logo-blend" src="' + escapeHtml(logo) + '" alt="" loading="lazy">'
        : "");

    var badgeHtml = badges.map(function (t) {
      return '<span class="ao-type' + typeClass(t) + '">' + escapeHtml(t) + "</span>";
    }).join("");

    return (
      '<div class="ao-card">' +
      '<div class="ao-img">' + imgHtml + "</div>" +
      '<div class="ao-body">' +
      '<div class="ao-types">' + badgeHtml + "</div>" +
      "<h3>" + escapeHtml(ao.name) + "</h3>" +
      '<ul class="ao-meta">' + metaItems.join("") + "</ul>" +
      mapBtn +
      "</div></div>"
    );
  }
});
