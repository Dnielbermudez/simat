/* SIMAT · Gráficos SVG propios (sin librerías, funcionan sin internet) */
(function () {
  const S = SIMAT;

  S.charts = {
    /* opts: { series:[{values:[], color, width, dash, label}], width, height, yMin, yMax,
               limit:{value,label,color}, warn:{value,label}, projection:{from,to,steps}, xLabels:[a,b], unit } */
    line(opts) {
      const W = opts.width || 640, H = opts.height || 220, pl = 46, pr = 16, pt = 18, pb = 26;
      const iw = W - pl - pr, ih = H - pt - pb;
      const all = [];
      opts.series.forEach(s => s.values.forEach(v => { if (v !== null && !isNaN(v)) all.push(v); }));
      if (opts.limit) all.push(opts.limit.value);
      if (opts.projection) all.push(opts.projection.to);
      let yMin = opts.yMin !== undefined ? opts.yMin : Math.min.apply(null, all);
      let yMax = opts.yMax !== undefined ? opts.yMax : Math.max.apply(null, all);
      if (yMax - yMin < 1e-6) { yMax += 1; yMin -= 1; }
      const padY = (yMax - yMin) * 0.08; yMax += padY; if (opts.yMin === undefined) yMin -= padY;
      const n = Math.max(...opts.series.map(s => s.values.length), 2);
      const extra = opts.projection ? opts.projection.steps : 0;
      const total = n - 1 + extra;
      const x = i => pl + (i / total) * iw;
      const y = v => pt + ih - ((v - yMin) / (yMax - yMin)) * ih;
      const fmt = v => S.fmtNum(v, Math.abs(yMax - yMin) < 5 ? 2 : 0);

      let g = `<svg class="chart" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${opts.aria || 'Gráfico'}">`;
      for (let i = 0; i <= 3; i++) {
        const v = yMin + (yMax - yMin) * i / 3, yy = y(v);
        g += `<line x1="${pl}" y1="${yy}" x2="${W - pr}" y2="${yy}" stroke="#EFEEE9"/>`;
        g += `<text x="${pl - 6}" y="${yy + 4}" text-anchor="end" class="ax">${fmt(v)}</text>`;
      }
      if (opts.warn) {
        g += `<line x1="${pl}" y1="${y(opts.warn.value)}" x2="${W - pr}" y2="${y(opts.warn.value)}" stroke="#B45309" stroke-dasharray="2 4"/>`;
      }
      if (opts.limit) {
        const ly = y(opts.limit.value);
        g += `<line x1="${pl}" y1="${ly}" x2="${W - pr}" y2="${ly}" stroke="${opts.limit.color || '#DC2626'}" stroke-width="1.5" stroke-dasharray="6 4"/>`;
        g += `<text x="${W - pr}" y="${ly - 5}" text-anchor="end" class="ax lim">${opts.limit.label}</text>`;
      }
      opts.series.forEach(s => {
        const pts = s.values.map((v, i) => (v === null || isNaN(v)) ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`).filter(Boolean).join(' ');
        g += `<polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="${s.width || 2.5}" ${s.dash ? `stroke-dasharray="${s.dash}"` : ''} stroke-linejoin="round"/>`;
      });
      if (opts.projection) {
        const p = opts.projection;
        g += `<polyline points="${x(n - 1)},${y(p.from)} ${x(total)},${y(p.to)}" fill="none" stroke="#D97706" stroke-width="2.5" stroke-dasharray="6 5"/>`;
        g += `<circle cx="${x(n - 1)}" cy="${y(p.from)}" r="4.5" fill="#D97706"/>`;
      }
      if (opts.xLabels) {
        g += `<text x="${pl}" y="${H - 6}" class="ax">${opts.xLabels[0]}</text>`;
        g += `<text x="${x(n - 1)}" y="${H - 6}" text-anchor="${extra ? 'middle' : 'end'}" class="ax">${opts.xLabels[1]}</text>`;
        if (extra && opts.xLabels[2]) g += `<text x="${W - pr}" y="${H - 6}" text-anchor="end" class="ax">${opts.xLabels[2]}</text>`;
      }
      return g + '</svg>';
    },

    spark(values, color, limit) {
      const W = 200, H = 36;
      const all = values.concat(limit !== undefined ? [limit] : []);
      let mn = Math.min(...all), mx = Math.max(...all);
      if (mx - mn < 1e-6) { mx += 0.5; mn -= 0.5; }
      const x = i => (i / Math.max(values.length - 1, 1)) * W;
      const y = v => H - 3 - ((v - mn) / (mx - mn)) * (H - 6);
      let g = `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" preserveAspectRatio="none" aria-hidden="true">`;
      if (limit !== undefined) g += `<line x1="0" y1="${y(limit)}" x2="${W}" y2="${y(limit)}" stroke="#DC2626" stroke-dasharray="4 3" stroke-width="1"/>`;
      g += `<polyline points="${values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="2" vector-effect="non-scaling-stroke"/>`;
      return g + '</svg>';
    }
  };
})();
