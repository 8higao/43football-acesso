(() => {
  'use strict';
  const play = document.getElementById('play');
  const label = document.getElementById('play-label');
  const status = document.getElementById('status-text');
  const message = document.getElementById('message');
  const retry = document.getElementById('retry');
  let generation = 0;
  let controller;
  let expiry;
  function render(mode, title, text, target) {
    document.body.dataset.mode = mode;
    status.textContent = title;
    message.textContent = text;
    label.textContent = target ? 'JOGAR' : mode === 'checking' ? 'VERIFICANDO…' : 'AGUARDE';
    play.classList.toggle('disabled', !target);
    play.setAttribute('aria-disabled', String(!target));
    if (target) { play.href = target; play.setAttribute('rel', 'noreferrer'); }
    else play.removeAttribute('href');
    retry.hidden = mode !== 'unavailable';
  }
  function validTarget(value) {
    const u = new URL(value);
    if (u.protocol !== 'https:' || u.username || u.password || u.port || u.search || u.hash ||
      !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.trycloudflare\.com$/.test(u.hostname) || u.pathname !== '/') throw new Error('Invalid target');
    return u;
  }
  async function json(url, signal) {
    const response = await fetch(url, { signal, cache: 'no-store', credentials: 'omit', redirect: 'error', mode: 'cors' });
    if (!response.ok) throw new Error('Unavailable');
    return response.json();
  }
  function invalidate() {
    generation++;
    controller?.abort();
    clearTimeout(expiry);
    render('checking', 'Verificando acesso…', 'Consultando o jogo. Aguarde um instante.');
  }
  async function check() {
    invalidate();
    if (document.hidden) return;
    const current = generation;
    const attempt = new AbortController();
    controller = attempt;
    const timeout = setTimeout(() => attempt.abort(), 6000);
    try {
      // Configuration and health share one snapshot, never two tunnels.
      const config = await json(new URL('config.json?t=' + Date.now(), location.href), attempt.signal);
      if (current !== generation || attempt.signal.aborted) return;
      const custom = typeof config.message === 'string' ? config.message.trim() : '';
      if (config.mode === 'maintenance' || config.mode === 'offline') {
        render(config.mode, config.mode === 'maintenance' ? 'Em manutenção' : 'Servidor desligado',
          custom || (config.mode === 'maintenance' ? 'Estamos preparando o acesso. Volte em breve.' : 'Voltamos às 7h, no horário de Brasília.'));
        return;
      }
      if (config.mode !== 'online') throw new Error('Invalid mode');
      const target = validTarget(config.url);
      const health = await json(new URL('/access-status?t=' + Date.now(), target), attempt.signal);
      if (current !== generation || attempt.signal.aborted) return;
      if (health.ok !== true || health.service !== '43football-access') throw new Error('Invalid service');
      render('online', 'Disponível', custom || 'Entre com sua conta ou use seu convite para começar.', target.href);
      expiry = setTimeout(() => { if (current === generation) void check(); }, 30000);
    } catch {
      if (current === generation) render('unavailable', 'Sem conexão com o jogo', 'Não foi possível confirmar o acesso. Tente novamente em instantes.');
    } finally { clearTimeout(timeout); }
  }
  play.addEventListener('click', event => { if (play.getAttribute('aria-disabled') === 'true') event.preventDefault(); });
  retry.addEventListener('click', () => void check());
  document.addEventListener('visibilitychange', () => { if (document.hidden) invalidate(); else void check(); });
  window.addEventListener('pagehide', invalidate);
  window.addEventListener('pageshow', event => { if (event.persisted) void check(); });
  window.addEventListener('online', () => void check());
  window.addEventListener('offline', () => { invalidate(); render('unavailable', 'Sem conexão com o jogo', 'Confira sua conexão com a internet e tente novamente.'); });
  setInterval(() => { if (document.body.dataset.mode !== 'online') void check(); }, 30000);
  void check();
})();
