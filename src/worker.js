// Worker for the F3 Northlake site.
//
// Static assets in ./public are served directly by Cloudflare. This script
// only runs for routes that don't match an asset — it exposes a small
// read-only proxy to the F3 Nation API under /api/*, so the private API key
// (Worker secret F3_API_KEY) never reaches the browser.
//
// Setup:
//   npx wrangler secret put F3_API_KEY     (production)
//   echo 'F3_API_KEY=...' > .dev.vars      (local dev — gitignored)

const F3_API_BASE = "https://api.f3nation.com";

// How long the edge cache holds an API response before re-fetching upstream.
const CACHE_TTL_SECONDS = 900; // 15 minutes

// Bump when a route's response shape changes, so stale cached entries
// from older code are never served.
const CACHE_VERSION = "5";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      return handleApi(request, url, env, ctx);
    }
    return env.ASSETS.fetch(request);
  },
};

async function handleApi(request, url, env, ctx) {
  if (request.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }
  if (url.pathname === "/api/workouts") {
    return workouts(request, env, ctx);
  }
  if (url.pathname === "/api/upcoming") {
    return upcoming(request, env, ctx);
  }
  return json({ error: "Not found" }, 404);
}

// GET /api/workouts — the region's recurring weekly workouts, trimmed to the
// fields the site renders. Backed by F3 Nation's /v1/map/event/all.
async function workouts(request, env, ctx) {
  const cache = caches.default;
  // Normalize the cache key so query-string junk can't bust the cache.
  const cacheKey = new Request(new URL(`/api/workouts?cv=${CACHE_VERSION}`, request.url), { method: "GET" });
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  if (!env.F3_API_KEY) {
    return json({ error: "F3_API_KEY is not configured" }, 503);
  }

  const regionId = Number(env.F3_REGION_ID);
  let data, logos, locData;
  try {
    // Array params use the API's deepObject style: name[index]=value.
    [data, logos, locData] = await Promise.all([
      f3Fetch(
        "/v1/map/event/all",
        {
          "regionIds[0]": String(regionId),
          "statuses[0]": "active",
          pageSize: "100",
        },
        env
      ),
      aoLogos(regionId, env),
      f3Fetch(
        "/v1/location",
        {
          "regionIds[0]": String(regionId),
          "statuses[0]": "active",
          pageSize: "100",
        },
        env
      ),
    ]);
  } catch (err) {
    return json({ error: "Upstream request failed" }, 502);
  }

  // Region workout locations with coordinates, used to center the AO map.
  const locations = (locData.locations || [])
    .filter(
      (l) =>
        l.isActive !== false &&
        typeof l.latitude === "number" &&
        typeof l.longitude === "number"
    )
    .map((l) => ({
      id: l.id,
      name: l.locationName,
      lat: l.latitude,
      lon: l.longitude,
    }));

  const events = (data.events || [])
    // Belt and braces: keep only this region's active public events, even if
    // the upstream query filter is ignored or encoded differently.
    .filter(
      (e) =>
        e.isActive !== false &&
        e.isPrivate !== true &&
        (!Array.isArray(e.regions) ||
          e.regions.length === 0 ||
          e.regions.some((r) => Number(r.regionId) === regionId))
    )
    .map((e) => {
      const aoId =
        (Array.isArray(e.parents) && e.parents[0] && e.parents[0].parentId) ||
        null;
      const ao =
        (Array.isArray(e.parents) && e.parents[0] && e.parents[0].parentName) ||
        e.parent ||
        e.name;
      return {
      id: e.id,
      name: e.name,
      ao,
      logo: logos.byId[aoId] || logos.byName[String(ao).toLowerCase()] || null,
      dayOfWeek: e.dayOfWeek,
      startTime: e.startTime,
      endTime: e.endTime,
      types: (e.eventTypes || []).map((t) => t.eventTypeName),
      categories: (e.eventTypes || []).map((t) => t.eventCategory),
      location: {
        name: e.locationName,
        address: e.locationAddress,
        address2: e.locationAddress2,
        city: e.locationCity,
        state: e.locationState,
        zip: e.locationZip,
      },
      };
    });

  const body = json(
    { events, locations, updated: new Date().toISOString() },
    200,
    {
      "Cache-Control": `public, max-age=300, s-maxage=${CACHE_TTL_SECONDS}`,
    }
  );
  ctx.waitUntil(cache.put(cacheKey, body.clone()));
  return body;
}

