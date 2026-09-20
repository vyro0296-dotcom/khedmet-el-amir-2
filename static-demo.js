// GitHub Pages is static hosting, so emulate the API for a safe UI demo.
// A normal Node.js deployment continues to use the real server API.
(function () {
  if (!location.hostname.endsWith('.github.io')) return;

  // A previous failed API request may have stored an empty object. Remove only
  // that invalid cache so the app can boot from its built-in demo data.
  try {
    const key = 'khedmet_elamir_db_v2';
    const cached = JSON.parse(localStorage.getItem(key) || 'null');
    if (!cached || !Array.isArray(cached.members) || !Array.isArray(cached.classes) ||
        !Array.isArray(cached.attendance) || !Array.isArray(cached.visits) ||
        !cached.settings || typeof cached.settings !== 'object') {
      localStorage.removeItem(key);
    }
  } catch {
    localStorage.removeItem('khedmet_elamir_db_v2');
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

    if (is('/api/me')) return json({ user: demoUser, demo: true });
    if (is('/api/db')) {
      if (method === 'GET') return json({});
      if (method === 'PUT') return json({ ok: true, demo: true });
    }
    if (url.includes('/api/auth/')) return json({ ok: true, user: demoUser, demo: true });
    return nativeFetch(input, options);
  };
})();
