/* SIMAT · Configuración base
 * IMPORTANTE: los límites marcados como "demo" son valores de demostración.
 * Reemplácelos por los Valores Límite Permisibles del Decreto 1886 de 2015
 * (modificado por el Decreto 944 de 2022) validados por Ingeniería de Minas.
 */
window.SIMAT = window.SIMAT || {};

SIMAT.CONFIG_DEFAULT = {
  tickMs: 2000,          // cada cuánto llega una lectura (tiempo real)
  simSecondsPerTick: 30, // tiempo simulado por lectura (acelera la demostración)
  historyPoints: 240,

  // Umbrales por nivel: [precaución (1), alerta (2), evacuación (3)]
  // sensor: referencia del transductor propuesto por el equipo (homologación ATEX/IECEx a nivel de componente)
  variables: {
    ch4:  { label: 'CH₄',  name: 'Metano',              unit: '%',   dec: 2, dir: 'up',   levels: [0.5, 1.0, 1.5], limitLevel: 2, sensor: 'Winsen MH-440D · NDIR (infrarrojo) · 0–5 % Vol', source: '1,0 % alarma: Circular ANM 01/2022 · 1,5 % corte eléctrico (dato del equipo, validar con Decreto 1886)' },
    o2:   { label: 'O₂',   name: 'Oxígeno',             unit: '%',   dec: 1, dir: 'down', levels: [20.0, 19.5, 19.0], limitLevel: 2, sensor: 'Alphasense O2-A2 · electroquímico · 0–25 % Vol', source: 'Mínimo 19,5 %: dato del equipo · validar con Decreto 1886/944' },
    co:   { label: 'CO',   name: 'Monóxido de carbono', unit: 'ppm', dec: 0, dir: 'up',   levels: [15, 25, 50], limitLevel: 2, sensor: 'Alphasense CO-AF · electroquímico con filtro · 0–500 ppm', source: 'VLP 25 ppm: dato del equipo · validar con Decreto 1886/944' },
    co2:  { label: 'CO₂',  name: 'Dióxido de carbono',  unit: '%',   dec: 2, dir: 'up',   levels: [0.3, 0.5, 1.0], limitLevel: 2, sensor: 'Winsen MH-410D · NDIR (infrarrojo) · 0–5 % Vol', source: 'VLP 5.000 ppm (0,5 %): dato del equipo · validar con Decreto 1886/944' },
    h2s:  { label: 'H₂S',  name: 'Sulfuro de hidrógeno', unit: 'ppm', dec: 1, dir: 'up',  levels: [5, 10, 20], limitLevel: 2, sensor: 'Alphasense H2S-A1 · electroquímico · 0–100 ppm', source: 'VLP 10 ppm: dato del equipo · validar con Decreto 1886/944' },
    temp: { label: 'Temp.', name: 'Temperatura',        unit: '°C',  dec: 1, dir: 'up',   levels: [28, 30, 32], limitLevel: 2, sensor: 'Sensor de temperatura del módulo', source: 'Demo · validar con Decreto 1886/944' }
  },

  // Curva de pérdida normal del ducto: todo ducto pierde algo de aire por uniones, codos y longitud.
  // Pérdida esperada (%) = base + porcentaje por cada 100 m × longitud del ducto / 100
  // Hay posible fuga cuando la pérdida medida supera la esperada en más de la tolerancia de cada nivel.
  duct: { base: 2, per100m: 1.5, tolerance: [10, 30, 50], source: 'Demo · ajustar con la curva medida por Minas en cada ducto' },

  rules: {
    trendWindow: 8,          // lecturas usadas para la tendencia
    earlyWarningMinutes: 30, // alerta temprana si llegaría al límite antes de esto
    persistence: 1,          // lecturas seguidas para subir de nivel (1 = aviso inmediato)
    recovery: 4              // lecturas seguidas para bajar de nivel (histéresis)
  },

  // Segundos (simulados) para reconocer antes de escalar
  escalation: {
    1: { seconds: 120, to: 'Jefe de mina', notify: 'Supervisor y resp. de ventilación' },
    2: { seconds: 60,  to: 'Jefe de mina', notify: 'Frente, supervisor, ventilación y malacatero' },
    3: { seconds: 30,  to: 'Brigada de salvamento', notify: 'Toda la mina, jefe de mina, malacatero y brigada' }
  },

  reentryStableReadings: 6, // lecturas normales seguidas antes de permitir reingreso

  pressure: { mediumDrop: 2, highDrop: 4, source: 'Regla demo · validar con Minas' }
};

