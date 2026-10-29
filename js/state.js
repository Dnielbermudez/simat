/* SIMAT · Estado de la aplicación y almacenamiento local */
(function () {
  const S = SIMAT;

  S.storage = {
    get(key, fallback) {
      try { const v = localStorage.getItem('simat:' + key); return v ? JSON.parse(v) : fallback; }
      catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem('simat:' + key, JSON.stringify(value)); } catch (e) { /* sin almacenamiento */ }
    },
    remove(key) { try { localStorage.removeItem('simat:' + key); } catch (e) {} }
  };

  S.loadConfig = function () {
    const saved = S.storage.get('config', null);
    const base = JSON.parse(JSON.stringify(S.CONFIG_DEFAULT));
    if (saved && saved.variables) {
      Object.keys(base.variables).forEach(k => {
        if (saved.variables[k] && Array.isArray(saved.variables[k].levels)) base.variables[k].levels = saved.variables[k].levels.map(Number);
      });
      if (saved.duct) ['base', 'per100m', 'tolerance'].forEach(k => { if (saved.duct[k] !== undefined) base.duct[k] = Array.isArray(saved.duct[k]) ? saved.duct[k].map(Number) : Number(saved.duct[k]); });
      if (saved.rules) Object.assign(base.rules, saved.rules);
    }
    S.CONFIG = base;
  };

  S.saveConfig = function () {
    S.storage.set('config', { variables: S.CONFIG.variables, duct: S.CONFIG.duct, rules: S.CONFIG.rules });
  };

  // Pérdida normal de aire del ducto según la curva configurada (%)
  S.expectedLoss = function (f) {
    const D = S.CONFIG.duct;
    return D.base + D.per100m * (f.ductLength || 0) / 100;
  };

  S.newFrenteState = function (f) {
    const normal = S.expectedLoss(f) / 100;
    return {
      id: f.id, nombre: f.nombre, tipo: f.tipo, main: !!f.main, fan: f.fan, design: f.design, ductLength: f.ductLength,
      values: { ch4: 0.2, o2: 20.8, co: 8, co2: 0.08, h2s: 0.6, temp: 26.4, qOut: f.design, qIn: f.design * (1 - normal), fanOn: true },
      // parámetros físicos del simulador
      model: { emission: 0.18, leak: normal, coSpike: 0, h2sSpike: 0, extraEmission: 0 },
      history: [],
      level: 0, pendingUp: 0, pendingDown: 0,
      varLevels: {}, causes: [], mainCause: 'Condiciones normales',
      ttl: null, ttlVar: null, lossPct: normal * 100, lossExpected: normal * 100, lossExcess: 0, leakLevel: 0,
      blocked: false, blockReason: '', normalStreak: 0, remeasured: false
    };
  };

  S.initState = function () {
    S.loadConfig();
    S.state = {
      simTime: Date.parse('2026-10-29T14:00:00-05:00'),
      tick: 0,
      frentes: {},
      workers: S.WORKERS.map(w => Object.assign({}, w, { confirmed: null, confirmAt: null, lastSeen: 0, ch4: 0.2, status: 'En el frente', local: { ch4: 0 }, level: 0, interval: 15, lastMsg: null })),
      detMsgs: [],
      devices: Object.fromEntries(SIMAT.DEVICES.map((d, i) => [d.id, { level: 0, since: null, ackMs: null, by: null, battery: 82 + (i * 7) % 17, lastTest: Date.parse('2026-10-29T06:10:00-05:00') }])),
      network: { fiberA: true, fiberB: true, mesh: true, cutAt: null },
      sensorsDown: {},
      pressure: [],
      pressureBase: 1013,
      pressureTrend: 0,
      alerts: S.storage.get('alerts', []),
      manual: S.storage.get('manual', []),
      log: [],
      alertSeq: S.storage.get('alertSeq', 140),
      soundOn: false,
      session: null
    };
    S.FRENTES.forEach(f => { S.state.frentes[f.id] = S.newFrenteState(f); });
    // Las alertas abiertas de una sesión anterior se cierran: el simulador arranca en condiciones normales
    S.state.alerts.forEach(a => { if (a.state !== 'Cerrada') { a.state = 'Cerrada'; a.closeAt = Date.now(); a.actions = (a.actions || []).concat([{ t: S.state.simTime, who: 'Sistema', text: 'Cerrada al reiniciar el sistema' }]); } });
    // historial inicial para que las gráficas no empiecen vacías
    for (let i = 0; i < 40; i++) S.sim.step(true);
  };

  S.persist = function () {
    S.storage.set('alerts', S.state.alerts.slice(-200));
    S.storage.set('manual', S.state.manual.slice(-500));
    S.storage.set('alertSeq', S.state.alertSeq);
  };

  S.addLog = function (text, kind) {
    S.state.log.unshift({ t: S.state.simTime, text, kind: kind || 'info' });
    S.state.log = S.state.log.slice(0, 100);
  };

  S.fmtTime = function (t) {
    const d = new Date(t);
    return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };
  S.fmtHM = function (t) {
    const d = new Date(t);
    return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
  };
  S.fmtNum = function (v, dec) {
    if (v === null || v === undefined || isNaN(v)) return '—';
    return Number(v).toLocaleString('es-CO', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  };
  S.fmtDuration = function (sec) {
    if (sec === null || sec === undefined) return '—';
    sec = Math.max(0, Math.round(sec));
    const m = Math.floor(sec / 60), s = sec % 60;
    return m > 0 ? `${m} min ${String(s).padStart(2, '0')} s` : `${s} s`;
  };
})();
