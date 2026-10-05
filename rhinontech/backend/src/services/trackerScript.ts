/**
 * The script customers load: <script async defer src=".../t.js" data-key="rt_…">.
 *
 * Served as a string so it ships with the API and never needs a separate build or
 * CDN. It works out where to report from its own src (so one file serves beta,
 * prod and local), keeps two random ids in the visitor's browser — no cookies, no
 * personal data, nothing that needs a consent banner — and follows client-side
 * route changes so single-page apps are counted per page, not once.
 *
 * Plain ES5 on purpose: it runs on whatever page the customer has.
 */
export const TRACKER_SCRIPT = `(function () {
  "use strict";
  var d = document, w = window, s = d.currentScript;
  if (!s || w.__rhinonTracker) return;
  var key = s.getAttribute("data-key");
  if (!key) return;
  w.__rhinonTracker = true;

  // Honour the visitor's browser setting if the site owner asked us to.
  if (s.getAttribute("data-respect-dnt") === "true" && navigator.doNotTrack === "1") return;

  var endpoint;
  try { endpoint = new URL(s.src).origin + "/collect"; } catch (e) { return; }

  function uid() {
    try { if (w.crypto && w.crypto.randomUUID) return w.crypto.randomUUID(); } catch (e) {}
    return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12);
  }
  function stored(store, name) {
    try {
      var v = store.getItem(name);
      if (!v) { v = uid(); store.setItem(name, v); }
      return v;
    } catch (e) { return uid(); } // storage blocked: count the view, just not the repeat visit
  }

  var visitor = stored(w.localStorage, "rt_vid");
  var session = stored(w.sessionStorage, "rt_sid");
  var lastPath = null;
  var lastUrl = d.referrer || "";

  function send(body) {
    var json = JSON.stringify(body);
    try {
      // text/plain keeps it a "simple" request: no CORS preflight, and sendBeacon
      // survives the page closing.
      if (navigator.sendBeacon && navigator.sendBeacon(endpoint, new Blob([json], { type: "text/plain" }))) return;
    } catch (e) {}
    try {
      w.fetch(endpoint, { method: "POST", headers: { "Content-Type": "text/plain" }, body: json, keepalive: true, mode: "cors" })["catch"](function () {});
    } catch (e) {}
  }

  function track() {
    var path = w.location.pathname || "/";
    if (path === lastPath) return;
    lastPath = path;
    var q = new URLSearchParams(w.location.search);
    function utm(n) { return q.get(n) || undefined; }
    send({
      k: key,
      visitorId: visitor,
      sessionId: session,
      path: path,
      title: d.title || undefined,
      referrer: lastUrl || undefined,
      utmSource: utm("utm_source"),
      utmMedium: utm("utm_medium"),
      utmCampaign: utm("utm_campaign"),
      utmTerm: utm("utm_term"),
      utmContent: utm("utm_content")
    });
    lastUrl = w.location.href;
  }

  // Single-page apps change the URL without loading a page.
  function wrap(name) {
    var original = w.history[name];
    if (typeof original !== "function") return;
    w.history[name] = function () {
      var result = original.apply(this, arguments);
      setTimeout(track, 0); // let the app update document.title first
      return result;
    };
  }
  wrap("pushState");
  wrap("replaceState");
  w.addEventListener("popstate", function () { setTimeout(track, 0); });

  // A prerendered page is not a visit yet.
  if (d.visibilityState === "prerender") {
    d.addEventListener("visibilitychange", function once() {
      if (d.visibilityState !== "prerender") { d.removeEventListener("visibilitychange", once); track(); }
    });
  } else {
    track();
  }

  w.rhinon = { track: function () { lastPath = null; track(); } };
})();
`;