/* Frentes según el plano de la mina (Mina_1): bocamina, inclinado central,
   Nivel 1 y Nivel 2 (Oeste y Este) y sobreguías que suben desde cada nivel. */
SIMAT.FRENTES = [
  { id: 'F-INC',  nombre: 'Frente de inclinado',         tipo: 'Desarrollo',  fan: 'VP-1', main: true, design: 320, ductLength: 600 },
  { id: 'F-N1O',  nombre: 'Frente Nivel 1 Oeste',        tipo: 'Desarrollo',  fan: 'VA-1', design: 300, ductLength: 280 },
  { id: 'F-N1E',  nombre: 'Frente Nivel 1 Este',         tipo: 'Desarrollo',  fan: 'VA-2', design: 300, ductLength: 280 },
  { id: 'F-N2O',  nombre: 'Frente Nivel 2 Oeste',        tipo: 'Desarrollo',  fan: 'VA-3', design: 300, ductLength: 280 },
  { id: 'F-N2E',  nombre: 'Frente Nivel 2 Este',         tipo: 'Desarrollo',  fan: 'VA-4', design: 300, ductLength: 280 }
];

// Cada trabajador lleva un detector multigás personal (CH₄ NDIR, O₂, CO, CO₂, H₂S)
SIMAT.WORKERS = [
  { id: 'DP-04', name: 'Operario 1',   cargo: 'Operario',     frente: 'F-INC',  node: 'N-8' },
  { id: 'DP-07', name: 'Operario 2',   cargo: 'Operario',     frente: 'F-INC',  node: 'N-8' },
  { id: 'DP-11', name: 'Ayudante 1',   cargo: 'Ayudante',     frente: 'F-INC',  node: 'N-7', slow: true },
  { id: 'DP-12', name: 'Operario 3',   cargo: 'Operario',     frente: 'F-N1O',  node: 'N-1' },
  { id: 'DP-13', name: 'Ayudante 2',   cargo: 'Ayudante',     frente: 'F-N1O',  node: 'N-1' },
  { id: 'DP-14', name: 'Operario 4',   cargo: 'Operario',     frente: 'F-N1E',  node: 'N-3' },
  { id: 'DP-15', name: 'Ayudante 3',   cargo: 'Ayudante',     frente: 'F-N1E',  node: 'N-3' },
  { id: 'DP-16', name: 'Operario 5',   cargo: 'Operario',     frente: 'F-N2O',  node: 'N-4' },
  { id: 'DP-17', name: 'Ayudante 4',   cargo: 'Ayudante',     frente: 'F-N2O',  node: 'N-4' },
  { id: 'DP-02', name: 'Operario 6',   cargo: 'Operario',     frente: 'F-N2E',  node: 'N-6' },
  { id: 'DP-05', name: 'Electricista', cargo: 'Electricista', frente: 'F-N2E',  node: 'N-6' }
];

// Nodos de malla inalámbrica: enlazan el detector de cada trabajador con la red de la mina
// path: saltos por radio desde el nodo hasta el concentrador del nivel, que entra a la fibra
SIMAT.NODES = [
  { id: 'N-1', x: 130, y: 287, zona: 'Nivel 1 Oeste',          path: ['N-2', 'C-N1'] },
  { id: 'N-2', x: 250, y: 287, zona: 'Nivel 1 Oeste · centro', path: ['C-N1'] },
  { id: 'N-3', x: 690, y: 287, zona: 'Nivel 1 Este',           path: ['C-N1'] },
  { id: 'N-4', x: 130, y: 507, zona: 'Nivel 2 Oeste',          path: ['C-N2'] },
  { id: 'N-5', x: 560, y: 507, zona: 'Nivel 2 Este',           path: ['C-N2'] },
  { id: 'N-6', x: 690, y: 507, zona: 'Nivel 2 Este · frente',  path: ['N-5', 'C-N2'] },
  { id: 'N-7', x: 420, y: 400, zona: 'Inclinado',              path: ['C-INC'] },
  { id: 'N-8', x: 420, y: 610, zona: 'Frente de inclinado',    path: ['N-7', 'C-INC'] }
];

// Concentradores: reciben la radio de los nodos y los sensores fijos, y los suben por la fibra
SIMAT.CONCENTRATORS = {
  'C-N1': 'Concentrador Nivel 1 (cruce con el inclinado)',
  'C-N2': 'Concentrador Nivel 2 (cruce con el inclinado)',
  'C-INC': 'Concentrador del inclinado'
};

