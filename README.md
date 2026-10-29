# SIMAT · Sistema Inteligente de Monitoreo Atmosférico con Alerta Temprana

Prototipo para el monitoreo atmosférico de **frentes de desarrollo y preparación en minas subterráneas de carbón**.
Avisa **antes** de que el aire del frente sea peligroso, lleva el aviso hasta cada trabajador y confirma que llegó.

> **Todos los datos son SIMULADOS.** Los límites marcados como *demo* deben reemplazarse por los Valores Límite
> Permisibles del Decreto 1886 de 2015 (modificado por el Decreto 944 de 2022) validados por Ingeniería de Minas.
> El límite de metano de 1,0 % proviene de la Circular ANM 01 de 2022. Este prototipo no garantiza la seguridad de los trabajadores.

## Qué hace

- **Monitoreo en tiempo real:** llega una lectura por frente cada 2 s (CH₄, O₂, CO, CO₂, temperatura, caudal de salida y de llegada, estado del ventilador).
- **Motor de reglas:** 4 niveles (0 Normal · 1 Precaución · 2 Alerta · 3 Evacuación), persistencia e histéresis para evitar falsas alarmas.
- **Alerta temprana:** calcula la tendencia y el **tiempo estimado hasta el límite**.
- **Vigila la causa:** detecta un ventilador detenido o una pérdida de caudal fuera de la **curva de pérdida normal del ducto** (posible fuga) antes de que suba el gas. La curva (pérdida base + % por cada 100 m) se ajusta en *Configuración*.
- **Detectores personales:** cada trabajador lleva un detector multigás que transmite por radio al nodo más cercano → concentrador del nivel → fibra → servidor. Su ruta, frecuencia de envío y mensajes se ven en *Red de comunicación*.
- **Ciclo de cada alerta:** detectada → notificada → reconocida → en atención → remedición → cerrada, con **escalamiento** si nadie reconoce a tiempo.
- **Reingreso controlado:** tras una alerta de nivel 2 o una voladura, el frente queda *no apto* hasta tener lecturas normales seguidas, una remedición y la autorización del jefe de mina / SST.
- **Pantallas por rol:** supervisor, responsable de ventilación, jefe de mina / SST, administrador y pantalla del trabajador en el frente (baliza, sirena, botón "Recibido").
- **Mapa vivo**, registro manual de mediciones, historial con gráficas, reportes imprimibles y exportación CSV.
- **Funciona sin internet** (service worker). Los datos quedan en el navegador.

## Cuentas de demostración

Contraseña de todas: `1234`. El rol lo define la cuenta: cada usuario entra directo a su panel.

| Usuario | Rol |
|---|---|
| `supervisor` | Supervisor de turno |
| `ventilacion` | Responsable de ventilación |
| `sst` | Jefe de mina / SST |
| `admin` | Administrador del sistema |
| `frente` | Pantalla del trabajador en el frente |

## Guion sugerido para la demostración (≈ 2 min)

1. Ingrese como `supervisor`. En **Modo demostración** elija `F-INC` y pulse **Romper ducto**.
2. En segundos aparece la **alerta temprana nivel 1**: el caudal cae un 34 % y el sistema estima el tiempo hasta el límite de metano.
3. Pulse **Reconocer**. Si no lo hace, la alerta **escala** al jefe de mina.
4. Pulse **Cortar fibra**: los datos siguen llegando por el tramo B (vea *Red de comunicación* como `admin`).
5. Ingrese como `frente` para ver la baliza y confirmar el aviso con **Recibido**.
6. Pulse **Alarma detector personal** y vea como `admin` (*Red de comunicación*) la ruta del mensaje desde el detector hasta superficie.
7. Pulse **Voladura** en `F-N2E` e ingrese como `sst` para ver el bloqueo y la autorización de reingreso.
8. **Restablecer** devuelve todo a condiciones normales.

## Publicar en GitHub Pages

1. Cree un repositorio nuevo en GitHub (por ejemplo `simat`).
2. Suba **todo el contenido de esta carpeta** a la raíz del repositorio (incluido el archivo `.nojekyll`):
   ```bash
   git init
   git add .
   git commit -m "SIMAT: prototipo de monitoreo atmosférico"
   git branch -M main
   git remote add origin https://github.com/USUARIO/simat.git
   git push -u origin main
   ```
   También puede usar **Add file → Upload files** en la web de GitHub y arrastrar los archivos.
3. En el repositorio: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, rama `main`, carpeta `/ (root)` → **Save**.
4. En uno o dos minutos la app queda en `https://USUARIO.github.io/simat/`.

### Probar en su computador

Abra `index.html` directamente en el navegador, o sirva la carpeta:

```bash
python -m http.server 8000
# luego abra http://localhost:8000
```

## Estructura

```
index.html            Página principal
css/styles.css        Estilo "Carbón y amarillo seguridad"
js/config.js          Límites, frentes, trabajadores, usuarios y roles (editar aquí)
js/state.js           Estado y almacenamiento local
js/sim.js             Simulador de sensores (en una mina real se reemplaza por la capa de integración)
js/rules.js           Motor de reglas, alerta temprana, escalamiento y reingreso
js/charts.js          Gráficos SVG propios (sin librerías)
js/views.js           Pantallas por rol
js/app.js             Sesión, navegación, ciclo en tiempo real y acciones
sw.js                 Funcionamiento sin internet
```

## Del prototipo a una mina real

- `js/sim.js` se reemplaza por una **capa de integración** que lee los sensores por **Modbus RS-485**, **4–20 mA** o radio y entrega a la app el mismo formato: *frente, variable, valor, unidad, hora, sensor*.
- El servidor local en superficie (por ejemplo, con Django o Node) recibe los datos por **fibra armada en anillo** y **malla inalámbrica** de respaldo, y los publica a las pantallas en la red local de la mina, sin internet.
- Todo equipo instalado en el frente debe estar certificado para atmósferas con grisú.
