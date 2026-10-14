(function () {
  'use strict';
  const output = document.getElementById('visit-count');
  if (!output) return;
  const configuredEndpoint = window.MathBloomCounterConfig?.endpoint;
  if (!configuredEndpoint) {
    output.textContent = 'Látogatások: nem elérhető';
    return;
  }
  let endpoint;
  try {
    endpoint = new URL(configuredEndpoint);
    if (endpoint.protocol !== 'https:') throw new Error('HTTPS required');
  } catch {
    output.textContent = 'Látogatások: nem elérhető';
    return;
  }
  const storageKey = 'mathbloom-visit-session-v1';
  let sessionId;
  try { sessionId = sessionStorage.getItem(storageKey); } catch { /* Storage can be disabled. */ }
  if (!/^[a-f0-9]{32}$/.test(sessionId || '')) {
    const bytes = new Uint8Array(16);
    if (globalThis.crypto?.getRandomValues) crypto.getRandomValues(bytes);
    else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    sessionId = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    try { sessionStorage.setItem(storageKey, sessionId); } catch { /* Each load is a visit without storage. */ }
  }

  function display(total) {
    if (!Number.isSafeInteger(total) || total < 0) throw new Error('Invalid counter');
    output.textContent = 'Látogatások: ' + new Intl.NumberFormat('hu-HU').format(total);
  }

  async function update() {
    try {
      const response = await fetch(endpoint.href, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
        credentials: 'omit',
        cache: 'no-store',
      });
      if (!response.ok) throw new Error('Counter unavailable');
      display((await response.json()).total);
    } catch {
      // A read can still work after a transient write failure. It never invents a count.
      try {
        const response = await fetch(endpoint.href, { cache: 'no-store', credentials: 'omit' });
        if (!response.ok) throw new Error('Counter unavailable');
        display((await response.json()).total);
      } catch {
        output.textContent = 'Látogatások: nem elérhető';
      }
    }
  }
  update();
})();
