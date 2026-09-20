// GitHub Pages is static hosting, so emulate the API for a safe UI demo.
// A normal Node.js deployment continues to use the real server API.
(function () {
  if (!location.hostname.endsWith('.github.io')) return;

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
