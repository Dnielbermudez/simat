/* SIMAT · Motor de reglas y analítica
 * - Compara cada variable con sus umbrales por nivel (0–3)
 * - Calcula la tendencia y el tiempo estimado hasta el límite (alerta temprana)
 * - Vigila la ventilación: ventilador detenido y pérdida de caudal en el ducto
 * - Aplica persistencia e histéresis para evitar falsas alarmas
 * - Gestiona el ciclo de cada alerta: notificada → reconocida → remedición → cerrada
 * - Escala si nadie reconoce a tiempo
 */
(function () {
  const S = SIMAT;
  const VARS = ['ch4', 'o2', 'co', 'co2', 'h2s', 'temp'];

  function levelFor(key, value) {
    const cfg = S.CONFIG.variables[key];
    let lvl = 0;
    cfg.levels.forEach((thr, i) => {
      if (cfg.dir === 'up' ? value >= thr : value <= thr) lvl = i + 1;
    });
    return lvl;
  }
  S.levelFor = levelFor;

  function slopePerMinute(hist, key) {
    const n = S.CONFIG.rules.trendWindow;
    const pts = hist.filter(h => !h.stale).slice(-n);
    if (pts.length < 4) return 0;
    const minPerTick = S.CONFIG.simSecondsPerTick / 60;
    let sx = 0, sy = 0, sxy = 0, sxx = 0;
    pts.forEach((p, i) => { const x = i * minPerTick; sx += x; sy += p[key]; sxy += x * p[key]; sxx += x * x; });
    const k = pts.length;
    const den = k * sxx - sx * sx;
    return den === 0 ? 0 : (k * sxy - sx * sy) / den;
  }
  S.slopePerMinute = slopePerMinute;

  function timeToLimit(f, key) {
    const cfg = S.CONFIG.variables[key];
    const limit = cfg.levels[cfg.limitLevel - 1];
    const v = f.values[key];
    const slope = slopePerMinute(f.history, key);
    if (cfg.dir === 'up' && v < limit && slope > 0.0005 * Math.max(limit, 1)) return (limit - v) / slope;
    if (cfg.dir === 'down' && v > limit && slope < -0.0005 * limit) return (v - limit) / -slope;
    return null;
  }

  function evaluateFrente(f) {
    const st = S.state, R = S.CONFIG.rules;
    const causes = [];
    let raw = 0, immediate = false;

    VARS.forEach(k => {
      const lvl = levelFor(k, f.values[k]);
      f.varLevels[k] = lvl;
      if (lvl > 0) {
        const c = S.CONFIG.variables[k];
        causes.push({ level: lvl, kind: lvl >= c.limitLevel ? 'limit' : 'pre', text: `${c.name} ${lvl >= c.limitLevel ? 'fuera de límite' : 'en precaución'}: ${S.fmtNum(f.values[k], c.dec)} ${c.unit}` });
        raw = Math.max(raw, lvl);
      }
    });

    // Alerta temprana por tendencia
    let best = null;
    VARS.forEach(k => {
      const t = timeToLimit(f, k);
      if (t !== null && (best === null || t < best.t)) best = { t, k };
    });
    f.ttl = best ? best.t : null;
    f.ttlVar = best ? best.k : null;
    if (best && best.t <= R.earlyWarningMinutes) {
      const c = S.CONFIG.variables[best.k];
      causes.push({ level: 1, kind: 'trend', text: `${c.name} ${c.dir === 'up' ? 'en aumento' : 'en descenso'}: llegaría al límite en ~${Math.max(1, Math.round(best.t))} min` });
      raw = Math.max(raw, 1);
    }

    // Ventilación
    const v = f.values;
    f.lossPct = v.qOut > 5 ? Math.max(0, (v.qOut - v.qIn) / v.qOut * 100) : 100;
    f.lossExpected = S.expectedLoss(f);
    f.lossExcess = f.lossPct - f.lossExpected;
    f.leakLevel = 0;
    const mainOn = S.state.frentes['F-INC'] ? S.state.frentes['F-INC'].values.fanOn : true;
    if (!v.fanOn) {
      causes.push({ level: 2, kind: 'vent', text: `Ventilador ${f.main ? 'principal ' : ''}${f.fan} detenido` });
      raw = Math.max(raw, 2); immediate = true;
    } else if (!f.main && !mainOn) {
      causes.push({ level: 2, kind: 'vent', text: 'Ventilador principal VP-1 detenido: no entra aire fresco a la mina' });
      raw = Math.max(raw, 2); immediate = true;
    } else {
      let fl = 0;
      S.CONFIG.duct.tolerance.forEach((thr, i) => { if (f.lossExcess >= thr) fl = i + 1; });
      fl = Math.min(fl, 2);
      f.leakLevel = fl;
      if (fl > 0) {
        causes.push({ level: fl, kind: 'vent', text: `Se pierde ${Math.round(f.lossPct)} % del aire en el ducto (lo normal para ${f.ductLength} m es ${Math.round(f.lossExpected)} %): posible fuga` });
        raw = Math.max(raw, fl); immediate = true;
      }
    }

    // Detectores personales: un trabajador puede detectar gas que el sensor fijo aún no ve
    const fixedMax = Math.max(...['ch4', 'co', 'h2s', 'o2'].map(k => f.varLevels[k] || 0));
    st.workers.filter(w => w.frente === f.id && w.level > fixedMax).forEach(w => {
      const k = ['ch4', 'co', 'h2s', 'o2'].find(x => S.levelFor(x, w[x]) === w.level) || 'ch4';
      const c = S.CONFIG.variables[k];
      causes.push({ level: Math.min(w.level, 2), kind: 'detector', text: `Detector personal ${w.id} (${w.name}) marca ${c.label} ${S.fmtNum(w[k], c.dec)} ${c.unit} · llegó por el nodo ${w.node}` });
      raw = Math.max(raw, Math.min(w.level, 2)); immediate = true;
    });

    // Sensores mudos
    if (st.sensorsDown[f.id]) {
      causes.push({ level: 1, kind: 'equipo', text: 'Sensores fijos sin reportar: el frente no puede declararse seguro' });
      raw = Math.max(raw, 1); immediate = true;
    }

    // Persistencia e histéresis
    if (raw > f.level) {
      f.pendingUp++; f.pendingDown = 0;
      if (immediate || f.pendingUp >= R.persistence || raw - f.level >= 2) { f.level = raw; f.pendingUp = 0; }
    } else if (raw < f.level) {
      f.pendingDown++; f.pendingUp = 0;
      if (f.pendingDown >= R.recovery) { f.level = raw; f.pendingDown = 0; }
    } else { f.pendingUp = 0; f.pendingDown = 0; }

    const rank = { limit: 4, detector: 3.5, vent: 3, equipo: 2, trend: 1, pre: 0 };
    causes.sort((a, b) => (b.level - a.level) || ((rank[b.kind] || 0) - (rank[a.kind] || 0)));
    f.causes = causes;
    f.mainCause = causes.length ? causes[0].text : 'Condiciones normales';
    f.mainKind = causes.length ? causes[0].kind : null;

    // Bloqueo del frente (reingreso)
    if (f.level >= 2 && !f.blocked) { f.blocked = true; f.blockReason = 'Alerta nivel ' + f.level; f.normalStreak = 0; f.remeasured = false; }
    f.normalStreak = raw === 0 ? f.normalStreak + 1 : 0;
  }

  function openAlert(frenteId) {
    return S.state.alerts.find(a => a.frente === frenteId && a.state !== 'Cerrada');
  }
  S.openAlert = openAlert;

  function resetConfirmations(frenteId) {
    S.state.workers.forEach(w => { if (w.frente === frenteId) { w.confirmed = false; w.confirmAt = null; w.waitTicks = 0; S.detMsg && S.detMsg(w, 'Aviso recibido', 'Superficie envió el aviso: el detector vibra y suena hasta que el trabajador pulse "Recibido"'); } });
  }

  function manageAlerts(f) {
    const st = S.state, esc = S.CONFIG.escalation;
    let a = openAlert(f.id);

    if (f.level > 0 && !a) {
      st.alertSeq++;
      a = {
        id: 'A-' + String(st.alertSeq).padStart(4, '0'), frente: f.id, start: st.simTime,
        level: f.level, maxLevel: f.level, cause: f.mainCause, tipo: S.ALERT_TYPES[f.mainKind] || 'Atmósfera', state: 'Notificada',
        ackBy: null, ackAt: null, deadline: st.simTime + esc[f.level].seconds * 1000,
        escalated: false, escalatedTo: null, actions: [], closeAt: null,
        firstTtl: f.ttl, ttlVar: f.ttlVar, limitAt: null
      };
      st.alerts.push(a);
      resetConfirmations(f.id);
      S.addLog(`${a.id} · Nivel ${a.level} en ${f.id}: ${a.cause}`, 'alert');
      S.onNewAlert && S.onNewAlert(a);
      return;
    }
    if (!a) return;

    if (f.level > a.level) {
      a.level = f.level; a.maxLevel = Math.max(a.maxLevel, f.level); a.cause = f.mainCause; a.tipo = S.ALERT_TYPES[f.mainKind] || a.tipo;
      a.state = 'Notificada'; a.ackAt = null; a.ackBy = null; a.escalated = false;
      a.deadline = st.simTime + esc[f.level].seconds * 1000;
      resetConfirmations(f.id);
      S.addLog(`${a.id} sube a nivel ${a.level} en ${f.id}: ${a.cause}`, 'alert');
      S.onNewAlert && S.onNewAlert(a);
    } else if (f.level > 0 && f.level < a.level) {
      a.level = f.level;
    }
    if (f.level > 0 && f.causes.length) a.cause = f.mainCause;

    // Momento en que la variable vigilada cruzó el límite
    if (!a.limitAt && a.ttlVar) {
      const c = S.CONFIG.variables[a.ttlVar];
      if (f.varLevels[a.ttlVar] >= c.limitLevel) a.limitAt = st.simTime;
    }

    if (a.state === 'Notificada' && !a.escalated && st.simTime > a.deadline) {
      a.escalated = true; a.escalatedTo = esc[a.level].to;
      S.addLog(`${a.id} sin reconocer: escaló a ${a.escalatedTo}`, 'alert');
    }

    if (f.level === 0) {
      if (a.state !== 'Notificada') {
        if (a.maxLevel >= 2 || f.blocked) { a.state = 'Esperando reingreso'; }
        else { a.state = 'Cerrada'; a.closeAt = st.simTime; S.addLog(`${a.id} cerrada: ${f.id} en condiciones normales`, 'ok'); }
      }
    } else if (a.state === 'Esperando reingreso') {
      a.state = 'En atención';
    }
  }

  /* Propagación del aviso: decide qué baliza, luz o sirena se activa y con qué patrón.
     Cada activación se registra en la alerta con quién la ordenó y la confirmación del equipo. */
  function propagate() {
    const st = S.state, F = Object.values(st.frentes);
    const maxLvl = Math.max(0, ...F.map(f => f.level));
    const evac = maxLvl >= 3;
    S.DEVICES.forEach(d => {
      const dev = st.devices[d.id];
      let want = 0, src = null;
      if (d.frente) { const f = st.frentes[d.frente]; want = evac ? 3 : f.level; src = f.level >= want ? f : F.find(x => x.level === 3); }
      else if (d.evac) { want = evac ? 3 : 0; src = F.find(x => x.level === 3); }
      else if (d.surface) { want = maxLvl >= 2 ? maxLvl : 0; src = F.find(x => x.level === maxLvl); }
      if (want === dev.level) return;
      const local = d.local && src && src.id === d.frente && ['limit', 'pre'].includes(src.mainKind);
      dev.level = want; dev.since = st.simTime;
      dev.by = want === 0 ? 'Sistema (condiciones normales)' : local ? 'Módulo local del frente (sin esperar a superficie)' : d.surface ? 'Servidor en superficie · red local' : `Servidor en superficie vía ${S.rules.route()} → ${d.conc}`;
      dev.ackMs = Math.round(local ? 120 + Math.random() * 80 : 300 + Math.random() * 250);
      const text = `${d.id} (${d.tipo}) → ${S.devPattern(d, want)} · ordenó: ${dev.by} · el equipo confirmó en ${S.fmtNum(dev.ackMs / 1000, 1)} s`;
      const a = src && S.openAlert(src.id);
      if (a && want > 0) a.actions.push({ t: st.simTime, who: 'Sistema', text });
      if (want > 0 || d.frente) S.addLog(text, want ? 'alert' : 'ok');
    });
  }

  S.ALERT_TYPES = { trend: 'Alerta temprana por tendencia', pre: 'Precaución por umbral', limit: 'Límite superado', vent: 'Falla de ventilación', equipo: 'Equipo sin reportar', detector: 'Alerta de detector personal' };

  S.rules = {
    evaluate() {
      Object.values(S.state.frentes).forEach(f => { evaluateFrente(f); manageAlerts(f); });
      if (S.state.devices) propagate();
      S.persist();
    },
    ack(alertId, who) {
      const a = S.state.alerts.find(x => x.id === alertId);
      if (!a || a.ackAt) return;
      a.ackAt = S.state.simTime; a.ackBy = who; a.state = 'En atención';
      a.actions.push({ t: S.state.simTime, who, text: 'Alerta reconocida' });
      S.addLog(`${a.id} reconocida por ${who} en ${S.fmtDuration((a.ackAt - a.start) / 1000)}`, 'ok');
      S.rules.evaluate();
    },
    action(alertId, who, text) {
      const a = S.state.alerts.find(x => x.id === alertId);
      if (!a) return;
      a.actions.push({ t: S.state.simTime, who, text });
      S.addLog(`${a.id} · ${text} (${who})`, 'info');
      S.persist();
    },
    retire(frenteId, who) {
      S.state.workers.forEach(w => { if (w.frente === frenteId) w.status = 'Retirándose'; });
      const a = openAlert(frenteId);
      if (a) a.actions.push({ t: S.state.simTime, who, text: 'Orden de retiro del personal' });
      S.addLog(`Orden de retiro del personal de ${frenteId} (${who})`, 'alert');
      S.persist();
    },
    confirmWorker(workerId) {
      const w = S.state.workers.find(x => x.id === workerId);
      if (w && w.confirmed === false) { w.confirmed = true; w.confirmAt = S.state.simTime; S.detMsg(w, 'Confirmación', 'El trabajador pulsó "Recibido" en el detector'); S.addLog(`${w.id} confirmó el aviso`, 'ok'); }
    },
    remeasure(frenteId, who) {
      const f = S.state.frentes[frenteId];
      S.rules.addManual({ frente: frenteId, variable: 'ch4', value: Number(f.values.ch4.toFixed(2)), who: who + ' (remedición)' });
    },
    canReenter(frenteId) {
      const f = S.state.frentes[frenteId];
      const checks = [
        { ok: f.normalStreak >= S.CONFIG.reentryStableReadings, text: `Lecturas normales seguidas (${Math.min(f.normalStreak, S.CONFIG.reentryStableReadings)}/${S.CONFIG.reentryStableReadings})` },
        { ok: f.remeasured, text: 'Remedición manual registrada' },
        { ok: !S.state.sensorsDown[frenteId], text: 'Sensores fijos en línea' },
        { ok: f.values.fanOn, text: 'Ventilador en funcionamiento' }
      ];
      return { checks, ok: f.blocked && checks.every(c => c.ok) };
    },
    authorize(frenteId, who) {
      const f = S.state.frentes[frenteId];
      if (!S.rules.canReenter(frenteId).ok) return false;
      f.blocked = false; f.blockReason = '';
      S.state.workers.forEach(w => { if (w.frente === frenteId) w.status = 'En el frente'; });
      S.state.alerts.forEach(a => {
        if (a.frente === frenteId && a.state === 'Esperando reingreso') { a.state = 'Cerrada'; a.closeAt = S.state.simTime; a.actions.push({ t: S.state.simTime, who, text: 'Reingreso autorizado' }); }
      });
      S.addLog(`Reingreso a ${frenteId} autorizado por ${who}`, 'ok');
      S.persist();
      return true;
    },
    addManual(rec) {
      const st = S.state;
      const level = levelFor(rec.variable, Number(rec.value));
      const entry = Object.assign({ t: st.simTime, level, src: 'Manual' }, rec);
      st.manual.unshift(entry);
      const f = st.frentes[rec.frente];
      if (f && f.blocked) f.remeasured = true;
      const c = S.CONFIG.variables[rec.variable];
      S.addLog(`Medición manual en ${rec.frente}: ${c.label} ${S.fmtNum(rec.value, c.dec)} ${c.unit} (${rec.who})`, level > 0 ? 'alert' : 'info');
      if (level > 0 && !openAlert(rec.frente)) {
        st.alertSeq++;
        st.alerts.push({
          id: 'A-' + String(st.alertSeq).padStart(4, '0'), frente: rec.frente, start: st.simTime, level, maxLevel: level,
          cause: `Medición manual: ${c.name} ${S.fmtNum(rec.value, c.dec)} ${c.unit}`, state: 'Notificada', ackBy: null, ackAt: null,
          deadline: st.simTime + S.CONFIG.escalation[level].seconds * 1000, escalated: false, actions: [], closeAt: null, manual: true
        });
      }
      S.persist();
      return entry;
    },
    indicators() {
      const alerts = S.state.alerts;
      const acked = alerts.filter(a => a.ackAt);
      const ackAvg = acked.length ? acked.reduce((s, a) => s + (a.ackAt - a.start) / 1000, 0) / acked.length : null;
      const ant = alerts.map(a => a.limitAt ? (a.limitAt - a.start) / 60000 : (a.firstTtl || null)).filter(x => x !== null && x > 0);
      const antAvg = ant.length ? ant.reduce((s, x) => s + x, 0) / ant.length : null;
      const inAlert = S.state.workers.filter(w => w.confirmed !== null);
      const conf = inAlert.length ? inAlert.filter(w => w.confirmed).length / inAlert.length * 100 : null;
      return { ackAvg, antAvg, conf, total: alerts.length, open: alerts.filter(a => a.state !== 'Cerrada').length };
    },
    forecast() {
      const p = S.state.pressure;
      if (p.length < 10) return { level: 'BAJO', drop: 0 };
      const drop = p[Math.max(0, p.length - 20)].v - p[p.length - 1].v;
      const P = S.CONFIG.pressure;
      return { level: drop >= P.highDrop ? 'ALTO' : drop >= P.mediumDrop ? 'MEDIO' : 'BAJO', drop, current: p[p.length - 1].v };
    },
    testDevice(id, who) {
      const d = S.DEVICES.find(x => x.id === id), dev = S.state.devices[id];
      if (!d) return;
      dev.lastTest = S.state.simTime;
      S.addLog(`Prueba de ${id} (${d.tipo}) por ${who}: luz y sonido confirmados por el equipo`, 'ok');
    },
    route() {
      const n = S.state.network;
      if (n.fiberA) return 'Fibra · tramo A';
      if (n.fiberB) return 'Fibra · tramo B';
      return 'Malla inalámbrica';
    }
  };
})();
