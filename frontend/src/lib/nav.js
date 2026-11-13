/* ── Tiny SPA navigation helper ────────────────────────────────
   MindForm uses real paths (/privacy, /docs/mcp, …) served by the
   Express SPA fallback in production. Every component navigates by
   pushing a path and nudging App.jsx's popstate listener — one code
   path, no router dependency. Always resets scroll to the top so a
   new page never opens at the previous page's scroll offset.     */

export function navigateTo(path) {
  if (window.location.pathname !== path) {
    try { window.history.pushState({}, '', path) } catch { /* noop */ }
  }
  // App.jsx listens for popstate to re-read window.location.pathname
  try { window.dispatchEvent(new PopStateEvent('popstate')) } catch { /* Safari <15 */ }
  window.scrollTo(0, 0)
}

/* Known top-level routes — anything else renders the 404 page. */
export const ROOT_ROUTES = ['/', '/auth', '/login', '/register']
