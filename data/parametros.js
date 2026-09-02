/* Parámetros fiscales y laborales por ejercicio.
   Para actualizar en enero solo se agrega un bloque nuevo aquí: nadie toca el código de la app.
   - uma        : UMA diaria vigente a partir del 1 de febrero del ejercicio (INEGI).
   - smGeneral  : salario mínimo general diario, resto del país (CONASAMI).
   - smFrontera : salario mínimo general diario, Zona Libre de la Frontera Norte.
   - tarifa     : tarifa mensual del art. 96 LISR, Anexo 8 de la RMF del ejercicio.
                  [límite inferior, límite superior, cuota fija, % sobre excedente]
   La tarifa se actualiza cuando la inflación acumulada desde la última actualización
   rebasa el 10% (art. 152, último párrafo, LISR); por eso 2024 y 2025 comparten tarifa. */

const TARIFA_2024_2025 = [
  [    0.01,     746.04,      0.00, 0.0192],
  [  746.05,    6332.05,     14.32, 0.0640],
  [ 6332.06,   11128.01,    371.83, 0.1088],
  [11128.02,   12935.82,    893.63, 0.1600],
  [12935.83,   15487.71,   1182.88, 0.1792],
  [15487.72,   31236.49,   1640.18, 0.2136],
  [31236.50,   49233.00,   5004.12, 0.2352],
  [49233.01,   93993.90,   9236.89, 0.3000],
  [93993.91,  125325.20,  22665.17, 0.3200],
  [125325.21, 375975.61,  32691.18, 0.3400],
  [375975.62,  Infinity, 117912.32, 0.3500]
];

const TARIFA_2026 = [
  [     0.01,     844.59,      0.00, 0.0192],
  [   844.60,    7168.51,     16.22, 0.0640],
  [  7168.52,   12598.02,    420.95, 0.1088],
  [ 12598.03,   14644.64,   1011.68, 0.1600],
  [ 14644.65,   17533.64,   1339.14, 0.1792],
  [ 17533.65,   35362.83,   1856.84, 0.2136],
  [ 35362.84,   55736.68,   5665.16, 0.2352],
  [ 55736.69,  106410.50,  10457.09, 0.3000],
  [106410.51,  141880.66,  25659.23, 0.3200],
  [141880.67,  425641.99,  37009.69, 0.3400],
  [425642.00,   Infinity, 133488.54, 0.3500]
];

window.PARAMETROS = {
  2024: { uma: 108.57, smGeneral: 248.93, smFrontera: 374.89, tarifa: TARIFA_2024_2025 },
  2025: { uma: 113.14, smGeneral: 278.80, smFrontera: 419.88, tarifa: TARIFA_2024_2025 },
  2026: { uma: 117.31, smGeneral: 315.04, smFrontera: 440.87, tarifa: TARIFA_2026 }
};

window.EJERCICIO_POR_OMISION = 2026;