// Authenticated GET against the F3 Nation API. Throws on any failure.
async function f3Fetch(path, params, env) {
  const u = new URL(F3_API_BASE + path);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  const res = await fetch(u, {
    headers: {
      Authorization: `Bearer ${env.F3_API_KEY}`,
      Client: env.F3_API_CLIENT,
    },
  });
  if (!res.ok) throw new Error(`Upstream ${res.status} for ${path}`);
  return res.json();
}

// AO logo URLs for the region, keyed by org id and lowercased name.
async function aoLogos(regionId, env) {
  const byId = {};
  const byName = {};
  try {
    const data = await f3Fetch(
      "/v1/org",
      {
        "orgTypes[0]": "ao",
        "parentOrgIds[0]": String(regionId),
        "statuses[0]": "active",
        pageSize: "100",
      },
      env
    );
    for (const o of data.orgs || []) {
      if (!o.logoUrl) continue;
      byId[o.id] = o.logoUrl;
      byName[String(o.name).toLowerCase()] = o.logoUrl;
    }
  } catch (err) {
    // Logos are decorative — serve schedule data without them rather than fail.
  }
  return { byId, byName };
}

// GET /api/upcoming — concrete event instances for the next few days
// (respects cancellations and one-off events). Backed by /v1/event-instance.
async function upcoming(request, env, ctx) {
  if (!env.F3_API_KEY) {
    return json({ error: "F3_API_KEY is not configured" }, 503);
  }

  // "Today" in the region's timezone, not UTC.
  const tz = env.F3_TIMEZONE || "America/Chicago";
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const today = fmt.format(new Date());
  const toDate = fmt.format(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));

  const cache = caches.default;
  const cacheKey = new Request(new URL(`/api/upcoming?cv=${CACHE_VERSION}&from=${today}`, request.url), { method: "GET" });
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  let raw, logos, eventsData;
  try {
    [raw, logos, eventsData] = await Promise.all([
      f3Fetch(
        "/v1/event-instance",
        {
          regionOrgId: env.F3_REGION_ID,
          startDate: today,
          startDateTo: toDate,
          pageSize: "100",
        },
        env
      ),
      aoLogos(Number(env.F3_REGION_ID), env),
      f3Fetch(
        "/v1/map/event/all",
        {
          "regionIds[0]": env.F3_REGION_ID,
          "statuses[0]": "active",
          pageSize: "100",
        },
        env
      ),
    ]);
  } catch (err) {
    return json({ error: "Upstream request failed" }, 502);
  }

  // Workout types live on the weekly series, not the instance: join by seriesId.
  const typesBySeries = {};
  for (const e of eventsData.events || []) {
    typesBySeries[e.id] = (e.eventTypes || []).map((t) => t.eventTypeName);
  }

  const instances = (raw.eventInstances || [])
    .filter(
      (i) =>
        i.isActive !== false &&
        i.isPrivate !== true &&
        i.seriesException !== "closed"
    )
    .map((i) => ({
      id: i.id,
      name: i.name,
      ao: i.aoName,
      logo: logos.byName[String(i.aoName || "").toLowerCase()] || null,
      types: typesBySeries[i.seriesId] || [],
      date: i.startDate,
      startTime: i.startTime,
      endTime: i.endTime,
      exception: i.seriesException,
      location: {
        name: i.locationName,
        address: i.locationAddress,
        address2: i.locationAddress2,
        city: i.locationCity,
        state: i.locationState,
      },
    }))
    .sort((a, b) =>
      (a.date + (a.startTime || "")).localeCompare(b.date + (b.startTime || ""))
    );

  // The Q (and Co-Qs) come from each instance's attendance records. Fetched in
  // parallel and tolerated as missing — the schedule matters more than the Q.
  await Promise.all(
    instances.map(async (inst) => {
      inst.qs = [];
      try {
        const att = await f3Fetch(
          `/v1/attendance/event-instance/${inst.id}`,
          {},
          env
        );
        inst.qs = (att.attendance || [])
          .filter((a) =>
            (a.attendanceTypes || []).some((t) =>
              String(t.type).toUpperCase().includes("Q")
            )
          )
          .map((a) => a.user && a.user.f3Name)
          .filter(Boolean);
      } catch (err) {
        // Leave qs empty.
      }
    })
  );

  // Current time in the region's timezone (HHMM), so the browser can drop
  // today's workouts that already started without trusting the visitor clock.
  const now = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date())
    .replace(":", "");

  const body = json(
    { instances, today, now, timezone: tz },
    200,
    { "Cache-Control": "public, max-age=300, s-maxage=300" }
  );
  ctx.waitUntil(cache.put(cacheKey, body.clone()));
  return body;
}

function json(obj, status = 200, headers = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  });
}
