# Calculadora de finiquito y liquidación · Solestra

Herramienta de cálculo laboral y fiscal para México. Compara en una sola tabla el finiquito,
la rescisión y tres escenarios de liquidación, y determina el ISR a retener en cada uno.

Aplicación web estática: no tiene servidor, no envía datos a ningún lado y funciona sin conexión
una vez cargada. Todo lo que se captura vive en el navegador de quien la usa.

## Cómo se usa

Se capturan seis datos: sueldo mensual, promedio mensual de percepciones variables, fecha de
ingreso, fecha de baja, días de vacaciones adeudadas de años anteriores y días de salario
pendientes. El resto se deriva.

Los días devengados se calculan a partir de las fechas pero quedan editables, porque en la
práctica el adeudo de vacaciones sale del control interno y no de una fórmula.

## Fundamento

| Concepto | Fórmula | Base legal |
|---|---|---|
| Salario diario | Sueldo mensual ÷ 30 | Art. 89 LFT |
| Aguinaldo | Días × (días del año calendario ÷ 365) × salario diario | Art. 87 LFT |
| Vacaciones | Días del art. 76 × (días desde el aniversario ÷ 365) × salario diario | Arts. 76 y 79 LFT |
| Prima vacacional | 25% sobre el salario de los días de vacaciones | Art. 80 LFT |
| Prima de antigüedad | 12 días × años exactos × salario topado a 2 salarios mínimos | Art. 162 LFT |
| Indemnización | 90 días × salario diario o integrado | Arts. 48 y 50 fr. III LFT |
| Factor de integración | 1 + 15/365 + (días de vacaciones × 25%)/365 | Art. 84 LFT |

El ISR se determina en dos bloques que no se mezclan. Los ingresos ordinarios —aguinaldo,
vacaciones, prima vacacional y salarios devengados— se acumulan y se les aplica la tarifa mensual
del art. 96 LISR, restando antes las exenciones de 30 UMA de aguinaldo y 15 UMA de prima
vacacional del art. 93 fr. XIV. La prima de antigüedad y las indemnizaciones se gravan por
separado con la tasa efectiva del último sueldo mensual ordinario, conforme al art. 174 RLISR.
La exención de 90 UMA por año de servicio del art. 93 fr. XIII es opcional y viene desactivada.

## Actualización anual

Cada enero cambian la UMA, los salarios mínimos y, cuando la inflación acumulada rebasa el 10%,
la tarifa del art. 96. Todo eso vive en un solo archivo:

```
data/parametros.js
```

Se agrega un bloque nuevo con el ejercicio y aparece solo en el selector. No hay que tocar
el código de la aplicación. Después conviene subir `VERSION` en `sw.js` para que los navegadores
que ya la tengan en caché reciban la versión nueva.

## Estructura

```
index.html                 Estructura de la página
assets/app.css             Estilos, identidad Solestra, temas claro y oscuro, hoja de impresión
assets/app.js              Motor de cálculo, interfaz y guardado de casos
assets/cedula-pdf.js       Generación de la cédula membretada en PDF
assets/logo.png            Logotipo Solestra
assets/qr.png              Opcional: código QR del pie. Si no existe, el PDF lo omite
data/parametros.js         UMA, salarios mínimos y tarifas del art. 96 por ejercicio
vendor/                    jsPDF y jsPDF-AutoTable, incluidos para que funcione sin conexión
sw.js                      Service worker
manifest.webmanifest       Instalación como app en escritorio y móvil
```

## Publicación

El sitio es estático. Cualquier hosting sirve; la ruta recomendada es Cloudflare Pages
conectado al repositorio privado de GitHub, con la carpeta raíz del proyecto como directorio
de salida y sin comando de compilación.

## Nota

Es una herramienta de trabajo. No sustituye la revisión del expediente laboral ni el dictamen
del área fiscal. Los importes definitivos dependen de la fecha efectiva de pago, de las
prestaciones contractuales superiores a la ley y del criterio que se pacte en el convenio.

Uso interno de SOLESTRA CONSULTORES MX, S.C.