// Dispositivos de aviso: se registran como cualquier equipo y reciben órdenes del sistema.
// conc: concentrador al que se conectan (salida de relé / Modbus). local: el módulo del frente la activa sin esperar a superficie.
SIMAT.DEVICES = [
  { id: 'B-F-INC', tipo: 'Baliza + sirena', zona: 'Frente de inclinado',  frente: 'F-INC', conc: 'C-INC', local: true },
  { id: 'B-F-N1O', tipo: 'Baliza + sirena', zona: 'Frente Nivel 1 Oeste', frente: 'F-N1O', conc: 'C-N1', local: true },
  { id: 'B-F-N1E', tipo: 'Baliza + sirena', zona: 'Frente Nivel 1 Este',  frente: 'F-N1E', conc: 'C-N1', local: true },
  { id: 'B-F-N2O', tipo: 'Baliza + sirena', zona: 'Frente Nivel 2 Oeste', frente: 'F-N2O', conc: 'C-N2', local: true },
  { id: 'B-F-N2E', tipo: 'Baliza + sirena', zona: 'Frente Nivel 2 Este',  frente: 'F-N2E', conc: 'C-N2', local: true },
  { id: 'L-INC', tipo: 'Luces de evacuación', zona: 'Inclinado principal',        conc: 'C-INC', evac: true },
  { id: 'L-N1',  tipo: 'Luces de evacuación', zona: 'Galería y cruce del Nivel 1', conc: 'C-N1', evac: true },
  { id: 'L-N2',  tipo: 'Luces de evacuación', zona: 'Galería y cruce del Nivel 2', conc: 'C-N2', evac: true },
  { id: 'S-BOC', tipo: 'Sirena de bocamina + aviso al malacatero', zona: 'Superficie · bocamina', conc: 'Servidor', surface: true }
];

// Patrón de cada nivel (igual para balizas y detectores)
SIMAT.PATTERNS = ['Apagada · verde fijo', 'Ámbar fijo · pitido lento', 'Naranja intermitente · sirena intermitente', 'Rojo intermitente · sirena continua'];
SIMAT.devPattern = function (d, lvl) {
  if (d.evac) return lvl >= 3 ? 'Encendidas · destello rojo en la ruta de salida' : 'Apagadas';
  if (d.surface) return lvl >= 3 ? 'Sirena continua en bocamina · malacatero y brigada avisados' : lvl >= 2 ? 'Aviso al malacatero (sin sirena exterior)' : 'En espera';
  return SIMAT.PATTERNS[lvl];
};

SIMAT.USERS = {
  supervisor:  { pass: '1234', role: 'supervisor',  name: 'Supervisor de turno' },
  ventilacion: { pass: '1234', role: 'ventilacion', name: 'Resp. de ventilación' },
  sst:         { pass: '1234', role: 'sst',         name: 'Jefe de mina / SST' },
  admin:       { pass: '1234', role: 'admin',       name: 'Administrador' },
  frente:      { pass: '1234', role: 'trabajador',  name: 'Trabajador del frente' }
};

SIMAT.ROLES = {
  supervisor: { label: 'Supervisor de turno', home: 'resumen', menu: [
    ['resumen', 'Resumen', 'home'], ['mapa', 'Mapa de la mina', 'map'], ['alertas', 'Alertas', 'alert'],
    ['personal', 'Personal bajo tierra', 'people'], ['registro', 'Registrar medición', 'pen'], ['historial', 'Historial', 'chart']
  ]},
  ventilacion: { label: 'Resp. de ventilación', home: 'ventilacion', menu: [
    ['ventilacion', 'Ventiladores y ductos', 'fan'], ['mapa', 'Mapa de la mina', 'map'], ['alertas', 'Alertas', 'alert'], ['historial', 'Historial', 'chart']
  ]},
  sst: { label: 'Jefe de mina / SST', home: 'sst', menu: [
    ['sst', 'Indicadores y reingreso', 'shield'], ['reportes', 'Reportes', 'report'], ['personal', 'Personal bajo tierra', 'people'],
    ['alertas', 'Bitácora de alertas', 'alert'], ['historial', 'Historial', 'chart']
  ]},
  admin: { label: 'Administrador', home: 'sensores', menu: [
    ['sensores', 'Sensores y equipos', 'sensor'], ['red', 'Red de comunicación', 'network'], ['config', 'Configuración', 'gear'], ['mapa', 'Mapa de la mina', 'map']
  ]},
  trabajador: { label: 'Trabajador del frente', home: 'frente', menu: [] }
};
