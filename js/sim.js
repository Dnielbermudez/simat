/* SIMAT · Simulador de sensores (DATOS SIMULADOS)
 * Genera lecturas continuas a partir de un modelo físico simple:
 * menos caudal de aire en el frente => más gas acumulado.
 * En una mina real, este módulo se reemplaza por la capa de integración
 * que lee los sensores por Modbus RS-485 / 4–20 mA / radio.
 */
(function () {
  const S = SIMAT;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const noise = (amp) => (Math.random() + Math.random() + Math.random() - 1.5) * amp;
  const toward = (cur, target, alpha) => cur + (target - cur) * alpha;

  function stepFrente(f) {
    const st = S.state;
    const v = f.values, m = f.model;
    const down = !!st.sensorsDown[f.id];

    // Ventilador y ducto
    const outTarget = v.fanOn ? f.design * (1 + noise(0.008)) : f.design * 0.03;
    v.qOut = toward(v.qOut, outTarget, v.fanOn ? 0.6 : 0.5);
    // Si el ventilador principal (VP-1, bocamina) se detiene, los auxiliares recirculan aire sin renovar
    const mainOn = st.frentes['F-INC'] ? st.frentes['F-INC'].values.fanOn : true;
    const mainFactor = (f.main || mainOn) ? 1 : 0.45;
    const inTarget = v.qOut * (1 - m.leak) * mainFactor * (1 + noise(0.006));
    v.qIn = toward(v.qIn, inTarget, 0.5);

    const deficit = clamp(1 - v.qIn / f.design, 0, 1);
    const vent = clamp(v.qIn / f.design, 0.02, 1.2);

    // Desprendimiento de metano adicional que decae lentamente
    m.extraEmission = m.extraEmission * 0.985;
    const ch4Eq = m.emission + m.extraEmission + 2.6 * Math.pow(deficit, 1.1);
    const co2Eq = 0.06 + 0.55 * deficit;
    m.coSpike = m.coSpike * (1 - 0.07 * vent);
    m.h2sSpike = (m.h2sSpike || 0) * (1 - 0.06 * vent);

    if (!down) {
      v.ch4 = clamp(toward(v.ch4, ch4Eq, 0.05) + noise(0.006), 0, 5);
      v.co2 = clamp(toward(v.co2, co2Eq, 0.08) + noise(0.003), 0.03, 5);
      v.co = clamp(8 + 10 * deficit + m.coSpike + noise(0.8), 0, 500);
      v.o2 = clamp(20.9 - 0.25 * v.ch4 - 0.9 * (v.co2 - 0.04) - 0.6 * deficit + noise(0.03), 15, 21);
      v.temp = clamp(toward(v.temp, 26.3 + 1.2 * deficit, 0.03) + noise(0.04), 10, 45);
      v.h2s = clamp(0.6 + 4 * deficit + m.h2sSpike + noise(0.08), 0, 100);
    }

    f.history.push({
      t: st.simTime, ch4: v.ch4, o2: v.o2, co: v.co, co2: v.co2, h2s: v.h2s, temp: v.temp,
      qOut: v.qOut, qIn: v.qIn, fanOn: v.fanOn, level: f.level, stale: down
    });
    if (f.history.length > S.CONFIG.historyPoints) f.history.shift();
  }

  // Ruta que sigue el mensaje de un detector personal hasta superficie
  S.detRoute = function (w) {
    const node = S.NODES.find(n => n.id === w.node);
    const hops = [w.node].concat(node ? node.path : []);
    return { hops, text: `${w.id} → ${hops.join(' → ')} → ${S.rules.route()} → Servidor`, latency: 0.15 + 0.08 * hops.length + (S.state.network.fiberA || S.state.network.fiberB ? 0.05 : 0.4) };
  };

  S.detMsg = function (w, tipo, text) {
    const st = S.state, r = S.detRoute(w);
    w.lastMsg = { t: st.simTime, tipo };
    const down = tipo === 'Aviso recibido';
    st.detMsgs.unshift({ t: st.simTime, det: w.id, name: w.name, frente: w.frente, tipo, text, route: down ? `Servidor → ${S.rules.route()} → ${r.hops.slice().reverse().join(' → ')} → ${w.id}` : r.text, latency: r.latency });
    st.detMsgs = st.detMsgs.slice(0, 40);
  };

  function stepWorkers() {
    const st = S.state;
    st.workers.forEach((w, i) => {
      const f = st.frentes[w.frente];
      w.local = w.local || { ch4: 0 };
      w.local.ch4 *= 0.93; // bolsa de gas local que se diluye
      w.ch4 = Math.max(0, f.values.ch4 + w.local.ch4 + noise(0.03));
      w.o2 = f.values.o2 + noise(0.05); w.co = Math.max(0, f.values.co + noise(1.2));
      w.co2 = Math.max(0, f.values.co2 + noise(0.01)); w.h2s = Math.max(0, f.values.h2s + noise(0.15));
      const prev = w.level || 0;
      w.level = Math.max(S.levelFor('ch4', w.ch4), S.levelFor('o2', w.o2), S.levelFor('co', w.co), S.levelFor('h2s', w.h2s));
      // Frecuencia de envío: 15 s normal · 5 s si el detector o el frente están en alerta
      w.interval = (w.level || f.level) ? 5 : 15;
      w.lastSeen = Math.round(1 + Math.random() * (w.interval - 1));
      if (w.level > prev) {
        const k = ['ch4', 'co', 'h2s', 'o2'].find(x => S.levelFor(x, w[x]) === w.level);
        const c = S.CONFIG.variables[k];
        S.detMsg(w, 'Alarma', `Detector en nivel ${w.level}: ${c.label} ${S.fmtNum(w[k], c.dec)} ${c.unit} · alarma local (luz, sonido y vibración) y envío inmediato`);
      } else if ((st.tick + i) % 6 === 0) {
        S.detMsg(w, 'Lectura', `Lectura de rutina (cada ${w.interval} s): CH₄ ${S.fmtNum(w.ch4, 2)} %`);
      }
      if (w.confirmed === false && !w.manualOnly) {
        w.waitTicks = (w.waitTicks || 0) + 1;
        const needed = w.slow ? Infinity : (w.id === 'DP-07' ? 5 : 2);
        if (w.waitTicks >= needed) { w.confirmed = true; w.confirmAt = st.simTime; S.detMsg(w, 'Confirmación', 'El trabajador pulsó "Recibido" en el detector'); }
      }
    });
  }

  function stepPressure() {
    const st = S.state;
    if (st.pressureTrendTicks > 0) {
      st.pressureBase += st.pressureTrend;
      st.pressureTrendTicks--;
      Object.values(st.frentes).forEach(f => { f.model.extraEmission += 0.004; });
    }
    st.pressure.push({ t: st.simTime, v: st.pressureBase + noise(0.05) });
    if (st.pressure.length > 80) st.pressure.shift();
  }

  S.sim = {
    step() {
      const st = S.state;
      st.tick++;
      st.simTime += S.CONFIG.simSecondsPerTick * 1000;
      Object.values(st.frentes).forEach(stepFrente);
      stepWorkers();
      stepPressure();
      S.rules.evaluate();
    },

    event(name, frenteId) {
      const st = S.state;
      const f = st.frentes[frenteId || 'F-INC'];
      switch (name) {
        case 'metano':
          f.model.extraEmission += 0.9; f.values.ch4 += 0.35;
          S.addLog(`SIMULADO · desprendimiento de metano en ${f.id}`, 'sim'); break;
        case 'ventilador':
          f.values.fanOn = false; f.values.qOut = f.design * 0.1; f.values.qIn = f.values.qOut * 0.9; f.values.ch4 += 0.15;
          if (f.main) Object.values(st.frentes).forEach(x => { if (!x.main) x.values.qIn *= 0.6; });
          S.addLog(`SIMULADO · ventilador ${f.fan}${f.main ? ' (principal)' : ''} detenido`, 'sim'); break;
        case 'ducto': {
          const leak = (S.expectedLoss(f) + 25) / 100;
          f.model.leak = leak; f.values.qIn = f.values.qOut * (1 - leak); f.values.ch4 += 0.08;
          S.addLog(`SIMULADO · rotura de ducto en ${f.id}`, 'sim'); break; }
        case 'detector': {
          const w = st.workers.find(x => x.frente === f.id && !x.slow) || st.workers.find(x => x.frente === f.id);
          if (w) { w.local.ch4 = 1.25; S.addLog(`SIMULADO · bolsa de metano junto a ${w.id} (${w.name}) en ${f.id}`, 'sim'); }
          break; }
        case 'voladura':
          f.model.coSpike = 35; f.model.h2sSpike = 6; f.values.co += 35; f.values.h2s += 6;
          f.blocked = true; f.blockReason = 'Voladura'; f.normalStreak = 0; f.remeasured = false;
          S.addLog(`SIMULADO · voladura en ${f.id}: frente bloqueado hasta autorizar reingreso`, 'sim'); break;
        case 'fibra':
          if (st.network.fiberA) { st.network.fiberA = false; st.network.cutAt = st.simTime; S.addLog('SIMULADO · fibra tramo A cortada: datos por el tramo B', 'sim'); }
          else if (st.network.fiberB) { st.network.fiberB = false; S.addLog('SIMULADO · fibra tramo B cortada: datos por la malla inalámbrica', 'sim'); }
          break;
        case 'sensor':
          st.sensorsDown[f.id] = !st.sensorsDown[f.id];
          S.addLog(`SIMULADO · sensores fijos de ${f.id} ${st.sensorsDown[f.id] ? 'sin reportar' : 'reconectados'}`, 'sim'); break;
        case 'presion':
          st.pressureTrend = -0.25; st.pressureTrendTicks = 18;
          S.addLog('SIMULADO · caída de presión barométrica exterior', 'sim'); break;
        case 'reparar':
          f.model.leak = S.expectedLoss(f) / 100; f.values.fanOn = true;
          S.addLog(`Reparación registrada en ${f.fan} / ducto de ${f.id}`, 'ok'); break;
        case 'reset':
          S.FRENTES.forEach(fr => {
            const x = st.frentes[fr.id];
            x.model.leak = S.expectedLoss(fr) / 100; x.model.extraEmission = 0; x.model.coSpike = 0; x.model.h2sSpike = 0;
            Object.assign(x.values, S.newFrenteState(fr).values); x.history.length = 0; x.pendingUp = 0; x.pendingDown = 0;
          });
          st.network = { fiberA: true, fiberB: true, mesh: true, cutAt: null };
          st.sensorsDown = {}; st.pressureTrend = 0; st.pressureTrendTicks = 0; st.pressureBase = 1013;
          Object.values(st.frentes).forEach(x => { x.blocked = false; x.blockReason = ''; x.level = 0; });
          st.alerts.forEach(a => { if (a.state !== 'Cerrada') { a.state = 'Cerrada'; a.closeAt = st.simTime; a.actions.push({ t: st.simTime, who: 'Sistema', text: 'Cerrada al restablecer la simulación' }); } });
          st.workers.forEach(w => { w.confirmed = null; w.status = 'En el frente'; w.local = { ch4: 0 }; w.level = 0; });
          st.detMsgs = [];
          Object.values(st.devices).forEach(d => { d.level = 0; d.since = null; d.by = null; });
          S.addLog('Simulación restablecida a condiciones normales', 'ok'); break;
      }
      // Lectura inmediata: el sistema reacciona al evento sin esperar el siguiente ciclo
      if (name !== 'reset') S.sim.step(); else { for (let i = 0; i < 12; i++) S.sim.step(); }
    }
  };
})();
