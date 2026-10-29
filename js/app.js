/* SIMAT · Aplicación: sesión, navegación, ciclo en tiempo real y acciones */
(function () {
  const S = SIMAT;
  const $ = sel => document.querySelector(sel);
  let timer = null, lastRendered = null, audioCtx = null;

  /* ---------- Sesión ---------- */
  function loadSession() {
    try { const s = sessionStorage.getItem('simat:session'); return s ? JSON.parse(s) : null; } catch (e) { return S._mem || null; }
  }
  function saveSession(s) {
    S._mem = s;
    try { s ? sessionStorage.setItem('simat:session', JSON.stringify(s)) : sessionStorage.removeItem('simat:session'); } catch (e) {}
  }

  function strataSVG(dark) {
    return dark
      ? `<svg class="strata" viewBox="0 0 720 300" preserveAspectRatio="none" aria-hidden="true"><path d="M0 40 C 120 20, 240 60, 380 40 S 620 20, 720 44 V300 H0Z" fill="#2E3238"/><path d="M0 110 C 140 90, 260 130, 400 108 S 640 96, 720 112 V300 H0Z" fill="#3A3E45"/><path d="M0 180 C 150 166, 290 196, 420 178 S 650 168, 720 184 V300 H0Z" fill="#14161A"/><path d="M0 236 C 160 226, 300 250, 440 236 S 660 228, 720 240 V300 H0Z" fill="#4A4E55"/><circle cx="120" cy="206" r="3" fill="#FFC107" opacity=".5"/><circle cx="360" cy="200" r="2.5" fill="#FFC107" opacity=".4"/><circle cx="560" cy="210" r="3" fill="#FFC107" opacity=".5"/></svg>`
      : `<svg class="strata" viewBox="0 0 1200 104" preserveAspectRatio="none" aria-hidden="true"><path d="M0 62 C 160 52, 300 72, 480 62 S 820 50, 980 64 S 1140 58, 1200 60 V104 H0Z" fill="#E9E8E3"/><path d="M0 78 C 180 70, 340 88, 520 78 S 860 68, 1020 80 S 1160 76, 1200 76 V104 H0Z" fill="#CFCDC5"/><path d="M0 90 C 200 86, 360 98, 540 90 S 880 84, 1040 92 S 1170 88, 1200 90 V104 H0Z" fill="#22252A"/><path d="M0 98 C 210 95, 370 102, 550 98 S 890 94, 1050 99 S 1175 97, 1200 98 V104 H0Z" fill="#9C9A92"/><circle cx="140" cy="93" r="1.8" fill="#FFC107"/><circle cx="610" cy="92" r="1.6" fill="#FFC107"/><circle cx="1010" cy="94" r="1.8" fill="#FFC107"/></svg>`;
  }

  function renderLogin(error) {
    stopLoop();
    $('#root').innerHTML = `<div class="login">
      <section class="login-hero">${strataSVG(true)}
        <div class="brand" style="position:relative"><span class="brand-mark" style="width:48px;height:48px">${S.headframe(30)}</span><span class="brand-name" style="font-size:24px">SIMAT</span></div>
        <div style="position:relative"><div class="hazard" style="width:120px;margin-bottom:20px"></div><h1>Avisamos antes de que el aire del frente sea peligroso.</h1><p>Monitoreo atmosférico continuo con alerta temprana para minas subterráneas de carbón. Funciona en la red local de la mina, sin internet.</p></div>
        <div style="position:relative;font-size:14px;color:#C9CBCF">Sistema Inteligente de Monitoreo Atmosférico con Alerta Temprana</div>
      </section>
      <section class="login-form">
        <form id="login-form" autocomplete="off">
          <div><h2 style="font-family:var(--display);font-size:28px">Iniciar sesión</h2><p class="muted" style="margin:6px 0 0">El sistema abre el panel según tu cargo.</p></div>
          <label class="field">Usuario<input name="user" required autofocus placeholder="ej. supervisor"></label>
          <label class="field">Contraseña<input name="pass" type="password" required placeholder="••••"></label>
          <div class="err" role="alert">${error ? S.esc(error) : ''}</div>
          <button class="btn primary" type="submit" style="min-height:50px;font-size:16px">Ingresar</button>
          <div class="small muted" style="display:flex;align-items:center;gap:8px"><span class="dot"></span>Servidor local · funciona sin internet</div>
        </form>
        <div class="demo-box"><b style="color:var(--text)">Cuentas de demostración</b> (contraseña <code>1234</code>). Cada cuenta abre directamente el panel de su cargo:<br><code>supervisor</code> · <code>ventilacion</code> · <code>sst</code> · <code>admin</code> · <code>frente</code></div>
      </section></div>`;
    $('#login-form').addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const u = String(fd.get('user')).trim().toLowerCase(), p = String(fd.get('pass'));
      const acc = S.USERS[u];
      if (!acc || acc.pass !== p) { renderLogin('Usuario o contraseña incorrectos.'); return; }
      // El rol lo define la cuenta: cada usuario entra directo a su panel
      unlockAudio();
      S.state.session = { user: u, role: acc.role, name: acc.name };
      saveSession(S.state.session);
      location.hash = '#/' + S.ROLES[acc.role].home;
      route();
    });
  }

  /* ---------- Navegación ---------- */
  function currentView() {
    const role = S.state.session.role, R = S.ROLES[role];
    let v = (location.hash.replace(/^#\/?/, '') || R.home).split('?')[0];
    const allowed = role === 'trabajador' ? ['frente'] : R.menu.map(m => m[0]);
    if (!allowed.includes(v)) v = R.home;
    return v;
  }

  function route() {
    if (!S.state.session) { renderLogin(); return; }
    const v = currentView();
    lastRendered = null;
    renderShell(v);
    startLoop();
  }

  function renderShell(v) {
    const s = S.state.session, R = S.ROLES[s.role], view = S.views[v];
    if (view.full) {
      $('#root').innerHTML = `<div id="view"></div><div class="toasts" id="toasts"></div>${alarmHTML()}${demoPanelHTML()}`;
    } else {
      const openCount = S.state.alerts.filter(a => a.state !== 'Cerrada').length;
      $('#root').innerHTML = `<div class="app">
        <nav class="sidebar" aria-label="Menú principal">
          <a class="brand" href="#/${R.home}" style="padding:0 6px"><span class="brand-mark">${S.headframe(22)}</span><span class="brand-name">SIMAT</span></a>
          <div class="hazard" style="margin:14px 6px 0"></div>
          <div class="role">${S.esc(R.label)}</div>
          <div class="nav">${R.menu.map(([id, label, ic]) => `<a href="#/${id}" class="${id === v ? 'active' : ''}">${S.icon(ic)}<span>${label}</span>${id === 'alertas' && openCount ? `<span class="badge" id="badge-alerts">${openCount}</span>` : ''}</a>`).join('')}</div>
          <div class="side-foot">
            <div class="netline" id="netline"></div>
            <div class="simtag">DATOS SIMULADOS</div>
            <div class="user"><span class="avatar">${s.user.slice(0, 2).toUpperCase()}</span><div class="who">${S.esc(s.user)}<small>${S.esc(R.label)}</small></div><button class="icon-btn" data-action="logout" aria-label="Cerrar sesión">${S.icon('logout')}</button></div>
          </div>
        </nav>
        <div class="main">
          <header class="topbar">${strataSVG(false)}<div class="ttl"><small>${S.esc(view.sub || '')}</small><h1>${S.esc(view.title)}</h1></div>
            <div class="chips"><span class="chip" id="clock"></span><button class="btn-demo" data-action="sound" id="sound-btn">${S.state.soundOn ? '🔊 Sonido' : '🔇 Sin sonido'}</button><button class="btn-demo" data-action="demo-toggle">Modo demostración</button></div></header>
          <main class="content" id="view"></main>
        </div></div><div class="toasts" id="toasts"></div>${alarmHTML()}${demoPanelHTML()}`;
    }
    renderView(true);
  }

  S.roleSwitch = function () {
    const cur = S.state.session ? S.state.session.role : '';
    return `<label class="role-switch">Rol<select id="role-switch" aria-label="Cambiar de rol">${Object.entries(S.ROLES).map(([k, r]) => `<option value="${k}" ${k === cur ? 'selected' : ''}>${S.esc(r.label)}</option>`).join('')}</select></label>`;
  };
  function alarmHTML() {
    return `<div id="flash" class="flash-overlay hidden" aria-hidden="true"></div><div id="alarm-bar" class="alarm-bar hidden" role="alert"></div>`;
  }

  function demoPanelHTML() {
    const hidden = S.storage.get('demoHidden', false);
    return `<aside class="demo-panel ${hidden ? 'hidden' : ''}" id="demo-panel" aria-label="Modo demostración"><div class="hazard"></div><div class="inner">
      <h3>Modo demostración <button class="icon-btn" data-action="demo-toggle" aria-label="Ocultar panel">✕</button></h3>
      <p>Cada botón aplica el evento al instante y el sistema reacciona en la misma lectura. Los eventos se acumulan: pulse <b>Restablecer</b> entre una prueba y otra.</p><div class="small" id="demo-last" style="color:#FFC107;font-weight:700"></div>
      <label class="small" style="display:flex;gap:8px;align-items:center">Frente <select id="demo-frente">${S.FRENTES.map(f => `<option value="${f.id}">${S.esc(f.nombre)}</option>`).join('')}</select></label>
      <div class="evs">
        <button data-ev="ducto">Romper ducto</button><button data-ev="ventilador">Apagar ventilador</button>
        <button data-ev="metano">Desprendimiento CH₄</button><button data-ev="voladura">Voladura (CO)</button>
        <button data-ev="fibra">Cortar fibra</button><button data-ev="sensor">Sensor sin reportar</button>
        <button data-ev="presion">Caída de presión</button><button data-ev="detector">Alarma detector personal</button>
        <button data-ev="reset" class="reset">Restablecer</button>
      </div></div></aside>`;
  }

  function renderView(force) {
    const v = currentView(), view = S.views[v], el = $('#view');
    if (!el) return;
    if (!force) {
      if (view.live === false) { updateChrome(); return; }
      const ae = document.activeElement;
      if (ae && el.contains(ae) && /INPUT|SELECT|TEXTAREA/.test(ae.tagName)) { updateChrome(); return; }
    }
    const y = window.scrollY;
    el.innerHTML = view.render();
    window.scrollTo(0, y);
    lastRendered = v;
    updateChrome();
  }

  function updateChrome() {
    const c = $('#clock'); if (c) c.textContent = 'Turno 2 · ' + S.fmtTime(S.state.simTime);
    const n = $('#netline');
    if (n) { const ok = S.state.network.fiberA; n.innerHTML = `<span class="dot ${ok ? '' : 'warn'}"></span>${S.rules.route()}`; }
    const b = $('#badge-alerts'); if (b) b.textContent = S.state.alerts.filter(a => a.state !== 'Cerrada').length;
    const sb = $('#sound-btn'); if (sb) sb.textContent = S.state.soundOn ? '🔊 Sonido' : '🔇 Sin sonido';
    updateAlarm();
  }

  /* ---------- Alarma: sonido consecutivo y luces destellantes ---------- */
  function activeAlarm() {
    const open = S.state.alerts.filter(a => a.state !== 'Cerrada' && a.state !== 'Esperando reingreso' && S.state.frentes[a.frente] && S.state.frentes[a.frente].level > 0);
    // Suena mientras no se reconozca; en nivel 2 y 3 sigue sonando hasta que se normalice o se silencie
    const sounding = open.filter(a => !a.ackAt || a.level >= 2);
    if (!sounding.length) return null;
    sounding.sort((x, y) => y.level - x.level);
    return sounding[0];
  }
  function updateAlarm() {
    const a = activeAlarm(), fl = $('#flash'), bar = $('#alarm-bar');
    if (!fl || !bar) return;
    const key = a ? a.id + ':' + a.level : null;
    if (!a || S.state.silenced === key) { fl.className = 'flash-overlay hidden'; bar.className = 'alarm-bar hidden'; return; }
    const f = S.state.frentes[a.frente];
    fl.className = 'flash-overlay l' + a.level;
    bar.className = 'alarm-bar l' + a.level;
    bar.innerHTML = `<span class="alarm-lamp"></span><div class="alarm-tx"><b>${a.level === 1 ? 'ALERTA TEMPRANA' : a.level === 2 ? 'ALERTA · RETIRARSE DEL FRENTE' : 'EVACUACIÓN'} · NIVEL ${a.level} · ${S.esc(f.nombre)}</b><span>${S.esc(a.cause)}</span></div>
      <div class="btns">${a.ackAt ? '' : `<button class="btn primary sm" data-action="ack" data-id="${a.id}">Reconocer</button>`}<button class="btn sm" data-action="silence" data-id="${key}">Silenciar</button></div>`;
  }
  function alarmSound() {
    const a = activeAlarm();
    if (!a || !S.state.soundOn || S.state.silenced === a.id + ':' + a.level) return;
    beep(a.level);
  }
  function unlockAudio() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      S.state.soundOn = true;
    } catch (e) {}
  }

  /* ---------- Tiempo real ---------- */
  function startLoop() {
    if (timer) return;
    timer = setInterval(() => { S.sim.step(); renderView(false); alarmSound(); }, S.CONFIG.tickMs);
  }
  function stopLoop() { if (timer) { clearInterval(timer); timer = null; } }

  /* ---------- Avisos ---------- */
  S.onNewAlert = function (a) {
    const box = $('#toasts');
    if (box) {
      const t = document.createElement('div');
      t.className = 'toast l' + a.level;
      t.setAttribute('role', 'status');
      t.innerHTML = `<div class="bar"></div><div class="tx"><b>${a.level === 1 ? 'ALERTA TEMPRANA' : 'ALERTA'} · NIVEL ${a.level} · ${a.frente}</b>${S.esc(a.cause)}</div>`;
      box.prepend(t);
      setTimeout(() => t.remove(), 7000);
    }
    beep(a.level);
  };

  function beep(level) {
    if (!S.state.soundOn) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const now = audioCtx.currentTime;
      if (level >= 3) {
        // Sirena continua: barrido de tono durante todo el ciclo
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = 'sawtooth'; g.gain.value = 0.05; o.connect(g); g.connect(audioCtx.destination);
        for (let i = 0; i < 4; i++) { o.frequency.setValueAtTime(600, now + i * 0.45); o.frequency.linearRampToValueAtTime(1200, now + i * 0.45 + 0.4); }
        o.start(now); o.stop(now + 1.85);
        return;
      }
      const pattern = level === 2 ? [0, .3, .6, .9, 1.2] : [0, .35];
      pattern.forEach(off => {
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.frequency.value = level >= 2 ? 880 : 660; o.type = 'square';
        g.gain.value = 0.06; o.connect(g); g.connect(audioCtx.destination);
        const t0 = now + off; o.start(t0); o.stop(t0 + (level >= 2 ? 0.2 : 0.15));
      });
    } catch (e) {}
  }

  /* ---------- Exportar ---------- */
  function download(name, text) {
    const blob = new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  const csvRow = arr => arr.map(x => `"${String(x === undefined || x === null ? '' : x).replace(/"/g, '""')}"`).join(';');
  function historyCSV(ids) {
    const lines = [csvRow(['frente', 'hora', 'CH4_%', 'O2_%', 'CO_ppm', 'CO2_%', 'H2S_ppm', 'temp_C', 'caudal_salida', 'caudal_llegada', 'ventilador', 'nivel', 'fuente'])];
    ids.forEach(id => S.state.frentes[id].history.forEach(h => lines.push(csvRow([id, new Date(h.t).toISOString(), h.ch4.toFixed(3), h.o2.toFixed(2), h.co.toFixed(1), h.co2.toFixed(3), (h.h2s || 0).toFixed(1), h.temp.toFixed(1), Math.round(h.qOut), Math.round(h.qIn), h.fanOn ? 'ON' : 'OFF', h.level, h.stale ? 'sin reportar' : 'SIMULADO']))));
    S.state.manual.forEach(m => lines.push(csvRow([m.frente, new Date(m.t).toISOString(), m.variable === 'ch4' ? m.value : '', m.variable === 'o2' ? m.value : '', m.variable === 'co' ? m.value : '', m.variable === 'co2' ? m.value : '', m.variable === 'h2s' ? m.value : '', m.variable === 'temp' ? m.value : '', '', '', '', m.level, 'Manual · ' + m.who])));
    return lines.join('\n');
  }

  /* ---------- Acciones ---------- */
  document.addEventListener('click', e => {
    const ev = e.target.closest('[data-ev]');
    if (ev) { const fr = $('#demo-frente'), fid = fr ? fr.value : 'F-INC'; S.sim.event(ev.dataset.ev, fid); renderView(true); const dl = $('#demo-last'); if (dl) dl.textContent = ev.dataset.ev === 'reset' ? 'Todo restablecido.' : `Aplicado: ${ev.textContent} · ${S.state.frentes[fid].nombre}`; alarmSound(); return; }
    const t = e.target.closest('[data-action]');
    if (!t) return;
    const id = t.dataset.id, w = S.state.session ? S.state.session.name : '';
    switch (t.dataset.action) {
      case 'logout': saveSession(null); S.state.session = null; location.hash = ''; renderLogin(); return;
      case 'demo-toggle': { const p = $('#demo-panel'); if (p) { p.classList.toggle('hidden'); S.storage.set('demoHidden', p.classList.contains('hidden')); } return; }
      case 'pick-frente': S.ui.frente = id; S.ui.mapSel = id; break;
      case 'map-sel': S.ui.mapSel = id; break;
      case 'toggle-evac': S.ui.showEvac = !S.ui.showEvac; break;
      case 'alert-tab': S.ui.alertTab = id; break;
      case 'ack': S.rules.ack(id, w); break;
      case 'retire': S.rules.retire(id, w); break;
      case 'confirm-worker': S.rules.confirmWorker(id); break;
      case 'repair': S.sim.event('reparar', id); { const a = S.openAlert(id); if (a) S.rules.action(a.id, w, 'Reparación de ventilador/ducto'); } break;
      case 'inspect': { const a = S.openAlert(id); if (a) S.rules.action(a.id, w, 'Inspección de ducto registrada'); else S.addLog(`Inspección de ducto en ${id} sin novedad (${w})`, 'ok'); } break;
      case 'remeasure': S.rules.remeasure(id, w); break;
      case 'authorize': S.rules.authorize(id, w); break;
      case 'sound': if (S.state.soundOn) { S.state.soundOn = false; } else { unlockAudio(); beep(1); } break;
      case 'silence': S.state.silenced = id; S.addLog(`Alarma silenciada por ${w} (la alerta sigue abierta)`, 'info'); break;
      case 'print': window.print(); return;
      case 'export-csv': download(`simat_${S.ui.histFrente}_historial.csv`, historyCSV([S.ui.histFrente])); return;
      case 'export-all': download('simat_historial.csv', historyCSV(S.FRENTES.map(f => f.id))); return;
      case 'export-alerts': {
        const lines = [csvRow(['id', 'frente', 'inicio', 'nivel_max', 'causa', 'reconocida_por', 'segundos_reconocimiento', 'escalo', 'estado', 'acciones'])];
        S.state.alerts.forEach(a => lines.push(csvRow([a.id, a.frente, new Date(a.start).toISOString(), a.maxLevel, a.cause, a.ackBy || '', a.ackAt ? Math.round((a.ackAt - a.start) / 1000) : '', a.escalated ? a.escalatedTo : '', a.state, a.actions.map(x => x.text).join(' | ')])));
        download('simat_alertas.csv', lines.join('\n')); return;
      }
      case 'test-device': S.rules.testDevice(id, w); break;
      case 'config-reset': S.storage.remove('config'); S.loadConfig(); S.rules.evaluate(); break;
    }
    renderView(true);
  });

  document.addEventListener('change', e => {
    if (e.target.id === 'role-switch') {
      const role = e.target.value;
      if (S.state.session && role === S.state.session.role) return;
      S.ui.loginRole = role; saveSession(null); S.state.session = null; history.replaceState(null, '', location.pathname);
      renderLogin(`Para entrar como ${S.ROLES[role].label}, ingrese usuario y contraseña.`);
      return;
    }
    const k = e.target.dataset && e.target.dataset.ui;
    if (k) { S.ui[k] = e.target.value; if (k === 'frente') S.ui.mapSel = e.target.value; e.target.blur(); renderView(true); }
  });

  document.addEventListener('submit', e => {
    const form = e.target.closest('[data-form]');
    if (!form) return;
    e.preventDefault();
    const fd = new FormData(form), w = S.state.session ? S.state.session.name : '';
    const err = form.querySelector('[data-err]');
    if (form.dataset.form === 'action') {
      const text = String(fd.get('text') || '').trim();
      if (text) S.rules.action(form.dataset.id, w, text);
    }
    if (form.dataset.form === 'manual') {
      const value = Number(String(fd.get('value')).replace(',', '.'));
      if (isNaN(value)) { err.textContent = 'Ingrese un valor numérico.'; return; }
      S.rules.addManual({ frente: fd.get('frente'), variable: fd.get('variable'), value, who: w, inst: fd.get('inst') });
    }
    if (form.dataset.form === 'config') {
      const V = S.CONFIG.variables;
      for (const k of Object.keys(V)) {
        const lv = [0, 1, 2].map(i => Number(fd.get(`${k}-${i}`)));
        if (lv.some(isNaN)) { err.textContent = `Revise los valores de ${V[k].name}.`; return; }
        const okOrder = V[k].dir === 'up' ? lv[0] < lv[1] && lv[1] < lv[2] : lv[0] > lv[1] && lv[1] > lv[2];
        if (!okOrder) { err.textContent = `${V[k].name}: los niveles deben ir en orden (${V[k].dir === 'up' ? 'de menor a mayor' : 'de mayor a menor'}).`; return; }
        V[k].levels = lv;
      }
      const db = Number(fd.get('duct-base')), dp = Number(fd.get('duct-per100m')), dt = [0, 1, 2].map(i => Number(fd.get(`duct-tol-${i}`)));
      if ([db, dp].concat(dt).some(x => isNaN(x) || x < 0) || !(dt[0] < dt[1])) { err.textContent = 'Curva del ducto: revise los valores (la tolerancia de alerta debe ser mayor que la de precaución).'; return; }
      if (dt[2] <= dt[1]) dt[2] = dt[1] + 20;
      Object.assign(S.CONFIG.duct, { base: db, per100m: dp, tolerance: dt });
      // la pérdida normal simulada de cada ducto sigue la nueva curva
      Object.values(S.state.frentes).forEach(f => { if (f.model.leak < (S.expectedLoss(f) + 10) / 100) f.model.leak = S.expectedLoss(f) / 100; });
      ['trendWindow', 'earlyWarningMinutes', 'persistence', 'recovery'].forEach(k => { const n = Number(fd.get(k)); if (n > 0) S.CONFIG.rules[k] = n; });
      S.saveConfig(); S.rules.evaluate();
      S.addLog(`Configuración de límites actualizada por ${w}`, 'info');
    }
    renderView(true);
    const e2 = document.querySelector('#view [data-err]');
    if (e2 && form.dataset.form !== 'action') { e2.style.color = 'var(--ok)'; e2.textContent = 'Guardado.'; }
  });

  window.addEventListener('hashchange', route);

  /* ---------- Inicio ---------- */
  S.initState();
  S.state.session = loadSession();
  route();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
