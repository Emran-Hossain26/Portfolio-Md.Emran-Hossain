/* ============================================================
   ADMIN PERFORMANCE MEASUREMENT — paste into DevTools Console
   while logged into the Admin Panel (preview or production).
   READ-ONLY: navigates admin routes, times each, counts auth
   requests. No data is changed.
   ============================================================ */
(async () => {
  const BASE = location.origin;
  const routes = ["/admin", "/admin/projects", "/admin/experience", "/admin/skills", "/admin/education", "/admin/seo"];
  const authPattern = /(auth\/v1\/user|rpc\/is_admin|rest\/v1\/admins)/;
  const out = [];

  for (const route of routes) {
    const authCounts = { user: 0, is_admin: 0, admins: 0 };
    const counter = (url) => {
      const u = String(url);
      if (u.includes("auth/v1/user")) authCounts.user++;
      if (u.includes("rpc/is_admin")) authCounts.is_admin++;
      if (u.includes("rest/v1/admins")) authCounts.admins++;
    };
    // instrument this navigation's requests
    const origFetch = window.fetch;
    window.fetch = function (...args) {
      try { counter(args[0] instanceof Request ? args[0].url : args[0]); } catch {}
      return origFetch.apply(this, args);
    };
    const origOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (m, u, ...rest) {
      try { counter(u); } catch {}
      return origOpen.apply(this, [m, u, ...rest]);
    };

    const t0 = performance.now();
    // SPA navigation via in-app links keeps it warm; direct goto = full nav
    window.location.hash = "";
    const resp = await fetch(BASE + route, { redirect: "follow" }).catch(() => null); // warm function
    const navStart = performance.now();
    // real client-side navigation: click the sidebar link if present
    const link = [...document.querySelectorAll("aside a")].find(a => a.getAttribute("href") === route || a.getAttribute("href")?.split("?")[0] === route);
    let clickToContent = null;
    if (link) {
      const tClick = performance.now();
      link.click();
      await new Promise((res) => {
        const obs = new MutationObserver(() => {
          if (performance.now() - tClick > 250) { obs.disconnect(); res(); }
        });
        obs.observe(document, { childList: true, subtree: true });
        setTimeout(() => { obs.disconnect(); res(); }, 8000);
      });
      clickToContent = Math.round(performance.now() - tClick);
    }
    const nav = performance.getEntriesByType("navigation").slice(-1)[0];
    const totalNav = Math.round(nav ? nav.domContentLoadedEventEnd : performance.now() - navStart);
    window.fetch = origFetch;
    XMLHttpRequest.prototype.open = origOpen;
    out.push({ route, authRequests: { ...authCounts }, clickToVisualFeedbackMs: clickToContent, totalNavigationMs: totalNav });
  }
  console.table(out);
  window.__adminPerfResults = out;
  console.log("COPY THE TABLE ABOVE — or run: copy(JSON.stringify(window.__adminPerfResults, null, 1))");
})();
