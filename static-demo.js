// GitHub Pages is static hosting, so provide a complete local demo API.
// A normal Node.js deployment continues to use the real server API.
(function () {
  if (!location.hostname.endsWith('.github.io')) return;

  const key = 'khedmet_elamir_db_v2';
  const demoState = {
    settings: { notifications: true, dark: false, birthday: true, autoSave: true, brightness: 100 },
    classes: ['أولى إعدادي', 'ثانية إعدادي', 'ثالثة إعدادي', 'أولى ثانوي', 'ثانية ثانوي', 'ثالثة ثانوي', 'خريجين'],
    members: [
      { id: '1001', name: 'مريم إبراهيم', gender: 'أنثى', birth: '2009-09-12', phone: '0123456789', address: 'القاهرة', className: 'ثانوي', status: 'منتظم', notes: '', created: '2026-01-10' },
      { id: '1002', name: 'كيرلس بطرس', gender: 'ذكر', birth: '2010-09-15', phone: '0112345678', address: 'الجيزة', className: 'إعدادي', status: 'منتظم', notes: '', created: '2026-01-11' },
      { id: '1003', name: 'فادي عادل', gender: 'ذكر', birth: '2008-12-02', phone: '0109876543', address: 'القاهرة', className: 'ثانوي', status: 'متابعة', notes: '', created: '2026-02-03' },
      { id: '1004', name: 'جورج مينا', gender: 'ذكر', birth: '2011-09-21', phone: '0129876543', address: 'الجيزة', className: 'إعدادي', status: 'منتظم', notes: '', created: '2026-02-08' },
      { id: '1005', name: 'مارينا سامح', gender: 'أنثى', birth: '2012-10-03', phone: '0156789123', address: 'القاهرة', className: 'إعدادي', status: 'غياب', notes: '', created: '2026-03-01' },
      { id: '1006', name: 'بيتر وديع', gender: 'ذكر', birth: '2007-06-19', phone: '0101234567', address: 'الجيزة', className: 'خريجين', status: 'منتظم', notes: '', created: '2026-03-04' }
    ],
    attendance: [],
    visits: []
  };

  // Clear only the malformed cache created by the old Pages adapter.
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

    if (is('/api/me')) return json({ user: demoUser, demo: true });
    if (is('/api/db')) {
      if (method === 'GET') return json(JSON.parse(JSON.stringify(demoState)));
      if (method === 'PUT') return json({ ok: true, demo: true });
    }
    if (url.includes('/api/auth/')) return json({ ok: true, user: demoUser, demo: true });
    return nativeFetch(input, options);
  };
})();
