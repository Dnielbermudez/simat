/* SIMAT · Vistas por rol */
(function () {
  const S = SIMAT;
  S.ui = S.ui || { frente: 'F-INC', histVar: 'ch4', histFrente: 'F-INC', alertTab: 'abiertas', detector: 'DP-07', showEvac: false, mapSel: 'F-INC' };

  const esc = s => String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const LV = ['Normal', 'Precaución', 'Alerta', 'Evacuación'];
  const LVACT = ['Trabajar con normalidad', 'Manténgase atento a nuevas instrucciones', 'Retírese del frente', 'EVACUE por la ruta de aire fresco'];
  const pill = l => `<span class="pill p${l}">${l === 0 ? '✓' : '▲'} ${l} · ${LV[l]}</span>`;
  const fv = (k, v) => { const c = S.CONFIG.variables[k]; return `${S.fmtNum(v, c.dec)} ${c.unit}`; };
  const who = () => (S.state.session ? S.state.session.name : 'Usuario');
  S.esc = esc; S.LV = LV;

  const P = {
    home: 'M3 17h18M5 17a7 7 0 0114 0M12 10V7', map: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14',
    alert: 'M8 18V10a4 4 0 018 0v8M6 18h12M12 3v2M4 7l1.5 1M20 7l-1.5 1', people: 'M4 14a8 8 0 0116 0v1H4zM12 6V3M2 17h20',
    chart: 'M4 20V4M4 20h16M8 16l4-5 3 3 5-7', pen: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4',
    fan: 'M12 10c0-4 1-7 4-7 2 0 2 3 0 5M14 12c4 0 7 1 7 4 0 2-3 2-5 0M12 14c0 4-1 7-4 7-2 0-2-3 0-5M10 12c-4 0-7-1-7-4 0-2 3-2 5 0',
    shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4', report: 'M6 3h9l4 4v14H6zM9 12h7M9 16h7',
    sensor: 'M7.8 7.8a6 6 0 000 8.4M16.2 7.8a6 6 0 010 8.4M5 5a10 10 0 000 14M19 5a10 10 0 010 14M11 12h2',
    network: 'M3 12h4M17 6h4M17 18h4M7 12l10-6M7 12l10 6',
    gear: 'M12 9a3 3 0 110 6 3 3 0 010-6zM19 12h2M3 12h2M12 3v2M12 19v2M17 7l1.4-1.4M5.6 18.4L7 17M17 17l1.4 1.4M5.6 5.6L7 7',
    logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10', mine: 'M3 21V11a9 9 0 0118 0v10M8 21v-7a4 4 0 018 0v7',
    cloud: 'M7 18h10a4 4 0 000-8 6 6 0 00-11.5 1.5A3.5 3.5 0 007 18z', sound: 'M4 9v6h4l5 4V5L8 9zM16 9a4 4 0 010 6M18.5 6.5a8 8 0 010 11'
  };
  const icon = (n, size, color) => `<svg width="${size || 18}" height="${size || 18}" viewBox="0 0 24 24" fill="none" stroke="${color || 'currentColor'}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P[n]}"/></svg>`;
  S.icon = icon;
  S.headframe = (size, color) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color || '#1A1C1F'}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 22L9 4h6l4 18M7.5 11h9M6.5 16h11M9 4l6 7M15 4l-6 7"/><circle cx="12" cy="4" r="1.6"/></svg>`;

  const mineIcon = l => {
    const fill = ['#DCFCE7', '#FDE68A', '#FED7AA', '#FECACA'][l];
    return `<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#22252A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21V11a9 9 0 0118 0v10"/><path d="M8 21v-7a4 4 0 018 0v7" fill="${fill}"/></svg>`;
  };
  const beaconIcon = l => {
    const c = ['#22C55E', '#F59E0B', '#F97316', '#EF4444'][l];
    return `<svg width="40" height="46" viewBox="0 0 34 40" aria-hidden="true"><rect x="9" y="30" width="16" height="6" rx="1" fill="#22252A"/><path d="M10 30V18a7 7 0 0114 0v12z" fill="${c}" class="${l ? 'pulse' : ''}"/>${l ? `<path d="M17 3v5M5 9l3 3M29 9l-3 3" stroke="${c}" stroke-width="2" stroke-linecap="round" class="pulse"/>` : ''}</svg>`;
  };

  function frenteCard(f, selectable) {
    return `<button type="button" class="card frente-card lv-${f.level} ${selectable && S.ui.frente === f.id ? 'selected' : ''}" data-action="pick-frente" data-id="${f.id}" style="padding:14px 16px">
      ${mineIcon(f.level).replace('width="44" height="44"', 'width="36" height="36"')}
      <div style="flex:1;min-width:0">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap"><b style="font-size:15px">${esc(f.nombre)}</b>${pill(f.level)}</div>
        <div class="stats" style="margin-top:4px"><span>CH₄ <b class="${f.varLevels.ch4 ? 't1' : ''}">${fv('ch4', f.values.ch4)}</b></span><span>Aire <b class="${f.leakLevel > 0 || !f.values.fanOn ? 't1' : ''}">${f.values.fanOn ? '−' + Math.round(f.lossPct) + ' %' : 'detenido'}</b></span>${f.blocked ? '<b class="t2">⛔ No apto</b>' : ''}</div>
      </div></button>`;
  }

  function alertPanel(f) {
    const a = S.openAlert(f.id);
    if (!a) {
      return `<section class="card"><div class="empty">${icon('shield', 34, '#15803D')}<div><b>Sin alertas abiertas en ${f.id}</b></div><div class="small">El sistema analiza cada lectura y avisa antes de que se supere un límite.</div></div></section>`;
    }
    const workers = S.state.workers.filter(w => w.frente === f.id);
    const conf = workers.filter(w => w.confirmed).length;
    const remain = Math.max(0, (a.deadline - S.state.simTime) / 1000);
    const c = f.ttlVar ? S.CONFIG.variables[f.ttlVar] : null;
    const ttlHtml = f.ttl !== null && c
      ? `<div class="ttl-box"><div class="small muted" style="font-weight:700">TIEMPO ESTIMADO HASTA EL LÍMITE DE ${esc(c.name.toUpperCase())} (${S.fmtNum(c.levels[c.limitLevel - 1], c.dec)} ${c.unit})</div><div class="big t1">~${Math.max(1, Math.round(f.ttl))} min</div><div class="small muted">Estimación por tendencia de las últimas lecturas; no es una predicción garantizada.</div></div>`
      : `<div class="ttl-box"><div class="small muted" style="font-weight:700">ESTADO</div><div class="big ${f.level >= 2 ? 't2' : 't1'}" style="font-size:28px">${f.level >= 2 ? 'Límite superado o ventilación comprometida' : 'En vigilancia'}</div></div>`;
    return `<section class="card pad0 alert-card l${a.level}"><div class="bar"></div><div class="body">
      <div class="col">
        <div style="display:flex;gap:12px;align-items:center">${beaconIcon(a.level)}<div><div class="small" style="font-weight:800;letter-spacing:.5px">NIVEL ${a.level} · ${esc((a.tipo || '').toUpperCase())} · ${a.id}</div><div style="font-size:20px;font-weight:800">${esc(f.mainCause)}</div></div></div>
        ${ttlHtml}
        <div style="font-size:14px;line-height:1.5">${f.causes.slice(1, 3).map(x => `<div>• ${esc(x.text)}</div>`).join('')}</div>
      </div>
      <div class="col">
        <div class="small muted" style="font-weight:700">CONFIRMACIONES</div>
        ${(() => { const bd = S.DEVICES.find(d => d.frente === f.id), dv = S.state.devices[bd.id]; return `<div class="kv"><span>Baliza ${bd.id}</span><b class="${dv.level ? 'tok' : 't2'}">${dv.level ? '✓ ' + esc(S.PATTERNS[dv.level].split(' · ')[0]) + ' · ' + S.fmtNum(dv.ackMs / 1000, 1) + ' s' : 'Sin activar'}</b></div>`; })()}
        <div class="kv"><span>Detectores avisados</span><b class="tok">${workers.length} de ${workers.length}</b></div>
        ${a.level >= 2 ? `<div class="kv"><span>Malacatero / bocamina</span><b class="tok">✓ Avisado</b></div>` : ''}${a.level >= 3 ? `<div class="kv"><span>Luces de evacuación</span><b class="tok">✓ Encendidas</b></div>` : ''}
        <div class="kv"><span>Trabajadores</span><b class="${conf === workers.length ? 'tok' : 't1'}">${conf} de ${workers.length}</b></div>
        <div class="kv"><span>Reconocida</span><b class="${a.ackAt ? 'tok' : 't2'}">${a.ackAt ? '✓ ' + esc(a.ackBy) : 'Pendiente'}</b></div>
        <div class="small ${a.escalated ? 't3' : 't2'}" style="font-weight:700">${a.ackAt ? 'En atención' : a.escalated ? `Escaló a ${esc(a.escalatedTo)}` : `Escala en ${S.fmtDuration(remain)} (tiempo simulado)`}</div>
        <div class="btns">
          <button class="btn primary" data-action="ack" data-id="${a.id}" ${a.ackAt ? 'disabled' : ''}>Reconocer</button>
          <button class="btn" data-action="retire" data-id="${f.id}">Ordenar retiro</button>
          <a class="btn ghost" href="#/alertas">Ver detalle</a>
        </div>
      </div></div></section>`;
  }

  function ventMini(f) {
    const v = f.values, lossOn = f.leakLevel > 0;
    return `<svg width="100%" height="70" viewBox="0 0 300 70" aria-hidden="true">
      <g class="spin ${v.fanOn ? '' : 'off'}"><circle cx="26" cy="35" r="20" fill="#fff" stroke="#22252A" stroke-width="2.2"/><path d="M26 35 L26 18 A17 17 0 0 1 40 26 Z M26 35 L40 44 A17 17 0 0 1 17 50 Z M26 35 L11 31 A17 17 0 0 1 17 21 Z" fill="#22252A"/></g>
      <rect x="48" y="28" width="210" height="14" rx="7" fill="#E9E8E3"/>
      ${v.fanOn ? `<line x1="52" y1="35" x2="${lossOn ? 150 : 254}" y2="35" stroke="#16A34A" stroke-width="3.5" class="flow"/>${lossOn ? '<line x1="180" y1="35" x2="254" y2="35" stroke="#D97706" stroke-width="3.5" class="flow"/>' : ''}` : ''}
      ${lossOn && v.fanOn ? '<rect x="150" y="24" width="28" height="22" rx="3" fill="none" stroke="#C2410C" stroke-width="2" stroke-dasharray="3 2"/>' : ''}
      <path d="M262 18 h30 v34 h-30 a17 17 0 0 1 0 -34z" fill="${['#DCFCE7', '#FDE68A', '#FED7AA', '#FECACA'][f.level]}" stroke="#22252A" stroke-width="1.6"/>
    </svg>`;
  }

  function readingsGrid(f) {
    const cells = ['ch4', 'o2', 'co', 'co2', 'h2s', 'temp'].map(k => {
      const c = S.CONFIG.variables[k], l = f.varLevels[k] || 0;
      const vals = f.history.slice(-30).map(h => h[k]);
      const slope = S.slopePerMinute(f.history, k);
      const arrow = Math.abs(slope) < 0.0005 * Math.max(Math.abs(f.values[k]), 1) ? '' : slope > 0 ? ' ▲' : ' ▼';
      return `<div class="reading" style="${l ? 'outline:2px solid ' + ['', '#D97706', '#C2410C', '#DC2626'][l] : ''}"><div class="k">${c.label} · ${esc(c.name)}</div><div class="v ${l ? 't' + l : ''}">${fv(k, f.values[k])}${arrow}</div>${S.charts.spark(vals, l ? '#B45309' : '#22252A', c.levels[c.limitLevel - 1])}<div class="s">Límite ${S.fmtNum(c.levels[c.limitLevel - 1], c.dec)} ${c.unit}${S.state.sensorsDown[f.id] ? ' · <b class="t2">sin reportar</b>' : ''}</div></div>`;
    }).join('');
    return cells + `<div class="reading"><div class="k">Caudal en el frente</div><div class="v ${f.leakLevel > 0 ? 't1' : ''}">${Math.round(f.values.qIn)} m³/min</div>${S.charts.spark(f.history.slice(-30).map(h => h.qIn), '#22252A')}<div class="s">Salida ${f.fan}: ${Math.round(f.values.qOut)} m³/min · pérdida ${Math.round(f.lossPct)} %</div></div>`;
  }

  function workersTable(list, compact) {
    if (!list.length) return '<div class="empty">Sin personal registrado.</div>';
    const g = (k, v) => { const l = S.levelFor(k, v); return `<td class="${l ? 't' + l : ''}"><b>${fv(k, v)}</b></td>`; };
    return `<div class="table-wrap"><table><thead><tr><th>Detector multigás</th><th>Trabajador</th>${compact ? '' : '<th>Cargo</th><th>Frente</th>'}<th>Nodo</th><th>CH₄</th><th>O₂</th><th>CO</th><th>H₂S</th><th>Estado</th><th>Aviso</th></tr></thead><tbody>
      ${list.map(w => `<tr class="${w.confirmed === false ? 'hl' : ''}"><td><b>${w.id}</b></td><td>${esc(w.name)}</td>${compact ? '' : `<td>${esc(w.cargo)}</td><td>${esc(S.state.frentes[w.frente].nombre)}</td>`}<td>${w.node} · hace ${w.lastSeen} s</td>${g('ch4', w.ch4)}${g('o2', w.o2 || 20.8)}${g('co', w.co || 8)}${g('h2s', w.h2s || 0.6)}<td>${esc(w.status)}</td><td>${w.confirmed === null ? '<span class="muted">Sin aviso</span>' : w.confirmed ? '<b class="tok">✓ Recibido</b>' : '<b class="t2">Sin confirmar</b>'}</td></tr>`).join('')}
    </tbody></table></div>`;
  }

  function frenteSelect(id, val) {
    return `<label class="field" style="min-width:160px">Frente<select data-ui="${id}">${S.FRENTES.map(f => `<option ${val === f.id ? 'selected' : ''}>${f.id}</option>`).join('')}</select></label>`;
  }

  /* ---------------- VISTAS ---------------- */
  /* Curva de pérdida normal del ducto con bandas de tolerancia y los frentes actuales */
  S.ductCurve = function (selId) {
    const D = S.CONFIG.duct, W = 820, H = 260, L = 56, B = 40, T = 14, Rm = 20, maxX = 800;
    const exp = x => D.base + D.per100m * x / 100;
    const F = Object.values(S.state.frentes);
    const maxY = Math.max(60, Math.ceil((Math.max(...F.map(f => f.lossPct)) + 5) / 10) * 10, Math.ceil((exp(maxX) + D.tolerance[1] + 5) / 10) * 10);
    const X = x => L + x / maxX * (W - L - Rm), Y = y => H - B - Math.min(y, maxY) / maxY * (H - B - T);
    const line = off => `M${X(0)} ${Y(exp(0) + off)} L${X(maxX)} ${Y(exp(maxX) + off)}`;
    const grid = [0, 200, 400, 600, 800].map(x => `<line x1="${X(x)}" y1="${T}" x2="${X(x)}" y2="${H - B}" stroke="#E9E8E3"/><text class="ax" x="${X(x)}" y="${H - B + 16}" text-anchor="middle" font-size="11" fill="#5A5E66">${x} m</text>`).join('')
      + Array.from({ length: maxY / 10 + 1 }, (_, i) => i * 10).map(y => `<line x1="${L}" y1="${Y(y)}" x2="${W - Rm}" y2="${Y(y)}" stroke="#E9E8E3"/><text class="ax" x="${L - 8}" y="${Y(y) + 4}" text-anchor="end" font-size="11" fill="#5A5E66">${y} %</text>`).join('');
    const band = `<path d="${line(0)} L${X(maxX)} ${Y(exp(maxX) + D.tolerance[0])} L${X(0)} ${Y(exp(0) + D.tolerance[0])}Z" fill="#DCFCE7" opacity=".7"/>`;
    const pts = F.map(f => { const same = F.filter(g => g.ductLength === f.ductLength), k = same.indexOf(f); const c = f.leakLevel >= 2 ? '#DC2626' : f.leakLevel ? '#D97706' : '#16A34A'; const lx = X(f.ductLength) + 10, ly = Y(f.lossPct) - 8 - k * 13;
      return `<circle cx="${X(f.ductLength)}" cy="${Y(f.lossPct)}" r="${f.id === selId ? 8 : 6}" fill="${c}" stroke="#fff" stroke-width="2"/><text x="${lx}" y="${ly}" font-size="11" font-weight="800" fill="${c}">${f.id} ${Math.round(f.lossPct)} %</text>`; }).join('');
    return `<svg width="100%" style="max-width:${W}px;display:block" viewBox="0 0 ${W} ${H}" role="img" aria-label="Curva de pérdida normal del ducto según su longitud">${grid}${band}
      <path d="${line(0)}" stroke="#16A34A" stroke-width="3" fill="none"/><path d="${line(D.tolerance[0])}" stroke="#D97706" stroke-width="2" stroke-dasharray="6 4" fill="none"/><path d="${line(D.tolerance[1])}" stroke="#DC2626" stroke-width="2" stroke-dasharray="6 4" fill="none"/>
      ${pts}<text x="${(L + W) / 2}" y="${H - 6}" text-anchor="middle" font-size="11" font-weight="700" fill="#5A5E66">Longitud del ducto</text></svg>
      <div class="small" style="display:flex;gap:16px;flex-wrap:wrap;margin-top:4px"><span><b style="color:#16A34A">━</b> Pérdida normal (curva)</span><span><b style="color:#D97706">┅</b> Precaución: +${D.tolerance[0]} puntos</span><span><b style="color:#DC2626">┅</b> Alerta: +${D.tolerance[1]} puntos</span><span>● Pérdida medida en cada frente</span></div>`;
  };

  S.views = {};

  S.views.resumen = {
    title: 'Resumen de la mina', sub: 'Supervisor de turno', render() {
      const fs = Object.values(S.state.frentes), f = S.state.frentes[S.ui.frente];
      const worst = Math.max(...fs.map(x => x.level));
      const counts = [0, 1, 2, 3].map(l => fs.filter(x => x.level === l).length);
      const people = S.state.workers.length, uncon = S.state.workers.filter(w => w.confirmed === false).length;
      const banner = `<section class="advice ${worst === 0 ? 'ok' : worst === 1 ? 'warn' : 'bad'}" style="align-items:center">
        ${worst === 0 ? icon('shield', 40, '#15803D') : beaconIcon(worst)}
        <div style="flex:1"><div class="ttlx">${worst === 0 ? 'MINA EN CONDICIONES NORMALES' : worst === 1 ? 'PRECAUCIÓN EN ' + counts[1] + ' FRENTE(S)' : 'ALERTA: RETIRAR PERSONAL DE LOS FRENTES EN ROJO'}</div>
          <div style="font-size:14px;margin-top:2px">${fs.length} frentes · ${people} personas bajo tierra${uncon ? ` · <b>${uncon} sin confirmar el aviso</b>` : ''} · red: ${S.rules.route()}</div></div>
        <div class="btns"><a class="btn" href="#/mapa">Ver mapa</a><a class="btn" href="#/personal">Ver personal</a></div></section>`;
      return `${banner}
      <div class="grid g3">${fs.map(x => frenteCard(x, true)).join('')}</div>
      <div class="row"><div class="grow3">${alertPanel(f)}</div>
        <section class="card grow2"><div class="card-head"><h2>Lecturas · ${esc(f.nombre)}</h2><span class="small muted">clic en un frente para cambiar</span></div><div class="grid g2">${readingsGrid(f)}</div></section></div>`;
    }
  };

  S.views.mapa = {
    title: 'Mapa vivo de la mina', sub: 'Vista en planta según el plano Mina_1 · se actualiza con cada lectura', render() {
      const st = S.state, F = st.frentes, sel = F[S.ui.mapSel] || F['F-INC'];
      const col = l => ['#22C55E', '#F59E0B', '#F97316', '#EF4444'][l];
      const bg = l => ['#DCFCE7', '#FEF3C7', '#FFEDD5', '#FEE2E2'][l];
      const lineCol = ok => ok ? '#FFC107' : '#9C9A92';
      // Posiciones según el plano: un frente a cada lado de cada nivel y el frente de inclinado
      const pos = {
        'F-INC':  { bx: 388, by: 652, bw: 64, bh: 50, label: [376, 682, 'end'], wk: [466, 678, 'h'] },
        'F-N1O':  { bx: 24,  by: 261, bw: 56, bh: 52, fan: [384, 270], duct: [368, 287, 82, 287],  leak: [200, 276, 40, 22], label: [24, 252, 'start'], wk: [34, 330, 'h'] },
        'F-N1E':  { bx: 760, by: 261, bw: 56, bh: 52, fan: [456, 270], duct: [472, 287, 758, 287], leak: [600, 276, 40, 22], label: [816, 252, 'end'], wk: [770, 330, 'h'] },
        'F-N2O':  { bx: 24,  by: 481, bw: 56, bh: 52, fan: [384, 490], duct: [368, 507, 82, 507],  leak: [200, 496, 40, 22], label: [24, 472, 'start'], wk: [34, 550, 'h'] },
        'F-N2E':  { bx: 760, by: 481, bw: 56, bh: 52, fan: [456, 490], duct: [472, 507, 758, 507], leak: [600, 496, 40, 22], label: [816, 472, 'end'], wk: [770, 550, 'h'] }
      };
      let s = `<svg class="map-svg" viewBox="0 0 840 720" role="img" aria-label="Plano de la mina con el estado de cada frente, los nodos de malla y el personal">
        <defs><pattern id="g" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="rgba(34,37,42,.05)"/></pattern></defs>
        <rect width="840" height="720" fill="url(#g)"/><rect width="840" height="40" fill="#E9E8E3"/>
        <text x="16" y="25" font-size="12" font-weight="800" fill="#5A5E66" letter-spacing="1">SUPERFICIE</text>
        <text x="474" y="25" font-size="12" font-weight="800" fill="#1A1C1F" letter-spacing="1">BOCAMINA</text>
        <g fill="#CFCDC5"><rect x="412" y="80" width="16" height="572"/><rect x="82" y="280" width="676" height="14"/><rect x="82" y="500" width="676" height="14"/>`;
      [110, 155, 200, 245, 290, 335, 505, 550, 595, 640, 685, 730].forEach(x => { s += `<rect x="${x - 3}" y="112" width="6" height="170"/><rect x="${x - 3}" y="332" width="6" height="170"/>`; });
      s += `</g>
        <text x="220" y="314" text-anchor="middle" font-size="11" font-weight="700" fill="#5A5E66">NIVEL 1 OESTE</text><text x="620" y="314" text-anchor="middle" font-size="11" font-weight="700" fill="#5A5E66">NIVEL 1 ESTE</text>
        <text x="220" y="534" text-anchor="middle" font-size="11" font-weight="700" fill="#5A5E66">NIVEL 2 OESTE</text><text x="620" y="534" text-anchor="middle" font-size="11" font-weight="700" fill="#5A5E66">NIVEL 2 ESTE</text>
        <text font-size="11" font-weight="700" fill="#5A5E66" transform="translate(446 330) rotate(90)">INCLINADO ↓ aire fresco</text>`;
      if (S.ui.showEvac) s += `<path d="M82 287 H398 M758 287 H398 M82 507 H398 M758 507 H398 M398 652 V80" fill="none" stroke="#16A34A" stroke-width="4" stroke-dasharray="10 6" class="flow"/><text x="240" y="96" font-size="12" font-weight="700" fill="#15803D">Ruta de evacuación sugerida → bocamina</text>`;
      // fibra en anillo por el inclinado y ramales por los niveles
      s += `<path d="M404 80 V640" stroke="${lineCol(st.network.fiberA)}" stroke-width="3" ${st.network.fiberA ? '' : 'stroke-dasharray="2 6"'} fill="none"/>`;
      s += `<path d="M436 80 V640" stroke="${lineCol(st.network.fiberB)}" stroke-width="3" ${st.network.fiberB ? '' : 'stroke-dasharray="2 6"'} fill="none"/>`;
      s += `<path d="M404 293 H90 M436 293 H750 M404 513 H90 M436 513 H750" stroke="${lineCol(st.network.fiberA || st.network.fiberB)}" stroke-width="1.5" opacity=".8" fill="none"/>`;
      if (!st.network.fiberA) s += `<circle cx="404" cy="200" r="12" fill="#DC2626"/><text x="404" y="205" text-anchor="middle" font-size="13" font-weight="800" fill="#fff">✕</text><text x="390" y="204" text-anchor="end" font-size="11" font-weight="700" fill="#B91C1C">fibra A cortada</text>`;
      if (!st.network.fiberB) s += `<circle cx="436" cy="230" r="12" fill="#DC2626"/><text x="436" y="235" text-anchor="middle" font-size="13" font-weight="800" fill="#fff">✕</text>`;
      // ventilador principal en la bocamina
      const mainOn = F['F-INC'].values.fanOn;
      s += `<g class="spin ${mainOn ? '' : 'off'}"><circle cx="420" cy="58" r="22" fill="${mainOn ? '#FFC107' : '#E9E8E3'}" stroke="#22252A" stroke-width="2.5"/><path d="M420 58 l0 -18 a18 18 0 0 1 15 9z M420 58 l15 9 a18 18 0 0 1 -15 9z M420 58 l-15 9 a18 18 0 0 1 0 -18z" fill="#22252A"/></g>
        <text x="450" y="62" font-size="11" font-weight="800" fill="${mainOn ? '#1A1C1F' : '#B91C1C'}">VENTILADOR PRINCIPAL VP-1${mainOn ? '' : ' · DETENIDO'}</text><text x="450" y="76" font-size="10" fill="#5A5E66">inyecta aire fresco por el inclinado</text>`;
      // conductos de ventilación auxiliar
      Object.values(F).forEach(f => {
        const p = pos[f.id]; if (!p || !p.fan) return;
        const v = f.values, loss = f.leakLevel > 0;
        s += `<line x1="${p.duct[0]}" y1="${p.duct[1]}" x2="${p.duct[2]}" y2="${p.duct[3]}" stroke="${v.fanOn ? (loss ? '#D97706' : '#16A34A') : '#9C9A92'}" stroke-width="3.5" class="${v.fanOn ? 'flow' : ''}"/>`;
        if (loss && v.fanOn) s += `<rect x="${p.leak[0]}" y="${p.leak[1]}" width="${p.leak[2]}" height="${p.leak[3]}" rx="4" fill="none" stroke="#C2410C" stroke-width="2" stroke-dasharray="4 3"/><text x="${p.leak[0] + p.leak[2] / 2}" y="${p.leak[1] - 4}" text-anchor="middle" font-size="10" font-weight="700" fill="#C2410C">fuga</text>`;
        s += `<g class="spin ${v.fanOn ? '' : 'off'}"><circle cx="${p.fan[0]}" cy="${p.fan[1]}" r="12" fill="#fff" stroke="#22252A" stroke-width="2"/><path d="M${p.fan[0]} ${p.fan[1]} l0 -9 a9 9 0 0 1 7.5 4.5z M${p.fan[0]} ${p.fan[1]} l7.5 4.5 a9 9 0 0 1 -7.5 4.5z M${p.fan[0]} ${p.fan[1]} l-7.5 4.5 a9 9 0 0 1 0 -9z" fill="#22252A"/></g>`;
      });
      // nodos de malla: cobertura y enlace con los detectores
      const nodes = {}; S.NODES.forEach(n => { nodes[n.id] = n; s += `<circle cx="${n.x}" cy="${n.y}" r="46" fill="rgba(59,130,246,.07)" stroke="rgba(59,130,246,.35)" stroke-dasharray="3 4"/>`; });
      const wpos = {};
      Object.values(F).forEach(f => {
        const p = pos[f.id]; if (!p) return;
        st.workers.filter(w => w.frente === f.id).forEach((w, i) => { wpos[w.id] = [p.wk[0] + i * 18, p.wk[1]]; });
      });
      st.workers.forEach(w => { const n = nodes[w.node], wp = wpos[w.id]; if (n && wp) s += `<line x1="${wp[0]}" y1="${wp[1]}" x2="${n.x}" y2="${n.y}" stroke="#2563EB" stroke-width="1.2" stroke-dasharray="2 3" opacity=".7"/>`; });
      S.NODES.forEach(n => { s += `<rect x="${n.x - 8}" y="${n.y - 8}" width="16" height="16" transform="rotate(45 ${n.x} ${n.y})" fill="#fff" stroke="#2563EB" stroke-width="2.5"/><text x="${n.x}" y="${n.y - 14}" text-anchor="middle" font-size="10" font-weight="800" fill="#1D4ED8">${n.id}</text>`; });
      // frentes
      Object.values(F).forEach(f => {
        const p = pos[f.id]; if (!p) return;
        s += `<g class="clickable" data-action="map-sel" data-id="${f.id}"><rect x="${p.bx}" y="${p.by}" width="${p.bw}" height="${p.bh}" rx="6" fill="${bg(f.level)}" stroke="${col(f.level)}" stroke-width="${S.ui.mapSel === f.id ? 4 : 2}"/>
          <rect x="${p.bx + 6}" y="${p.by + 7}" width="14" height="14" rx="3" fill="${col(f.varLevels.ch4 || 0)}" stroke="#22252A" stroke-width="1.5" class="${f.level ? 'pulse' : ''}"/>
          <rect x="${p.bx + p.bw - 20}" y="${p.by + 7}" width="14" height="14" rx="3" fill="${col(Math.max(f.varLevels.co || 0, f.varLevels.co2 || 0, f.varLevels.h2s || 0, f.varLevels.o2 || 0))}" stroke="#22252A" stroke-width="1.5"/>
          <text x="${p.bx + p.bw / 2}" y="${p.by + p.bh - 9}" text-anchor="middle" font-size="9.5" font-weight="800" fill="${st.sensorsDown[f.id] ? '#991B1B' : '#1A1C1F'}">${st.sensorsDown[f.id] ? 'SIN DATOS' : f.id}</text></g>
          <text x="${p.label[0]}" y="${p.label[1]}" text-anchor="${p.label[2]}" font-size="11" font-weight="800" fill="#1A1C1F">${esc(f.nombre)}</text>`;
      });
      st.workers.forEach(w => { const wp = wpos[w.id]; if (!wp) return; s += `<circle cx="${wp[0]}" cy="${wp[1]}" r="8" fill="${w.confirmed === false ? '#C2410C' : '#22252A'}" stroke="#fff" stroke-width="1.5"/><text x="${wp[0]}" y="${wp[1] + 3}" text-anchor="middle" font-size="7" font-weight="800" fill="#fff">${w.id.slice(3)}</text>`; });
      s += '</svg>';
      const c4 = S.CONFIG.variables.ch4;
      return `<div class="btns no-print"><button class="btn ${S.ui.showEvac ? 'dark' : ''}" data-action="toggle-evac">${S.ui.showEvac ? 'Ocultar' : 'Mostrar'} ruta de evacuación</button></div>
      <div class="row"><section class="card grow3"><div class="map-wrap">${s}</div>
        <div class="note">Clic en un frente para ver su detalle. ◆ azul: nodo de malla inalámbrica (enlaza el detector multigás de cada trabajador con la red). Línea punteada azul: detector → nodo. Línea amarilla: fibra óptica.</div></section>
        <aside class="grow2" style="display:flex;flex-direction:column;gap:16px">
          <section class="card lv-${sel.level}"><div class="small muted" style="font-weight:700">SELECCIONADO</div><div style="font-size:18px;font-weight:800;margin:4px 0">${esc(sel.nombre)} <span class="muted small">${sel.id} · ${sel.tipo}</span></div>${pill(sel.level)}
            <div style="font-size:30px;font-weight:800;margin-top:8px" class="${sel.varLevels.ch4 ? 't1' : ''}">CH₄ ${fv('ch4', sel.values.ch4)}</div>
            <div class="small muted" style="line-height:1.5">Límite ${S.fmtNum(c4.levels[1], 2)} % ${sel.ttl !== null && sel.ttl < 120 ? `· ~${Math.round(sel.ttl)} min al ritmo actual` : ''}<br>${esc(sel.mainCause)}<br>Ventilación: ${sel.main ? 'ventilador principal VP-1' : 'auxiliar ' + sel.fan} · Enlace: ${S.rules.route()}</div>
            <div class="small" style="margin-top:8px"><b>Detectores en este frente:</b> ${st.workers.filter(w => w.frente === sel.id).map(w => `${w.id} (${w.node})`).join(' · ') || '—'}</div></section>
          <section class="card"><h2>Leyenda</h2><div class="small" style="display:flex;flex-direction:column;gap:8px">
            <div>■ Sensores del frente: <span class="tok">verde normal</span> · <span class="t1">ámbar precaución</span> · <span class="t2">naranja alerta</span></div>
            <div>● Trabajador con detector multigás · <span class="t2">naranja = sin confirmar aviso</span></div><div><span style="color:#1D4ED8">◆ Nodo de malla</span> y su zona de cobertura</div><div>⟳ Ventilador principal (bocamina) y auxiliares de cada frente</div></div></section>
        </aside></div>`;
    }
  };

  S.views.alertas = {
    title: 'Alertas', sub: 'Ciclo de cada alerta, de la detección al cierre', render() {
      const all = S.state.alerts.slice().reverse();
      const tab = S.ui.alertTab;
      const list = all.filter(a => tab === 'abiertas' ? (a.state !== 'Cerrada' && a.state !== 'Esperando reingreso') : tab === 'reingreso' ? a.state === 'Esperando reingreso' : a.state === 'Cerrada');
      const count = t => all.filter(a => t === 'abiertas' ? (a.state !== 'Cerrada' && a.state !== 'Esperando reingreso') : t === 'reingreso' ? a.state === 'Esperando reingreso' : a.state === 'Cerrada').length;
      const steps = a => {
        const order = ['Notificada', 'En atención', 'Remedición', 'Cerrada'];
        const reached = a.state === 'Cerrada' ? 5 : a.state === 'Esperando reingreso' ? 4 : a.ackAt ? 3 : 2;
        const names = [['Detectada', S.fmtTime(a.start)], ['Notificada', 'frente y superficie'], ['Reconocida', a.ackAt ? S.fmtTime(a.ackAt) : 'pendiente'], ['En atención', a.actions.length + ' acciones'], ['Remedición', a.state === 'Esperando reingreso' ? 'esperando reingreso' : ''], ['Cerrada', a.closeAt ? S.fmtTime(a.closeAt) : '']];
        return `<div class="steps">${names.map((n, i) => `<div class="${i < reached ? 'done' : i === reached ? 'now' : ''}"><i></i>${n[0]}<span>${esc(n[1])}</span></div>`).join('')}</div>`;
      };
      const card = a => {
        const esc2 = S.CONFIG.escalation[a.level] || S.CONFIG.escalation[1];
        return `<section class="card pad0 alert-card l${a.maxLevel}"><div class="bar"></div><div style="padding:18px 20px;display:flex;flex-direction:column;gap:16px">
          <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:flex-start"><div><div class="small" style="font-weight:800">${a.id} · ${esc(S.state.frentes[a.frente] ? S.state.frentes[a.frente].nombre : a.frente)} · ${esc((a.manual ? 'Medición manual' : (a.tipo || 'Automática')).toUpperCase())}</div><div style="font-size:20px;font-weight:800">${esc(a.cause)}</div></div><div style="text-align:right">${pill(a.level)}<div class="small muted" style="margin-top:6px">Nivel máx. ${a.maxLevel} · desde ${S.fmtHM(a.start)}</div></div></div>
          ${steps(a)}
          <div class="row"><div class="grow1"><div class="small muted" style="font-weight:700;margin-bottom:6px">ESCALAMIENTO</div><div style="font-size:14px;line-height:1.6">Se avisa a: ${esc(esc2.notify)}<br>Tiempo para reconocer: <b>${esc2.seconds} s</b> · si no, escala a <b>${esc(esc2.to)}</b></div>${a.escalated ? `<div class="small t3" style="font-weight:800;margin-top:6px">Escaló a ${esc(a.escalatedTo)}</div>` : ''}</div>
            <div class="grow1"><div class="small muted" style="font-weight:700;margin-bottom:6px">ACCIONES REGISTRADAS</div><div class="log">${a.actions.map(x => `<div><time>${S.fmtHM(x.t)}</time><span>${esc(x.text)} · ${esc(x.who)}</span></div>`).join('') || '<span class="muted small">Ninguna todavía.</span>'}</div></div></div>
          ${a.state !== 'Cerrada' ? `<form class="btns no-print" data-form="action" data-id="${a.id}"><button type="button" class="btn primary" data-action="ack" data-id="${a.id}" ${a.ackAt ? 'disabled' : ''}>Reconocer</button><input name="text" placeholder="Acción tomada (ej. inspección de ducto)" aria-label="Acción tomada" style="flex:1 1 220px;min-height:46px;border-radius:10px;border:1px solid var(--strata);padding:0 12px"><button class="btn" type="submit">Registrar acción</button></form>` : ''}
        </div></section>`;
      };
      return `<div class="tabs no-print">${[['abiertas', 'Abiertas'], ['reingreso', 'Esperando reingreso'], ['cerradas', 'Cerradas']].map(([k, l]) => `<button class="tab ${tab === k ? 'on' : ''}" data-action="alert-tab" data-id="${k}">${l} · ${count(k)}</button>`).join('')}</div>
        ${list.length ? list.slice(0, 12).map(card).join('') : `<section class="card"><div class="empty">${icon('shield', 34, '#15803D')}<div><b>No hay alertas en esta categoría.</b></div><div class="small">Use el modo demostración para provocar un evento.</div></div></section>`}`;
    }
  };

  S.views.personal = {
    title: 'Personal bajo tierra', sub: 'Quién está dentro, dónde y si recibió el aviso', render() {
      const ws = S.state.workers, uncon = ws.filter(w => w.confirmed === false).length;
      return `<div class="grid g4">
        <div class="card kpi"><div class="k">Bajo tierra</div><div class="v">${ws.length}</div></div>
        <div class="card kpi"><div class="k">Retirándose</div><div class="v">${ws.filter(w => w.status === 'Retirándose').length}</div></div>
        <div class="card kpi ${uncon ? 'lv-2' : ''}"><div class="k">Sin confirmar aviso</div><div class="v ${uncon ? 't2' : ''}">${uncon}</div></div>
        <div class="card kpi"><div class="k">Detectores en línea</div><div class="v">${ws.length} / ${ws.length}</div></div></div>
        <section class="card" style="background:#22252A;color:#F2F2EE;display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between"><div><b style="font-size:16px">Conteo de evacuación</b><div class="small" style="color:#C9CBCF">En nivel 3 muestra quién ya confirmó, quién falta y su último nodo conocido.</div></div><a class="btn primary" href="#/mapa">Ver en el mapa</a></section>
        <section class="card"><h2>Personal por frente</h2>${workersTable(ws, false)}<div class="note">Ubicación por zona: el nodo que recibe la señal más fuerte del detector.</div></section>`;
    }
  };

  S.views.registro = {
    title: 'Registrar medición', sub: 'Respaldo manual: detector portátil o remedición', live: false, render() {
      const opts = Object.entries(S.CONFIG.variables).map(([k, c]) => `<option value="${k}">${c.label} · ${esc(c.name)} (${c.unit})</option>`).join('');
      return `<div class="row"><section class="card grow2"><h2>Nueva medición</h2>
        <form data-form="manual" style="display:flex;flex-direction:column;gap:14px">
          <label class="field">Frente<select name="frente" required>${S.FRENTES.map(f => `<option>${f.id}</option>`).join('')}</select></label>
          <label class="field">Variable<select name="variable" required>${opts}</select></label>
          <label class="field">Valor medido<input name="value" type="number" step="0.01" required placeholder="ej. 0,45"></label>
          <label class="field">Instrumento<select name="inst"><option>Detector portátil</option><option>Detector personal</option><option>Equipo de remedición</option></select></label>
          <div class="err" data-err></div>
          <button class="btn primary" type="submit">Guardar medición</button>
        </form><div class="note">La medición se evalúa con los mismos límites del sistema. Si está fuera de rango, genera una alerta. Si el frente está bloqueado, cuenta como remedición para el reingreso.</div></section>
        <section class="card grow3"><h2>Mediciones manuales registradas</h2>${manualTable(S.state.manual.slice(0, 15))}</section></div>`;
    }
  };
  function manualTable(list) {
    if (!list.length) return '<div class="empty">Aún no hay mediciones manuales.</div>';
    return `<div class="table-wrap"><table><thead><tr><th>Hora</th><th>Frente</th><th>Variable</th><th>Valor</th><th>Nivel</th><th>Registró</th><th>Instrumento</th></tr></thead><tbody>
      ${list.map(m => { const c = S.CONFIG.variables[m.variable]; return `<tr><td>${S.fmtTime(m.t)}</td><td>${m.frente}</td><td>${c.label}</td><td><b>${S.fmtNum(m.value, c.dec)} ${c.unit}</b></td><td>${pill(m.level)}</td><td>${esc(m.who)}</td><td>${esc(m.inst || 'Manual')}</td></tr>`; }).join('')}</tbody></table></div>`;
  }

  S.views.historial = {
    title: 'Historial y tendencias', sub: 'Lecturas registradas con proyección por tendencia', render() {
      const f = S.state.frentes[S.ui.histFrente], k = S.ui.histVar, c = S.CONFIG.variables[k] || null;
      const isFlow = k === 'caudal';
      const h = f.history;
      let chart;
      if (isFlow) {
        chart = S.charts.line({ series: [{ values: h.map(x => x.qOut), color: '#22252A' }, { values: h.map(x => x.qIn), color: '#D97706', width: 3 }], width: 1100, height: 300, yMin: 0, xLabels: [S.fmtHM(h[0].t), S.fmtHM(h[h.length - 1].t)], aria: 'Caudal de salida y de llegada' });
      } else {
        const limit = c.levels[c.limitLevel - 1];
        const ttl = f.ttlVar === k ? f.ttl : null;
        const steps = ttl !== null ? Math.min(60, Math.round(ttl / (S.CONFIG.simSecondsPerTick / 60))) : 0;
        chart = S.charts.line({ series: [{ values: h.map(x => x[k]), color: '#22252A' }], width: 1100, height: 300, limit: { value: limit, label: `Límite ${S.fmtNum(limit, c.dec)} ${c.unit}` }, warn: { value: c.levels[0] },
          projection: steps > 0 ? { from: f.values[k], to: limit, steps } : null, xLabels: [S.fmtHM(h[0].t), S.fmtHM(h[h.length - 1].t), steps ? '+' + Math.round(ttl) + ' min' : ''], aria: `${c.name} en ${f.id}` });
      }
      const rows = h.slice(-12).reverse();
      return `<div class="btns no-print" style="align-items:flex-end">${frenteSelect('histFrente', S.ui.histFrente)}
        <label class="field" style="min-width:200px">Variable<select data-ui="histVar">${Object.entries(S.CONFIG.variables).map(([kk, cc]) => `<option value="${kk}" ${kk === k ? 'selected' : ''}>${cc.label} · ${esc(cc.name)}</option>`).join('')}<option value="caudal" ${isFlow ? 'selected' : ''}>Caudal salida vs. llegada</option></select></label>
        <button class="btn" data-action="export-csv">Exportar CSV</button></div>
        ${workAdvice(f)}
        <section class="card"><h2>${isFlow ? 'Caudal' : esc(c.name)} · ${f.id} ${isFlow ? '<span class="small muted">(negro: salida · ámbar: llegada)</span>' : '<span class="small muted">(línea discontinua naranja: proyección si nada cambia)</span>'}</h2>${chart}</section>
        <section class="card"><h2>Últimas lecturas · ${f.id}</h2><div class="table-wrap"><table><thead><tr><th>Hora</th><th>CH₄</th><th>O₂</th><th>CO</th><th>CO₂</th><th>H₂S</th><th>Temp.</th><th>Caudal llegada</th><th>Fuente</th><th>Nivel</th></tr></thead><tbody>
          ${rows.map(r => `<tr><td>${S.fmtTime(r.t)}</td><td>${fv('ch4', r.ch4)}</td><td>${fv('o2', r.o2)}</td><td>${fv('co', r.co)}</td><td>${fv('co2', r.co2)}</td><td>${fv('h2s', r.h2s || 0)}</td><td>${fv('temp', r.temp)}</td><td>${Math.round(r.qIn)} m³/min</td><td>${r.stale ? '<b class="t2">Sin reportar</b>' : 'Fijo · ' + S.rules.route()}</td><td>${pill(r.level)}</td></tr>`).join('')}</tbody></table></div></section>`;
    }
  };

  /* Recomendación: ¿es óptimo trabajar en el frente según la tendencia? */
  function workAdvice(f) {
    const R = S.CONFIG.rules, fc = S.rules.forecast(), V = S.CONFIG.variables;
    const reasons = [];
    let kind = 'ok';
    if (f.blocked || f.level >= 2) {
      kind = 'bad';
      reasons.push(f.blocked ? `Frente bloqueado: ${esc(f.blockReason)}. Se requiere autorización de reingreso.` : esc(f.mainCause));
    }
    if (!f.values.fanOn) { kind = 'bad'; reasons.push(`Ventilador ${f.fan} detenido.`); }
    if (S.state.sensorsDown[f.id]) { kind = 'bad'; reasons.push('Sensores sin reportar: no se puede confirmar que el aire sea seguro.'); }
    if (kind !== 'bad') {
      if (f.level === 1 && !/llegaría al límite/.test(f.mainCause)) { kind = 'warn'; reasons.push(esc(f.mainCause)); }
      if (f.ttl !== null && f.ttl <= R.earlyWarningMinutes * 2) {
        kind = 'warn';
        const c = V[f.ttlVar];
        reasons.push(`Al ritmo actual, ${esc(c.name.toLowerCase())} llegaría al límite (${S.fmtNum(c.levels[c.limitLevel - 1], c.dec)} ${c.unit}) en ~${Math.max(1, Math.round(f.ttl))} min.`);
      }
      if (f.leakLevel > 0) { kind = 'warn'; reasons.push(`Llega ${Math.round(f.lossPct)} % menos aire: revisar el ducto.`); }
      if (fc.level !== 'BAJO') { kind = 'warn'; reasons.push(`Presión exterior en descenso: riesgo ${fc.level} de mayor emisión de metano.`); }
    }
    const title = kind === 'ok' ? 'ÓPTIMO PARA TRABAJAR' : kind === 'warn' ? 'TRABAJAR CON PRECAUCIÓN' : 'NO ES ÓPTIMO TRABAJAR · NO INGRESAR';
    const lead = kind === 'ok'
      ? `Todas las variables de ${esc(f.nombre)} están dentro de los límites y ninguna tiende a superarlos en los próximos ${R.earlyWarningMinutes * 2} min.`
      : kind === 'warn' ? 'Se puede continuar, con vigilancia y atendiendo las indicaciones:' : 'Las condiciones actuales no permiten trabajar con seguridad:';
    const ico = kind === 'ok' ? icon('shield', 40, '#15803D') : beaconIcon(kind === 'warn' ? 1 : 3);
    return `<section class="advice ${kind}" role="status">${ico}<div><div class="ttlx">${title}</div><div style="font-size:14px;margin-top:4px">${lead}</div>${reasons.length ? `<ul>${reasons.map(r => `<li>${r}</li>`).join('')}</ul>` : ''}<div class="small" style="margin-top:8px;color:var(--muted)">Recomendación basada en la tendencia de las lecturas (estimación, no predicción garantizada). La decisión final es del supervisor.</div></div></section>`;
  }
  S.workAdvice = workAdvice;

  S.views.ventilacion = {
    title: 'Ventiladores y ductos', sub: 'Responsable de ventilación', render() {
      const F = Object.values(S.state.frentes), f = S.state.frentes[S.ui.frente], v = f.values, loss = f.leakLevel > 0, fc = S.rules.forecast();
      const h = f.history.slice(-80);
      return `<div class="grid g3">${F.map(x => frenteCard(x, true)).join('')}</div>
        <section class="card lv-${loss || !v.fanOn ? 1 : 0}"><div class="card-head"><h2>${f.main ? 'Ventilador principal VP-1 → inclinado' : f.fan + ' → ducto (' + f.ductLength + ' m)'} → ${esc(f.nombre)}</h2>${!v.fanOn ? '<span class="pill p2">Ventilador detenido</span>' : loss ? '<span class="pill p1">Posible fuga detectada</span>' : '<span class="pill p0">Flujo normal</span>'}</div>
          <svg width="100%" height="120" viewBox="0 0 900 120" aria-hidden="true">
            <g class="spin ${v.fanOn ? '' : 'off'}"><circle cx="60" cy="56" r="40" fill="#fff" stroke="#22252A" stroke-width="3"/><path d="M60 56 L60 22 A34 34 0 0 1 88 38 Z M60 56 L88 74 A34 34 0 0 1 43 86 Z M60 56 L30 48 A34 34 0 0 1 42 28 Z" fill="#22252A"/></g>
            <rect x="104" y="44" width="680" height="24" rx="12" fill="#E9E8E3" stroke="#CFCDC5"/>
            ${v.fanOn ? `<line x1="110" y1="56" x2="${loss ? 470 : 778}" y2="56" stroke="#16A34A" stroke-width="5" class="flow"/>${loss ? '<line x1="560" y1="56" x2="778" y2="56" stroke="#D97706" stroke-width="5" class="flow"/><rect x="478" y="36" width="76" height="40" rx="6" fill="#FFF7ED" stroke="#C2410C" stroke-width="2.5" stroke-dasharray="5 3"/>' : ''}` : ''}
            <path d="M792 26 h90 v60 h-90 a30 30 0 0 1 0 -60z" fill="${['#DCFCE7', '#FDE68A', '#FED7AA', '#FECACA'][f.level]}" stroke="#22252A" stroke-width="2"/><text x="812" y="62" font-size="14" font-weight="800" fill="#1A1C1F">${f.id}</text>
            <text x="30" y="114" font-size="13" font-weight="700" fill="#1A1C1F">Salida ${Math.round(v.qOut)} m³/min</text>
            ${loss && v.fanOn ? `<text x="440" y="104" font-size="13" font-weight="700" fill="#C2410C">fuga estimada ${Math.round(f.ductLength * 0.65)}–${Math.round(f.ductLength * 0.85)} m</text>` : ''}
            <text x="640" y="114" font-size="13" font-weight="800" fill="${loss ? '#B45309' : '#1A1C1F'}">Llegada ${Math.round(v.qIn)} · −${Math.round(f.lossPct)} % (normal ${Math.round(f.lossExpected)} %)</text>
          </svg>
          <div class="btns" style="margin-top:12px"><button class="btn primary" data-action="repair" data-id="${f.id}">Registrar reparación</button><button class="btn" data-action="inspect" data-id="${f.id}">Registrar inspección</button></div></section>
        <div class="row"><section class="card grow3"><h2>Caudal salida vs. llegada <span class="small muted">(negro: salida · ámbar: llegada)</span></h2>${S.charts.line({ series: [{ values: h.map(x => x.qOut), color: '#22252A' }, { values: h.map(x => x.qIn), color: '#D97706', width: 3 }], width: 720, height: 260, yMin: 0, xLabels: [S.fmtHM(h[0].t), S.fmtHM(h[h.length - 1].t)], aria: 'Caudal' })}</section>
          <section class="card grow2"><div style="display:flex;gap:10px;align-items:center;margin-bottom:10px">${icon('cloud', 26)}<h2 style="margin:0">Pronóstico barométrico</h2></div>
            <div class="grid g2"><div class="reading"><div class="k">Presión exterior</div><div class="v">${S.fmtNum(fc.current, 1)} hPa</div></div><div class="reading"><div class="k">Cambio reciente</div><div class="v ${fc.drop >= S.CONFIG.pressure.mediumDrop ? 't1' : ''}">${fc.drop > 0 ? '−' : '+'}${S.fmtNum(Math.abs(fc.drop), 1)} hPa</div></div></div>
            <div style="margin-top:12px;font-size:14px;line-height:1.5">Riesgo de emisión de metano <span class="pill ${fc.level === 'BAJO' ? 'p0' : fc.level === 'MEDIO' ? 'p1' : 'p2'}">${fc.level}</span>. Cuando la presión exterior baja, tiende a salir más gas de zonas antiguas.</div>
            ${S.charts.spark(S.state.pressure.map(p => p.v), '#22252A')}<div class="note">${esc(S.CONFIG.pressure.source)}</div></section></div>
        <section class="card"><h2>Todos los ventiladores auxiliares</h2><div class="table-wrap"><table><thead><tr><th>Ventilador</th><th>Frente</th><th>Estado</th><th>Salida</th><th>Llegada</th><th>Pérdida medida</th><th>Pérdida normal (curva)</th><th>Exceso</th></tr></thead><tbody>
          ${F.map(x => `<tr class="${x.leakLevel > 0 ? 'hl' : ''}"><td><b>${x.fan}</b></td><td>${x.id}</td><td class="${x.values.fanOn ? 'tok' : 't2'}"><b>${x.values.fanOn ? '● Encendido' : '● Detenido'}</b></td><td>${Math.round(x.values.qOut)} m³/min</td><td>${Math.round(x.values.qIn)} m³/min</td><td><b class="${x.leakLevel > 0 ? 't1' : ''}">${Math.round(x.lossPct)} %</b></td><td>${Math.round(x.lossExpected)} % · ${x.ductLength} m</td><td><b class="${x.leakLevel > 0 ? 't1' : ''}">${x.lossExcess > 0 ? '+' : ''}${Math.round(x.lossExcess)} pts</b></td></tr>`).join('')}</tbody></table></div>
          <div class="note">Hay posible fuga cuando la pérdida medida supera la pérdida normal de la curva en más de ${S.CONFIG.duct.tolerance[0]} puntos. Curva: ${esc(S.CONFIG.duct.source)}.</div></section>
        <section class="card"><h2>Curva de pérdida normal del ducto</h2>${S.ductCurve(f.id)}</section>`;
    }
  };

  S.views.sst = {
    title: 'Seguridad del turno', sub: 'Jefe de mina / SST', render() {
      const I = S.rules.indicators(), F = Object.values(S.state.frentes), blocked = F.filter(f => f.blocked);
      const f = S.state.frentes[S.ui.frente], c = S.CONFIG.variables.ch4, h = f.history;
      const steps = f.ttlVar === 'ch4' && f.ttl !== null ? Math.min(60, Math.round(f.ttl / (S.CONFIG.simSecondsPerTick / 60))) : 0;
      const reentry = blocked.length ? blocked.map(b => {
        const r = S.rules.canReenter(b.id);
        return `<section class="card pad0 alert-card l2"><div class="bar"></div><div style="padding:18px 20px;display:flex;flex-direction:column;gap:10px"><h2 style="margin:0">Reingreso a ${b.id}</h2><div class="small muted">Bloqueado por: ${esc(b.blockReason)}</div>
          ${r.checks.map(ch => `<div class="kv"><span>${esc(ch.text)}</span><b class="${ch.ok ? 'tok' : 't2'}">${ch.ok ? '✓' : 'Pendiente'}</b></div>`).join('')}
          <div class="btns"><button class="btn" data-action="remeasure" data-id="${b.id}">Registrar remedición</button><button class="btn primary" data-action="authorize" data-id="${b.id}" ${r.ok ? '' : 'disabled'}>Autorizar reingreso</button></div></div></section>`;
      }).join('') : `<section class="card"><h2>Autorización de reingreso</h2><div class="empty">${icon('shield', 30, '#15803D')}<div>No hay frentes bloqueados.</div></div></section>`;
      return `<div class="grid g4">
        <div class="card kpi"><div class="k">Tiempo de aviso anticipado</div><div class="v">${I.antAvg !== null ? Math.round(I.antAvg) + ' min' : '—'}</div><div class="s ${I.antAvg !== null && I.antAvg >= 10 ? 'tok' : 'muted'}">Meta ≥ 10 min</div></div>
        <div class="card kpi"><div class="k">Tiempo medio de reconocimiento</div><div class="v">${S.fmtDuration(I.ackAvg)}</div><div class="s muted">Meta: dentro del tiempo de su nivel</div></div>
        <div class="card kpi ${I.conf !== null && I.conf < 100 ? 'lv-2' : ''}"><div class="k">Cobertura de confirmación</div><div class="v ${I.conf !== null && I.conf < 100 ? 't2' : ''}">${I.conf !== null ? Math.round(I.conf) + ' %' : '—'}</div><div class="s muted">Meta 100 % en niveles 2 y 3</div></div>
        <div class="card kpi"><div class="k">Alertas del turno</div><div class="v">${I.total}</div><div class="s muted">${I.open} abiertas</div></div></div>
        <div class="row"><section class="card grow3"><div class="card-head"><h2>CH₄ en ${f.id} · con proyección</h2>${frenteSelect('frente', S.ui.frente)}</div>${S.charts.line({ series: [{ values: h.map(x => x.ch4), color: '#22252A' }], width: 720, height: 260, limit: { value: c.levels[1], label: 'Límite 1,0 % (Circular ANM 01/2022)' }, warn: { value: c.levels[0] }, projection: steps ? { from: f.values.ch4, to: c.levels[1], steps } : null, xLabels: [S.fmtHM(h[0].t), S.fmtHM(h[h.length - 1].t), steps ? '+' + Math.round(f.ttl) + ' min' : ''], aria: 'Metano' })}</section>
          <div class="grow2" style="display:flex;flex-direction:column;gap:16px">${reentry}</div></div>
        <section class="card"><div class="card-head"><h2>Bitácora de alertas</h2><a href="#/reportes" class="small" style="font-weight:700">Generar reporte</a></div>${alertsTable(S.state.alerts.slice().reverse().slice(0, 10))}</section>`;
    }
  };
  function alertsTable(list) {
    if (!list.length) return '<div class="empty">Sin alertas registradas.</div>';
    return `<div class="table-wrap"><table><thead><tr><th>ID</th><th>Frente</th><th>Inicio</th><th>Nivel máx.</th><th>Causa</th><th>Reconocida en</th><th>Acciones</th><th>Estado</th></tr></thead><tbody>
      ${list.map(a => `<tr><td><b>${a.id}</b></td><td>${a.frente}</td><td>${S.fmtHM(a.start)}</td><td>${pill(a.maxLevel)}</td><td style="white-space:normal;min-width:220px">${esc(a.cause)}</td><td>${a.ackAt ? S.fmtDuration((a.ackAt - a.start) / 1000) : '—'}</td><td>${a.actions.length}</td><td><b class="${a.state === 'Cerrada' ? 'tok' : 't1'}">${esc(a.state)}</b></td></tr>`).join('')}</tbody></table></div>`;
  }
  S.alertsTable = alertsTable;

  S.views.reportes = {
    title: 'Reportes', sub: 'Para entrega de turno y fiscalización', render() {
      const I = S.rules.indicators(), F = Object.values(S.state.frentes);
      return `<div class="grid g3 no-print">
        <div class="card"><h2>Resumen de turno</h2><div class="small muted" style="line-height:1.5;margin-bottom:12px">Estado de los frentes, alertas, bloqueos, equipos e indicadores. Se imprime o se guarda en PDF.</div><button class="btn primary" data-action="print">Imprimir / guardar PDF</button></div>
        <div class="card"><h2>Historial de lecturas</h2><div class="small muted" style="line-height:1.5;margin-bottom:12px">Todas las lecturas de los frentes en CSV, para análisis o auditoría.</div><button class="btn" data-action="export-all">Exportar CSV</button></div>
        <div class="card"><h2>Bitácora de alertas</h2><div class="small muted" style="line-height:1.5;margin-bottom:12px">Cada alerta con su causa, tiempos y acciones registradas.</div><button class="btn" data-action="export-alerts">Exportar CSV</button></div></div>
        <section class="card"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><div><div class="small muted">SIMAT · Resumen de turno · DATOS SIMULADOS</div><h2 style="font-size:22px;margin-top:4px">Turno 2 · ${new Date(S.state.simTime).toLocaleDateString('es-CO')}</h2></div><div class="small muted">Generado ${S.fmtTime(S.state.simTime)}</div></div>
          <div class="grid g4" style="margin-top:14px"><div class="reading"><div class="k">Alertas</div><div class="v">${I.total}</div></div><div class="reading"><div class="k">Abiertas</div><div class="v">${I.open}</div></div><div class="reading"><div class="k">Reconocimiento medio</div><div class="v">${S.fmtDuration(I.ackAvg)}</div></div><div class="reading"><div class="k">Aviso anticipado</div><div class="v">${I.antAvg !== null ? Math.round(I.antAvg) + ' min' : '—'}</div></div></div>
          <h2 style="margin-top:18px">Estado de los frentes</h2><div class="table-wrap"><table><thead><tr><th>Frente</th><th>Nivel</th><th>CH₄</th><th>CO</th><th>Pérdida de caudal</th><th>Apto</th><th>Causa principal</th></tr></thead><tbody>
          ${F.map(f => `<tr><td><b>${f.id}</b></td><td>${pill(f.level)}</td><td>${fv('ch4', f.values.ch4)}</td><td>${fv('co', f.values.co)}</td><td>${Math.round(f.lossPct)} %</td><td>${f.blocked ? '<b class="t2">No apto</b>' : '<b class="tok">Apto</b>'}</td><td style="white-space:normal">${esc(f.mainCause)}</td></tr>`).join('')}</tbody></table></div>
          <h2 style="margin-top:18px">Alertas del turno</h2>${alertsTable(S.state.alerts.slice().reverse())}
          <div class="grid g2" style="margin-top:24px"><div style="border-top:1px solid #1A1C1F;padding-top:6px" class="small">Entrega: ____________________</div><div style="border-top:1px solid #1A1C1F;padding-top:6px" class="small">Recibe: ____________________</div></div></section>`;
    }
  };


  /* Dispositivos de aviso registrados: balizas, luces y sirenas */
  function devicesSection() {
    const st = S.state, col = ['#16A34A', '#D97706', '#EA580C', '#DC2626'];
    return `<section class="card"><div class="card-head"><h2>Dispositivos de aviso: balizas, luces y sirenas</h2><span class="small muted">${S.DEVICES.length} registrados</span></div>
      <p class="small muted" style="margin:0 0 10px;line-height:1.5">Cada dispositivo está registrado con su ubicación y el concentrador al que se conecta. El sistema le envía una <b>orden de patrón</b> (nivel 0 a 3) y el equipo responde que la ejecutó. La baliza del frente también la activa el <b>módulo local</b> cuando un gas pasa el umbral, sin esperar a superficie.</p>
      <div class="table-wrap"><table><thead><tr><th>ID</th><th>Tipo</th><th>Ubicación</th><th>Conexión</th><th>Patrón actual</th><th>Quién lo ordenó</th><th>Batería</th><th>Última prueba</th><th></th></tr></thead><tbody>
      ${S.DEVICES.map(d => { const v = st.devices[d.id]; return `<tr class="${v.level >= 2 ? 'bad' : v.level ? 'hl' : ''}"><td><b>${d.id}</b></td><td>${esc(d.tipo)}</td><td>${esc(d.zona)}</td><td class="small">${d.surface ? 'Red local' : esc(d.conc) + ' · relé/Modbus'}</td><td><b style="color:${col[v.level]}">● ${esc(S.devPattern(d, v.level))}</b></td><td class="small">${v.level ? (/Módulo local/.test(v.by) ? 'Módulo local' : 'Servidor') + ' · confirmó ' + S.fmtNum(v.ackMs / 1000, 1) + ' s' : '—'}</td><td>${d.surface ? 'Red + UPS' : v.battery + ' %'}</td><td>${S.fmtHM(v.lastTest)}</td><td><button class="btn sm" data-action="test-device" data-id="${d.id}">Probar</button></td></tr>`; }).join('')}</tbody></table></div>
      <h2 style="margin-top:16px;font-size:16px">Qué se activa en cada nivel</h2>
      <div class="table-wrap"><table><thead><tr><th>Nivel</th><th>Baliza del frente</th><th>Detector personal</th><th>Luces de evacuación</th><th>Superficie</th></tr></thead><tbody>
        <tr><td><b>1 · Precaución</b></td><td>Ámbar fijo · pitido lento</td><td>Pitido y vibración corta</td><td>Apagadas</td><td>Pantallas del supervisor y ventilación</td></tr>
        <tr><td><b>2 · Alerta</b></td><td>Naranja intermitente · sirena intermitente</td><td>Alarma intermitente hasta "Recibido"</td><td>Apagadas</td><td>Pantallas + aviso al malacatero</td></tr>
        <tr><td><b>3 · Evacuación</b></td><td>Rojo intermitente · sirena continua en <b>todos</b> los frentes</td><td>Alarma continua</td><td>Encendidas en la ruta de salida</td><td>Sirena de bocamina, malacatero, jefe de mina y brigada</td></tr></tbody></table></div>
      <div class="note">Datos SIMULADOS. Equipos para atmósferas con grisú (seguridad intrínseca, ATEX/IECEx grupo I) y con batería propia: siguen funcionando cuando se corta la energía por metano.</div></section>`;
  }

  S.views.sensores = {
    title: 'Sensores y equipos', sub: 'Administrador del sistema', render() {
      const F = Object.values(S.state.frentes), st = S.state, route = S.rules.route(), V = S.CONFIG.variables;
      const rows = [];
      F.forEach(f => {
        const down = st.sensorsDown[f.id];
        const stat = down ? '<b class="t2">● Sin reportar</b>' : '<b class="tok">● En línea</b>';
        ['ch4', 'o2', 'co', 'co2', 'h2s'].forEach((k, i) => rows.push([`M-${f.id}-${i + 1}`, esc(V[k].sensor), V[k].label, esc(f.nombre), k === 'ch4' || k === 'co2' ? 'UART → concentrador' : 'LMP91000 + ADC → concentrador', '1 s / 2 s', down ? '—' : fv(k, f.values[k]), stat, down]));
        if (!f.main) rows.push([`Q-${f.id}`, 'Caudal (salida y llegada del ducto)', 'm³/min', esc(f.nombre), '4–20 mA', '1 s / 2 s', Math.round(f.values.qIn), '<b class="tok">● En línea</b>', false]);
        rows.push([`V-${f.fan}`, f.main ? 'Estado ventilador principal' : 'Estado ventilador auxiliar', 'ON / OFF', f.fan, 'Contacto seco', 'por evento', f.values.fanOn ? 'ON' : '<b class="t2">OFF</b>', '<b class="tok">● En línea</b>', false]);
      });
      const online = rows.filter(r => !r[8]).length;
      return `<div class="grid g4"><div class="card kpi"><div class="k">Sensores fijos en línea</div><div class="v">${online} / ${rows.length}</div></div><div class="card kpi"><div class="k">Detectores multigás personales</div><div class="v">${st.workers.length}</div></div><div class="card kpi"><div class="k">Nodos de malla</div><div class="v">${S.NODES.length} / ${S.NODES.length}</div></div><div class="card kpi ${rows.length - online ? 'lv-2' : ''}"><div class="k">Sin reportar</div><div class="v ${rows.length - online ? 't2' : ''}">${rows.length - online}</div></div></div>
        <section class="card"><h2>Módulo de 5 gases por frente</h2><div class="grid g3">${['ch4', 'o2', 'co', 'co2', 'h2s'].map(k => `<div class="reading"><div class="k">${V[k].label} · ${esc(V[k].name)}</div><div style="font-weight:800;margin-top:4px">${esc(V[k].sensor)}</div><div class="s">Límite configurado: ${S.fmtNum(V[k].levels[V[k].limitLevel - 1], V[k].dec)} ${V[k].unit}</div></div>`).join('')}
          <div class="reading"><div class="k">Electrónica</div><div style="font-weight:800;margin-top:4px">Microcontrolador (STM32 / ESP32)</div><div class="s">NDIR por UART · electroquímicos con LMP91000 + ADS1115 · transductores con homologación ATEX/IECEx</div></div></div></section>
        <section class="card"><h2>Detector multigás personal (lo lleva cada trabajador)</h2><div class="grid g4">
          <div class="reading"><div class="k">Mide</div><div style="font-weight:800">CH₄ (NDIR) · O₂ · CO · CO₂ · H₂S</div></div>
          <div class="reading"><div class="k">Se lleva</div><div style="font-weight:800">Zona de respiración: pecho o lámpara del casco</div></div>
          <div class="reading"><div class="k">Transmite</div><div style="font-weight:800">Cada 15 s normal · 5 s en alerta · inmediato si supera un umbral</div></div>
          <div class="reading"><div class="k">Sin señal</div><div style="font-weight:800">Guarda lecturas, alarma por sí mismo y reenvía al nodo</div></div></div>
          <div class="table-wrap" style="margin-top:14px"><table><thead><tr><th>Detector</th><th>Trabajador</th><th>Frente</th><th>Nodo</th><th>CH₄</th><th>Batería</th><th>Calibración</th><th>Estado</th></tr></thead><tbody>
          ${st.workers.map(w => `<tr><td><b>${w.id}</b></td><td>${esc(w.name)}</td><td>${esc(st.frentes[w.frente].nombre)}</td><td>${w.node}</td><td>${fv('ch4', w.ch4)}</td><td>${70 + (w.id.charCodeAt(4) % 25)} %</td><td>${w.id === 'DP-11' ? '<b class="t1">vence en 3 días</b>' : '10/12/2026'}</td><td>${w.level ? '<b class="t2">● Alarma local N' + w.level + '</b>' : '<b class="tok">● En línea</b>'}</td></tr>`).join('')}</tbody></table></div></section>
        ${devicesSection()}
        <section class="card"><h2>Sensores fijos · ruta actual: ${route}</h2><div class="table-wrap"><table><thead><tr><th>ID</th><th>Sensor</th><th>Mide</th><th>Ubicación</th><th>Conexión</th><th>Muestreo / envío</th><th>Última lectura</th><th>Estado</th></tr></thead><tbody>
          ${rows.map(r => `<tr class="${r[8] ? 'bad' : ''}">${r.slice(0, 8).map((x, i) => `<td>${i === 0 ? '<b>' + x + '</b>' : x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
          <div class="note">Un equipo sin calibración vigente o sin reportar no puede declarar seguro un frente. Muestreo y envío: propuesta de diseño por validar con Minas.</div></section>`;
    }
  };


  /* Cómo viaja la información de un detector personal (ida y vuelta) */
  function detectorComm() {
    const st = S.state, W = st.workers;
    const w = W.find(x => x.id === S.ui.redWorker) || W.find(x => x.level > 0) || W[0];
    const r = S.detRoute(w), f = st.frentes[w.frente];
    const conc = r.hops[r.hops.length - 1], viaMesh = !st.network.fiberA && !st.network.fiberB;
    const box = (x, title, sub, dark, hl) => `<rect x="${x}" y="40" width="132" height="64" rx="10" fill="${dark ? '#22252A' : hl ? '#FFF7ED' : '#fff'}" stroke="${hl ? '#C2410C' : '#22252A'}" stroke-width="2"/><text x="${x + 66}" y="66" text-anchor="middle" font-size="12.5" font-weight="800" fill="${dark ? '#fff' : '#1A1C1F'}">${title}</text><text x="${x + 66}" y="86" text-anchor="middle" font-size="10.5" fill="${dark ? '#C9CBCF' : '#5A5E66'}">${sub}</text>`;
    const arrow = (x1, x2, label, cls) => `<line x1="${x1}" y1="72" x2="${x2 - 6}" y2="72" stroke="#D97706" stroke-width="3" class="${cls || 'flow'}"/><path d="M${x2 - 8} 66 L${x2} 72 L${x2 - 8} 78Z" fill="#D97706"/><text x="${(x1 + x2) / 2}" y="30" text-anchor="middle" font-size="10.5" font-weight="700" fill="#5A5E66">${label}</text>`;
    const xs = [8, 186, 364, 542, 720];
    const tipoCls = t => t === 'Alarma' ? 't2' : t === 'Aviso recibido' ? 't1' : t === 'Confirmación' ? 'tok' : 'muted';
    return `<section class="card"><div class="card-head"><h2>Detectores personales: cómo viaja la alerta</h2>
        <label class="small" style="display:flex;gap:8px;align-items:center">Ver ruta de <select data-ui="redWorker" aria-label="Detector">${W.map(x => `<option value="${x.id}" ${x.id === w.id ? 'selected' : ''}>${x.id} · ${esc(x.name)}${x.level ? ' ⚠' : ''}</option>`).join('')}</select></label></div>
      <p class="small muted" style="margin:0 0 8px;line-height:1.5">El detector no tiene cable: habla por <b>radio</b> con el <b>nodo de malla más cercano</b>. El mensaje salta de nodo en nodo hasta el <b>concentrador del nivel</b>, que lo sube por la <b>fibra</b> (o por la malla si la fibra está cortada) al <b>servidor en superficie</b>. Bajo tierra no hay GPS: la ubicación del trabajador es el nodo que recibe su señal.</p>
      <svg width="100%" viewBox="0 0 860 236" role="img" aria-label="Ruta del mensaje del detector ${w.id} hasta superficie y regreso del aviso">
        ${arrow(140, 186, 'radio · 1 salto')}${arrow(318, 364, r.hops.length > 2 ? 'radio · ' + (r.hops.length - 2) + ' salto(s) más' : 'radio')}${arrow(496, 542, viaMesh ? 'malla (fibra caída)' : S.rules.route().replace('Fibra · ', 'fibra '))}${arrow(674, 720, 'red local')}
        ${box(xs[0], 'Detector ' + w.id, esc(w.name), false, w.level > 0)}
        ${box(xs[1], 'Nodo ' + w.node, esc((S.NODES.find(n => n.id === w.node) || {}).zona || ''), false)}
        ${box(xs[2], conc, r.hops.length > 2 ? 'vía ' + r.hops.slice(1, -1).join(', ') : 'concentrador del nivel', false)}
        ${box(xs[3], 'Servidor local', 'en superficie', true)}
        ${box(xs[4], 'Pantallas', 'supervisor y SST', false)}
        <path d="M786 106 V150 H74 V112" fill="none" stroke="#22252A" stroke-width="2" stroke-dasharray="6 4"/><path d="M68 116 L74 106 L80 116Z" fill="#22252A"/>
        <text x="430" y="144" text-anchor="middle" font-size="11" font-weight="700" fill="#1A1C1F">Regreso del aviso: servidor → concentrador → nodo → detector y baliza del frente</text>
        <g font-size="11" fill="#1A1C1F">
          <rect x="8" y="166" width="206" height="62" rx="8" fill="#F4F1EA"/><text x="18" y="184" font-weight="800">1 · Detector mide</text><text x="18" y="200">cada 15 s normal · 5 s en alerta</text><text x="18" y="216">inmediato si pasa un umbral</text>
          <rect x="222" y="166" width="206" height="62" rx="8" fill="#F4F1EA"/><text x="232" y="184" font-weight="800">2 · Alarma local primero</text><text x="232" y="200">luz, sonido y vibración en el</text><text x="232" y="216">detector, sin esperar a superficie</text>
          <rect x="436" y="166" width="206" height="62" rx="8" fill="#F4F1EA"/><text x="446" y="184" font-weight="800">3 · Superficie decide</text><text x="446" y="200">crea la alerta del frente y avisa</text><text x="446" y="216">a todos los detectores del frente</text>
          <rect x="650" y="166" width="206" height="62" rx="8" fill="#F4F1EA"/><text x="660" y="184" font-weight="800">4 · Confirmación</text><text x="660" y="200">el trabajador pulsa "Recibido"</text><text x="660" y="216">y la confirmación vuelve igual</text></g>
      </svg>
      <div class="grid g4" style="margin-top:10px">
        <div class="reading"><div class="k">Estado de ${w.id}</div><div class="v ${w.level ? 't2' : 'tok'}" style="font-size:20px">${w.level ? 'Alarma nivel ' + w.level : 'Normal'}</div><div class="s">CH₄ ${fv('ch4', w.ch4)} · CO ${fv('co', w.co)}</div></div>
        <div class="reading"><div class="k">Envío actual</div><div class="v" style="font-size:20px">cada ${w.interval || 15} s</div><div class="s">${w.level || f.level ? 'modo alerta' : 'modo normal'}</div></div>
        <div class="reading"><div class="k">Tiempo hasta superficie</div><div class="v" style="font-size:20px">≈ ${S.fmtNum(r.latency, 1)} s</div><div class="s">${r.hops.length} saltos de radio · ${esc(S.rules.route())}</div></div>
        <div class="reading"><div class="k">Si no hay señal</div><div class="v" style="font-size:20px">Guarda y reenvía</div><div class="s">la alarma local funciona igual</div></div></div>
      <div class="row" style="margin-top:14px;align-items:flex-start">
        <div class="grow3"><h2 style="font-size:16px">Ruta de cada detector</h2><div class="table-wrap"><table><thead><tr><th>Detector</th><th>Trabajador</th><th>Frente</th><th>Ruta</th><th>Envío</th><th>Estado</th><th>Aviso</th></tr></thead><tbody>
          ${W.map(x => { const rr = S.detRoute(x); return `<tr class="${x.level ? 'bad' : x.id === w.id ? 'hl' : ''}"><td><b>${x.id}</b></td><td>${esc(x.name)}</td><td>${x.frente}</td><td class="small">${rr.hops.join(' → ')} → ${S.rules.route().replace('Fibra · ', 'fibra ')}</td><td>${x.interval || 15} s</td><td>${x.level ? '<b class="t2">● Alarma N' + x.level + '</b>' : '<b class="tok">● Normal</b>'}</td><td>${x.confirmed === null ? '—' : x.confirmed ? '<b class="tok">Recibido</b>' : '<b class="t1">Esperando</b>'}</td></tr>`; }).join('')}</tbody></table></div></div>
        <div class="grow2"><h2 style="font-size:16px">Mensajes recientes de los detectores</h2><div class="table-wrap" style="max-height:360px;overflow:auto"><table><thead><tr><th>Hora</th><th>Detector</th><th>Tipo</th><th>Mensaje</th></tr></thead><tbody>
          ${(st.detMsgs.length ? st.detMsgs.slice(0, 14) : []).map(m => `<tr><td>${S.fmtTime(m.t)}</td><td><b>${m.det}</b></td><td><b class="${tipoCls(m.tipo)}">${m.tipo}</b></td><td class="small" style="white-space:normal">${esc(m.text)}<br><span class="muted">${esc(m.route)}</span></td></tr>`).join('') || '<tr><td colspan="4" class="muted">Aún no hay mensajes.</td></tr>'}</tbody></table></div></div></div>
      <div class="note">Datos SIMULADOS. Radio de baja potencia en malla, certificada para atmósferas con grisú; la tecnología exacta (por ejemplo 900 MHz o Wi-Fi en malla) se define con el proveedor.</div></section>`;
  }

  S.views.red = {
    title: 'Red de comunicación', sub: 'La información sigue llegando aunque falle la fibra', render() {
      const n = S.state.network, route = S.rules.route();
      const layer = (title, name, ok, deg, text) => `<div class="card ${ok ? '' : deg ? 'lv-2' : 'lv-3'}" style="${ok ? 'border:2px solid #16A34A' : ''}"><div style="display:flex;justify-content:space-between;align-items:center"><span class="small muted" style="font-weight:800">${title}</span><span class="pill ${ok ? 'p0' : deg ? 'p2' : 'p3'}">${ok ? 'Activa' : deg ? 'Degradada' : 'Caída'}</span></div><div style="font-size:18px;font-weight:800;margin:8px 0">${name}</div><div class="small muted" style="line-height:1.5">${text}</div></div>`;
      const fibOk = n.fiberA && n.fiberB;
      return `<div class="grid g3">
        ${layer('CAPA 1 · PRINCIPAL', 'Fibra armada en anillo', fibOk, n.fiberA || n.fiberB, fibOk ? 'Dos caminos físicos: inclinado principal (A) y galería de retorno (B).' : n.fiberB ? `Tramo A cortado a las ${S.fmtHM(n.cutAt)}. Los datos van por el tramo B.` : 'Ambos tramos cortados: los datos van por la malla inalámbrica.')}
        ${layer('CAPA 2 · RESPALDO', 'Malla inalámbrica', true, true, `${S.NODES.length} de ${S.NODES.length} nodos en línea. ${!n.fiberA && !n.fiberB ? '<b>Transportando todos los datos.</b>' : 'Lleva los detectores personales.'}`)}
        ${layer('CAPA 3 · AUTÓNOMA', 'Alarma local', true, true, 'Balizas y detectores alarman sin superficie y guardan hasta 72 h de lecturas para reenviar.')}</div>
        <section class="card"><h2>Topología · ruta activa: ${route}</h2>
          <svg width="100%" height="190" viewBox="0 0 900 190" role="img" aria-label="Servidor en superficie, dos tramos de fibra hacia el concentrador del frente y nodos de malla">
            <rect x="10" y="66" width="150" height="56" rx="10" fill="#22252A"/><text x="85" y="92" text-anchor="middle" font-size="13" font-weight="800" fill="#fff">Servidor local</text><text x="85" y="110" text-anchor="middle" font-size="11" fill="#C9CBCF">superficie · UPS</text>
            <path d="M160 80 H 420 V 40 H 640 V 66" fill="none" stroke="${n.fiberA ? '#FFC107' : '#9C9A92'}" stroke-width="4" ${n.fiberA ? 'class="flow"' : 'stroke-dasharray="2 6"'}/>
            <text x="230" y="68" font-size="12" font-weight="700" fill="${n.fiberA ? '#1A1C1F' : '#B91C1C'}">Tramo A · ${n.fiberA ? 'activo' : 'cortado'}</text>
            ${n.fiberA ? '' : '<circle cx="420" cy="40" r="13" fill="#DC2626"/><text x="420" y="45" text-anchor="middle" font-size="14" font-weight="800" fill="#fff">✕</text>'}
            <path d="M160 108 H 420 V 150 H 640 V 122" fill="none" stroke="${n.fiberB ? '#FFC107' : '#9C9A92'}" stroke-width="4" ${n.fiberB ? 'class="flow"' : 'stroke-dasharray="2 6"'}/>
            <text x="230" y="134" font-size="12" font-weight="700" fill="${n.fiberB ? '#1A1C1F' : '#B91C1C'}">Tramo B · ${n.fiberB ? 'activo' : 'cortado'}</text>
            ${n.fiberB ? '' : '<circle cx="420" cy="150" r="13" fill="#DC2626"/><text x="420" y="155" text-anchor="middle" font-size="14" font-weight="800" fill="#fff">✕</text>'}
            <rect x="640" y="66" width="150" height="56" rx="10" fill="#fff" stroke="#22252A" stroke-width="2"/><text x="715" y="92" text-anchor="middle" font-size="13" font-weight="800" fill="#1A1C1F">Concentrador</text><text x="715" y="110" text-anchor="middle" font-size="11" fill="#5A5E66">memoria 72 h</text>
            <g fill="#fff" stroke="#22252A" stroke-width="2"><rect x="822" y="32" width="14" height="14" transform="rotate(45 829 39)"/><rect x="852" y="86" width="14" height="14" transform="rotate(45 859 93)"/><rect x="822" y="140" width="14" height="14" transform="rotate(45 829 147)"/></g>
            <path d="M790 94 H 852 M829 46 L 859 86 M859 100 L 829 140" stroke="#22252A" stroke-width="1.5" stroke-dasharray="4 3" ${!n.fiberA && !n.fiberB ? 'class="flow"' : ''}/>
            <text x="806" y="182" font-size="11" fill="#5A5E66">nodos en malla</text></svg></section>
        ${detectorComm()}
        <section class="card"><h2>Cómo se blinda la información</h2><ol style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px;font-size:14px;line-height:1.45">
          <li><b>Fibra en anillo:</b> si un tramo se corta, el dato va por el otro.</li><li><b>Fibra armada (acero corrugado) con chaqueta LSZH:</b> resiste aplastamiento y no emite humo tóxico.</li>
          <li><b>Malla inalámbrica:</b> ruta alterna cerca del frente y canal de los detectores personales.</li><li><b>Memoria local:</b> el concentrador y los detectores guardan y reenvían.</li>
          <li><b>Alarma autónoma:</b> baliza y detector alarman sin conexión con superficie.</li><li><b>Latido:</b> un equipo que deja de reportar se trata como alerta.</li></ol></section>`;
    }
  };

  S.views.config = {
    title: 'Configuración', sub: 'Administrador · límites, niveles y usuarios', live: false, render() {
      const V = S.CONFIG.variables, R = S.CONFIG.rules;
      return `<section class="card"><div class="card-head"><h2>Umbrales por variable</h2><span class="small muted">Cada valor guarda su fuente</span></div>
        <form data-form="config"><div class="table-wrap"><table><thead><tr><th>Variable</th><th>Precaución (1)</th><th>Alerta (2)</th><th>Evacuación (3)</th><th>Fuente</th></tr></thead><tbody>
          ${Object.entries(V).map(([k, c]) => `<tr><td><b>${c.label} · ${esc(c.name)}</b> <span class="muted small">(${c.unit}, ${c.dir === 'up' ? 'máximo' : 'mínimo'})</span></td>${c.levels.map((l, i) => `<td><input class="num" name="${k}-${i}" type="number" step="any" value="${l}" aria-label="${esc(c.name)} nivel ${i + 1}"></td>`).join('')}<td class="small" style="white-space:normal">${esc(c.source)}</td></tr>`).join('')}
        </tbody></table></div>
        <h2 style="margin-top:18px">Curva de pérdida normal del ducto</h2>
        <p class="small muted" style="margin:0 0 10px;line-height:1.5">Todo ducto pierde algo de aire por uniones, codos y longitud. Esa pérdida normal se describe con una curva: <b>pérdida esperada = base + % por cada 100 m × longitud</b>. SIMAT solo marca <b>posible fuga</b> cuando la pérdida medida (salida del ventilador vs. llegada al frente) se sale de la curva más que la tolerancia.</p>
        <div class="grid g4">
          <label class="field">Pérdida base (uniones y codos, %)<input name="duct-base" type="number" step="any" min="0" value="${S.CONFIG.duct.base}"></label>
          <label class="field">Pérdida por cada 100 m de ducto (%)<input name="duct-per100m" type="number" step="any" min="0" value="${S.CONFIG.duct.per100m}"></label>
          ${S.CONFIG.duct.tolerance.map((t, i) => i < 2 ? `<label class="field">Exceso para ${['Precaución (1)', 'Alerta (2)'][i]} (puntos)<input name="duct-tol-${i}" type="number" step="any" min="1" value="${t}"></label>` : `<input type="hidden" name="duct-tol-${i}" value="${t}">`).join('')}
        </div>
        ${S.ductCurve()}
        <div class="table-wrap" style="margin-top:10px"><table><thead><tr><th>Frente</th><th>Ducto</th><th>Pérdida normal</th><th>Precaución desde</th><th>Alerta desde</th><th>Medida ahora</th></tr></thead><tbody>
          ${Object.values(S.state.frentes).map(f => `<tr class="${f.leakLevel ? 'hl' : ''}"><td><b>${f.id}</b> · ${esc(f.nombre)}</td><td>${f.fan} · ${f.ductLength} m</td><td>${S.fmtNum(f.lossExpected, 1)} %</td><td>${S.fmtNum(f.lossExpected + S.CONFIG.duct.tolerance[0], 1)} %</td><td>${S.fmtNum(f.lossExpected + S.CONFIG.duct.tolerance[1], 1)} %</td><td><b class="${f.leakLevel ? 't1' : ''}">${S.fmtNum(f.lossPct, 1)} %</b></td></tr>`).join('')}</tbody></table></div>
        <div class="note">${esc(S.CONFIG.duct.source)}. En campo, la curva se levanta midiendo el caudal a la salida y a la llegada de cada ducto en buen estado.</div>
        <h2 style="margin-top:18px">Alerta temprana</h2><div class="grid g4">
          <label class="field">Lecturas para la tendencia<input name="trendWindow" type="number" min="4" value="${R.trendWindow}"></label>
          <label class="field">Avisar si llega al límite antes de (min)<input name="earlyWarningMinutes" type="number" min="1" value="${R.earlyWarningMinutes}"></label>
          <label class="field">Lecturas seguidas para subir de nivel<input name="persistence" type="number" min="1" value="${R.persistence}"></label>
          <label class="field">Lecturas seguidas para bajar de nivel<input name="recovery" type="number" min="1" value="${R.recovery}"></label></div>
        <div class="err" data-err style="margin-top:10px"></div>
        <div class="btns" style="margin-top:6px"><button class="btn primary" type="submit">Guardar cambios</button><button class="btn ghost" type="button" data-action="config-reset">Restaurar valores de demostración</button></div></form>
        <div class="note">Los valores marcados como demo deben reemplazarse por los VLP del Decreto 1886 de 2015 (modificado por el Decreto 944 de 2022) validados por Ingeniería de Minas. Los cambios se guardan en este equipo.</div></section>
        <section class="card"><h2>Usuarios y roles</h2><div class="table-wrap"><table><thead><tr><th>Usuario</th><th>Rol</th><th>Ve</th><th>Puede</th></tr></thead><tbody>
          <tr><td><b>supervisor</b></td><td>Supervisor de turno</td><td>Resumen, mapa, alertas, personal, historial</td><td>Reconocer, registrar acciones y mediciones, ordenar retiro</td></tr>
          <tr><td><b>ventilacion</b></td><td>Resp. de ventilación</td><td>Ventiladores, pronóstico, mapa, alertas</td><td>Registrar inspección y reparación</td></tr>
          <tr><td><b>sst</b></td><td>Jefe de mina / SST</td><td>Indicadores, reportes, personal, bitácora</td><td>Autorizar reingreso, generar reportes</td></tr>
          <tr><td><b>admin</b></td><td>Administrador</td><td>Sensores, red, configuración</td><td>Configurar límites y equipos</td></tr>
          <tr><td><b>frente</b></td><td>Trabajador del frente</td><td>Pantalla del frente y detector</td><td>Confirmar "Recibido"</td></tr></tbody></table></div></section>`;
    }
  };

  /* Pantalla del trabajador (sin menú) */
  S.views.frente = {
    full: true, render() {
      const f = S.state.frentes[S.ui.frente], l = f.level, w = S.state.workers.find(x => x.id === S.ui.detector) || S.state.workers[1];
      const col = ['#22C55E', '#F59E0B', '#F97316', '#EF4444'][l];
      const c = S.CONFIG.variables.ch4;
      const lamps = ['#EF4444', '#F97316', '#F59E0B', '#22C55E'];
      const lampOn = [3, 2, 1, 0].map(x => x === l);
      const wl = Math.max(l, S.levelFor('ch4', w.ch4));
      const msg = l === 0 ? 'Condiciones normales.' : esc(f.mainCause) + '.';
      return `<div class="frente-screen l${l}"><div class="stripes"></div>
        <header><div style="display:flex;align-items:center;gap:12px"><span class="brand-mark">${S.headframe(24)}</span><b style="font-size:20px;letter-spacing:2px">SIMAT · ${esc(f.nombre).toUpperCase()}</b></div>
          <div class="btns" style="align-items:center"><select data-ui="frente" aria-label="Frente" style="min-height:40px;border-radius:8px;padding:0 8px">${S.FRENTES.map(x => `<option ${x.id === f.id ? 'selected' : ''}>${x.id}</option>`).join('')}</select>
          <button class="btn sm" data-action="sound">${icon('sound', 16)} ${S.state.soundOn ? 'Sonido activo' : 'Activar sonido'}</button><span class="chip sim" style="background:transparent;color:#F59E0B;border-color:#F59E0B">${S.fmtTime(S.state.simTime)} · SIMULADO</span><button class="btn sm" data-action="demo-toggle">Demo</button><button class="btn sm" data-action="logout">Salir</button></div></header>
        <div class="fs-body"><div class="fs-main">
          <div class="fs-level" style="background:${col};color:#12161C"><svg width="64" height="74" viewBox="0 0 34 40" aria-hidden="true"><rect x="9" y="30" width="16" height="6" rx="1" fill="#12161C"/><path d="M10 30V18a7 7 0 0114 0v12z" fill="#12161C" class="${l ? 'pulse' : ''}"/>${l ? '<path d="M17 3v5M5 9l3 3M29 9l-3 3" stroke="#12161C" stroke-width="2.5" stroke-linecap="round" class="pulse"/>' : ''}</svg><div><div class="n">NIVEL ${l}</div><div class="w">${LV[l].toUpperCase()}</div></div></div>
          <div class="fs-msg">${LVACT[l]}.<br><span style="font-size:.75em;opacity:.85">${msg}</span></div>
          <div class="fs-reads"><div><div>CH₄ en el frente</div><div class="v" style="color:${col}">${fv('ch4', f.values.ch4)}</div><div>Límite ${S.fmtNum(c.levels[1], 2)} %${f.ttl !== null && f.ttlVar === 'ch4' ? ' · subiendo' : ''}</div></div>
            <div><div>Aire que llega</div><div class="v" style="color:${f.leakLevel > 0 ? '#F59E0B' : '#F4F1EA'}">${f.values.fanOn ? '−' + Math.round(f.lossPct) + ' %' : 'SIN AIRE'}</div><div>${f.values.fanOn ? 'Ventilador ' + f.fan + ' encendido' : 'Ventilador ' + f.fan + ' detenido'}</div></div></div>
        </div>
        <div class="fs-side">
          <div class="beacon"><b>BALIZA DEL FRENTE</b><div class="lamps">${lamps.map((cl, i) => `<span class="${lampOn[i] ? 'on ' + (l >= 2 ? 'blink' : '') : ''}" style="background:${cl};color:${cl}"></span>`).join('')}</div><span class="small">${['Verde fijo · sin sonido', 'Ámbar fijo · pitido lento', 'Naranja intermitente · sirena intermitente', 'Rojo intermitente · sirena continua'][l]}</span></div>
          <div class="detector"><div class="led ${wl ? 'pulse' : ''}" style="background:${['#22C55E', '#F59E0B', '#F97316', '#EF4444'][wl]}"></div>
            <div class="scr"><div class="small" style="display:flex;justify-content:space-between;gap:6px"><select data-ui="detector" aria-label="Detector" style="font-size:12px">${S.state.workers.filter(x => x.frente === f.id).map(x => `<option ${x.id === w.id ? 'selected' : ''}>${x.id}</option>`).join('')}</select><span>Nodo ${w.node}</span><span>Bat 78 %</span></div>
              <div style="background:${['#DCFCE7', '#FEF3C7', '#FFEDD5', '#FEE2E2'][wl]};padding:6px 8px;font-weight:800;font-size:13px">NIVEL ${wl} · ${LV[wl].toUpperCase()}</div>
              <div class="g"><div>CH₄<b>${fv('ch4', w.ch4)}</b></div><div>O₂<b>${fv('o2', f.values.o2)}</b></div><div>CO<b>${fv('co', f.values.co)}</b></div><div>CO₂<b>${fv('co2', f.values.co2)}</b></div><div>H₂S<b>${fv('h2s', w.h2s || f.values.h2s)}</b></div><div>Envío<b style="font-size:13px">${f.level ? 'cada 5 s' : 'cada 15 s'}</b></div></div></div>
            <button data-action="confirm-worker" data-id="${w.id}" ${w.confirmed === false ? '' : 'disabled'}>${w.confirmed === false ? '✓ RECIBIDO' : w.confirmed ? 'Aviso confirmado' : 'Sin avisos'}</button></div>
        </div></div>
        <div class="fs-legend">${LV.map((n, i) => `<div class="${i === l ? 'on' : ''}"><span style="width:14px;height:14px;background:${['#22C55E', '#F59E0B', '#F97316', '#EF4444'][i]}"></span>${i} · ${n}: ${['trabajar', 'atento', 'retirarse', 'evacuar'][i]}</div>`).join('')}</div></div>`;
    }
  };
})();
