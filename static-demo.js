// GitHub Pages is static hosting, so provide a safe UI demo without a server API.
// A normal Node.js deployment continues to use the real server API.
(function () {
  if (!location.hostname.endsWith('.github.io')) return;

  const key = 'khedmet_elamir_db_v2';
  // Remove only malformed data from an earlier adapter; keep valid user changes.
  try {
    const cached = JSON.parse(localStorage.getItem(key) || 'null');
    if (!cached || !Array.isArray(cached.members) || !Array.isArray(cached.classes) ||
        !Array.isArray(cached.attendance) || !Array.isArray(cached.visits) || !cached.settings) {
      localStorage.removeItem(key);
    }
  } catch {
    localStorage.removeItem(key);
  }

  const nativeFetch = window.fetch.bind(window);
  const demoUser = { id: 'demo', phone: 'demo', role: 'admin' };
  const json = (body, status = 200) => Promise.resolve(new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  }));

  window.fetch = function (input, options) {
    const url = typeof input === 'string' ? input : input.url;
    const method = String((options && options.method) || (typeof input !== 'string' && input.method) || 'GET').toUpperCase();
    const is = path => url === path || url.endsWith(path);

    // The app already contains the complete seed data. Returning 404 here is
    // intentional: it prevents an empty/mock response from replacing db with
    // an incomplete object and leaving the dashboard blank.
    if (is('/api/me')) return json({ user: demoUser, demo: true });
    if (is('/api/db')) {
      if (method === 'GET') return json({ error: 'demo storage is local' }, 404);
      if (method === 'PUT') return json({ ok: true, demo: true });
    }
    if (url.includes('/api/auth/')) return json({ ok: true, user: demoUser, demo: true });
    return nativeFetch(input, options);
  };
})();
