/* Apply the preference before the page paints, then connect the toggle. */
(() => {
  'use strict';
  const key = 'swarnabha-theme';
  const root = document.documentElement;
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  let preference = null;
  let button;
  const valid = value => value === 'light' || value === 'dark';
  try {
    const stored = localStorage.getItem(key);
    if (valid(stored)) preference = stored;
  } catch (_) { /* Private browsing may block storage; the toggle still works. */ }

  function apply(theme) {
    root.dataset.theme = theme;
    const dark = theme === 'dark';
    const color = document.querySelector('meta[name="theme-color"]');
    if (color) color.setAttribute('content', dark ? '#101522' : '#f7f8fc');
    if (button) {
      button.setAttribute('aria-pressed', String(dark));
      button.title = dark ? 'Switch to light theme' : 'Switch to dark theme';
    }
  }
  function update() { apply(preference || (system.matches ? 'dark' : 'light')); }
  update();

  function connect() {
    button = document.querySelector('.theme-toggle');
    if (!button) return;
    button.hidden = false;
    update();
    button.addEventListener('click', () => {
      preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
      apply(preference);
      try { localStorage.setItem(key, preference); } catch (_) { /* Keep the in-memory choice. */ }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', connect, { once: true });
  else connect();
  system.addEventListener('change', () => { if (!preference) update(); });
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    preference = valid(event.newValue) ? event.newValue : null;
    update();
  });
})();
