(() => {
  'use strict';
  const config = window.GAME_ACCESS || {};
  const play = document.getElementById('play');
  const label = document.getElementById('play-label');
  const status = document.getElementById('status-text');
  const message = document.getElementById('message');
  let target;
  try {
    target = new URL(config.url);
    if (target.protocol !== 'https:' || target.username || target.password || target.port || target.search || target.hash ||
      !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.trycloudflare\.com$/.test(target.hostname) || target.pathname !== '/') target = null;
  } catch { target = null; }
  const mode = ['online', 'offline', 'maintenance'].includes(config.mode) ? config.mode : 'maintenance';
  document.body.dataset.mode = mode;
  if (mode === 'online' && target) {
    status.textContent = 'Acesso ao jogo';
    message.textContent = typeof config.message === 'string' && config.message.trim() ? config.message : 'Entre com sua conta ou use seu convite para começar.';
    play.href = target.href;
    play.classList.remove('disabled');
    play.removeAttribute('aria-disabled');
    play.setAttribute('rel', 'noreferrer');
  } else {
    const maintenance = mode === 'maintenance' || (mode === 'online' && !target);
    document.body.dataset.mode = maintenance ? 'maintenance' : 'offline';
    status.textContent = maintenance ? 'Em manutenção' : 'Servidor desligado';
    message.textContent = typeof config.message === 'string' && config.message.trim()
      ? config.message : maintenance ? 'Estamos preparando o acesso. Volte em breve.' : 'Voltamos às 7h, no horário de Brasília.';
    label.textContent = maintenance ? 'AGUARDE' : 'VOLTAMOS EM BREVE';
  }
})();
