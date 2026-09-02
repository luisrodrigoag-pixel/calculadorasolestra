"use strict";

/* ======================= PARÁMETROS ======================= */
/* Vienen de data/parametros.js. Para agregar un ejercicio basta editar ese archivo. */
const PARAMS = window.PARAMETROS;
const EJERCICIOS = Object.keys(PARAMS).map(Number).sort();
const salarioMinimo = P => S.zona === "frontera" ? P.smFrontera : P.smGeneral;

/* ======================= ESTADO ======================= */
const S = {
  ejercicio: window.EJERCICIO_POR_OMISION || 2026, zona:"general",
  sueldo:16652, variable:0,
  ingreso:"2006-08-24", baja:"2026-08-26",
  dAguinaldo:9.780822, dVacProp:0.153425, dVacAdeudo:26, dSalarios:0,
  aniosPrima:20.019178, pctPrima:25,
  gratA:45, gratB:60, gratC:90,
  baseIndem:"sd", primaRenuncia:false,
  juicio:false, dias20:true, mesesCaidos:3,
  mesOrdinario:16883.28, exencion:false, gratSep:false, otras:0,
  idTrabajador:"", idPatron:"", idExpediente:"",
  sel:0
};
const CASO_2025 = {
  ejercicio:2025, zona:"general", sueldo:16652, variable:0,
  ingreso:"2005-08-24", baja:"2025-08-26",
  dAguinaldo:9.780822, dVacProp:0.61, dVacAdeudo:26, dSalarios:0,
  aniosPrima:20.019178, pctPrima:25, gratA:45, gratB:60, gratC:90,
  baseIndem:"sd", primaRenuncia:false, juicio:false, dias20:true, mesesCaidos:3,
  mesOrdinario:16883.28, exencion:false, gratSep:false, otras:0
};

/* ======================= UTILIDADES ======================= */
const mxn = n => (isFinite(n)?n:0).toLocaleString("es-MX",{style:"currency",currency:"MXN",minimumFractionDigits:2,maximumFractionDigits:2});
const plain = n => (isFinite(n)?n:0).toLocaleString("es-MX",{minimumFractionDigits:2,maximumFractionDigits:2});
const dec = (n,d) => (isFinite(n)?n:0).toLocaleString("es-MX",{minimumFractionDigits:d,maximumFractionDigits:d});
const $ = id => document.getElementById(id);

function isr(base, tarifa){
  if(base <= 0) return 0;
  for(const [li,ls,cf,t] of tarifa){ if(base <= ls) return cf + (base - li) * t; }
  return 0;
}
function diasVacaciones(a){
  if(a < 1) return 12;
  if(a <= 5) return 10 + 2*Math.floor(a);
  return 20 + 2*Math.floor((Math.floor(a) - 1)/5);
}
function parseISO(s){ const p = String(s).split("-"); return new Date(+p[0], (+p[1]||1)-1, +p[2]||1); }
const DIA = 86400000;

/* ======================= MOTOR ======================= */
function calcular(){
  const P = PARAMS[S.ejercicio];
  const sd  = (Number(S.sueldo) + Number(S.variable)) / 30;
  const anios = Number(S.aniosPrima) || 0;
  const dv = diasVacaciones(anios);
  const factor = 1 + 15/365 + (dv * (S.pctPrima/100))/365;
  const sdi = sd * factor;
  const topePrima = 2 * salarioMinimo(P);
  const sdPrima = Math.min(sd, topePrima);
  const baseIndem = S.baseIndem === "sdi" ? sdi : sd;

  // --- conceptos devengados (finiquito) ---
  const c = {};
  c.salarios   = S.dSalarios   * sd;
  c.aguinaldo  = S.dAguinaldo  * sd;
  c.vacProp    = S.dVacProp    * sd;
  c.primaProp  = c.vacProp * (S.pctPrima/100);
  c.vacAdeudo  = S.dVacAdeudo  * sd;
  c.primaAdeudo= c.vacAdeudo * (S.pctPrima/100);
  const finiquitoBase = c.salarios + c.aguinaldo + c.vacProp + c.primaProp + c.vacAdeudo + c.primaAdeudo;

  const primaAnt = 12 * anios * sdPrima;
  const caidos   = S.juicio ? Math.min(S.mesesCaidos,12) * 30 * baseIndem : 0;
  const veinte   = (S.juicio && S.dias20) ? 20 * anios * baseIndem : 0;

  // --- ISR ---
  const exAguinaldo = 30 * P.uma, exPrimaVac = 15 * P.uma;
  const gravAgui = Math.max(0, c.aguinaldo - exAguinaldo);
  const gravPV   = Math.max(0, (c.primaProp + c.primaAdeudo) - exPrimaVac);
  const gravVac  = c.vacProp + c.vacAdeudo;
  const baseOrdFiniquito = gravAgui + gravPV + gravVac + c.salarios;

  const aniosEx = Math.max(1, Math.floor(anios) + (anios % 1 > 0.5 ? 1 : 0));
  const exSeparacion = S.exencion ? 90 * P.uma * aniosEx : 0;
  const mesOrd = Number(S.mesOrdinario) || sd * 365/12;
  const tasa174 = mesOrd > 0 ? Math.round((isr(mesOrd, P.tarifa)/mesOrd) * 10000)/10000 : 0;

  function armar(nombre, opts){
    const grat  = opts.grat  || 0;
    const indem = opts.indem || 0;
    const prima = opts.prima ? primaAnt : 0;
    const v20   = opts.juicio ? veinte : 0;
    const vCai  = opts.juicio ? caidos : 0;

    const subtotal = finiquitoBase + grat + prima + indem + v20 + vCai;

    // clasificación fiscal
    const gratComoSeparacion = S.gratSep;
    const baseOrd = baseOrdFiniquito + (gratComoSeparacion ? 0 : grat) + vCai;
    const brutoSep = prima + indem + v20 + (gratComoSeparacion ? grat : 0);
    const exAplicada = Math.min(exSeparacion, brutoSep);
    const baseSep = Math.max(0, brutoSep - exAplicada);

    const isrOrd = isr(baseOrd, P.tarifa);
    const isrSep = baseSep * tasa174;
    const isrTot = isrOrd + isrSep;

    const otras = Math.max(0, Number(S.otras) || 0);
    return {nombre, otras, salarios:c.salarios, aguinaldo:c.aguinaldo, vacProp:c.vacProp, primaProp:c.primaProp,
      vacAdeudo:c.vacAdeudo, primaAdeudo:c.primaAdeudo, grat, prima, indem, v20, vCai,
      subtotal, baseOrd, brutoSep, exAplicada, baseSep, isrOrd, isrSep, isrTot, neto:subtotal - isrTot - otras};
  }

  const filas = [
    armar("Finiquito", {prima:S.primaRenuncia}),
    armar("Rescisión", {prima:true}),
    armar("Liquidación " + S.gratA + " días", {grat:S.gratA*baseIndem, prima:true}),
    armar("Liquidación " + S.gratB + " días", {grat:S.gratB*baseIndem, prima:true}),
    armar("Liquidación " + S.gratC + " días", {indem:S.gratC*baseIndem, prima:true})
  ];
  if(S.juicio) filas.push(armar("Condena en juicio", {indem:S.gratC*baseIndem, prima:true, juicio:true}));

  return {P, sd, sdi, factor, dv, dvCurso: diasVacaciones(anios + (anios>=1?1:0)), anios, topePrima, sdPrima, baseIndem, tasa174, mesOrd,
    exAguinaldo, exPrimaVac, exSeparacion, aniosEx, filas,
    antiguedadDias: Math.round(anios*365)};
}

/* ======================= RENDER ======================= */
const COLS = [
  {k:"salarios",   t:"Salarios pendientes", opt:true},
  {k:"aguinaldo",  t:"Aguinaldo"},
  {k:"vacProp",    t:"Vacaciones"},
  {k:"primaProp",  t:"Prima vacacional"},
  {k:"vacAdeudo",  t:"Adeudo vacaciones"},
  {k:"primaAdeudo",t:"Adeudo prima vacacional"},
  {k:"grat",       t:"Gratificación"},
  {k:"prima",      t:"Prima de antigüedad"},
  {k:"indem",      t:"Indemnización"},
  {k:"v20",        t:"20 días por año", opt:true},
  {k:"vCai",       t:"Salarios caídos", opt:true}
];

function render(){
  const R = calcular();
  const P = R.P;

  // parámetros
  $("paramstrip").innerHTML =
    `<span class="chip">Ejercicio <b>${S.ejercicio}</b></span>` +
    `<span class="chip">UMA <b>${mxn(P.uma)}</b></span>` +
    `<span class="chip">Salario mínimo <b>${mxn(salarioMinimo(P))}</b></span>` +
    `<span class="chip">Tarifa <b>art. 96 LISR</b></span>`;

  // bases
  const years = Math.floor(R.anios), months = Math.round((R.anios - years)*12);
  $("bases").innerHTML = [
    ["Antigüedad", dec(R.anios,2)+" años", years+" años "+months+" meses"],
    ["Salario diario", mxn(R.sd), "Sueldo ÷ 30"],
    ["Salario diario integrado", mxn(R.sdi), "Factor "+dec(R.factor,4)],
    ["Vacaciones · aniversario", R.dv+" días", "Año en curso: "+R.dvCurso+" días (art. 76)"],
    ["Tope prima antigüedad", mxn(R.topePrima), R.sd > R.topePrima ? "Aplica: se topa a "+mxn(R.sdPrima) : "No aplica"],
    ["Tasa art. 174 RLISR", dec(R.tasa174*100,2)+"%", "Sobre "+mxn(R.mesOrd)]
  ].map(([a,b,cc])=>`<div class="base"><dt>${a}</dt><dd>${b}</dd><span class="foot">${cc}</span></div>`).join("");

  // columnas visibles
  const cols = COLS.filter(col => !col.opt || R.filas.some(f => Math.abs(f[col.k]) > 0.005));
  const ded = Math.max(0, Number(S.otras) || 0), showDed = ded > 0.005;
  $("thr").innerHTML = `<th>Concepto</th>` + cols.map(c=>`<th>${c.t}</th>`).join("") +
    `<th class="pin sub-col">Subtotal</th><th class="pin isr-col">ISR</th>` +
    (showDed ? `<th class="pin ded-col">Otras deducciones</th>` : "") +
    `<th class="pin tot-col">Total</th>`;

  const alerta = R.anios >= 15 && !S.primaRenuncia;
  $("tbody").innerHTML = R.filas.map((f,i)=>{
    const cells = cols.map(c=>{
      const v = f[c.k];
      return `<td class="${Math.abs(v)<0.005?"zero":""}">${Math.abs(v)<0.005?"–":plain(v)}</td>`;
    }).join("");
    const tag = (i===0 && alerta) ? `<span class="rowtag">Revisar art. 162 fr. III</span>` : "";
    return `<tr data-i="${i}" aria-selected="${i===S.sel}"><td>${f.nombre}${tag}</td>${cells}` +
      `<td class="pin sub-col">${plain(f.subtotal)}</td>` +
      `<td class="pin isr-col">${plain(f.isrTot)}</td>` +
      (showDed ? `<td class="pin ded-col">${plain(ded)}</td>` : "") +
      `<td class="pin tot-col">${plain(f.neto)}</td></tr>`;
  }).join("");

  const ident = [["Trabajador", S.idTrabajador], ["Patrón", S.idPatron], ["Expediente", S.idExpediente]]
    .filter(([,v]) => v && v.trim());
  const cl = $("caseline");
  cl.hidden = ident.length === 0;
  cl.innerHTML = ident.map(([k,v]) => `<span><b>${k}</b>${v.replace(/[<>]/g,"")}</span>`).join("");

  $("tableSubtitle").textContent =
    `Importes en pesos. Base de indemnizaciones: ${S.baseIndem==="sdi"?"salario diario integrado":"salario diario"}` +
    ` · ${S.exencion?"con":"sin"} exención del art. 93 fr. XIII.`;

  // aviso art. 162
  $("flagbox").innerHTML = alerta ? `<div class="flag"><h3>Verificación</h3><p>El trabajador acumula
    <b>${dec(R.anios,2)} años</b> de servicio. Con 15 años o más, la prima de antigüedad se paga también cuando la separación
    es voluntaria (art. 162 fr. III LFT), de modo que el finiquito por renuncia tendría que incluir
    <b>${mxn(12*R.anios*R.sdPrima)}</b> adicionales. Actívalo en «Escenarios de negociación» si es el caso.</p></div>` : "";

  // desglose
  const f = R.filas[S.sel] || R.filas[0];
  $("desgloseTitulo").textContent = "Desglose · " + f.nombre;
  const li = (lb,sub,val,cls="") =>
    `<div class="li ${cls}"><span class="lb">${lb}${sub?`<small>${sub}</small>`:""}</span><span class="vl">${val}</span></div>`;

  const perc = [];
  if(f.salarios>0.005) perc.push(li("Salarios pendientes", dec(S.dSalarios,2)+" días × "+mxn(R.sd), mxn(f.salarios)));
  perc.push(li("Aguinaldo proporcional", dec(S.dAguinaldo,4)+" días × "+mxn(R.sd), mxn(f.aguinaldo)));
  perc.push(li("Vacaciones proporcionales", dec(S.dVacProp,4)+" días × "+mxn(R.sd), mxn(f.vacProp)));
  perc.push(li("Prima vacacional", S.pctPrima+"% sobre vacaciones proporcionales", mxn(f.primaProp)));
  perc.push(li("Adeudo de vacaciones", dec(S.dVacAdeudo,2)+" días × "+mxn(R.sd), mxn(f.vacAdeudo)));
  perc.push(li("Adeudo de prima vacacional", S.pctPrima+"% sobre el adeudo", mxn(f.primaAdeudo)));
  if(f.grat>0.005)  perc.push(li("Gratificación", plain(f.grat/R.baseIndem)+" días × "+mxn(R.baseIndem), mxn(f.grat)));
  if(f.prima>0.005) perc.push(li("Prima de antigüedad", "12 días × "+dec(R.anios,4)+" años × "+mxn(R.sdPrima), mxn(f.prima)));
  if(f.indem>0.005) perc.push(li("Indemnización constitucional", plain(f.indem/R.baseIndem)+" días × "+mxn(R.baseIndem), mxn(f.indem)));
  if(f.v20>0.005)   perc.push(li("20 días por año", "20 × "+dec(R.anios,4)+" años × "+mxn(R.baseIndem), mxn(f.v20)));
  if(f.vCai>0.005)  perc.push(li("Salarios caídos", Math.min(S.mesesCaidos,12)+" meses × 30 × "+mxn(R.baseIndem), mxn(f.vCai)));
  perc.push(li("Subtotal bruto","",mxn(f.subtotal),"total"));
  $("ledgerPerc").innerHTML = perc.join("");

  const fis = [];
  fis.push(li("Base gravable ordinaria", "Art. 96 LISR, ya descontadas las exenciones", mxn(f.baseOrd)));
  fis.push(li("Exención de aguinaldo", "30 UMA = "+mxn(R.exAguinaldo), "−"+mxn(Math.min(R.exAguinaldo, f.aguinaldo)),"minus"));
  fis.push(li("Exención de prima vacacional", "15 UMA = "+mxn(R.exPrimaVac), "−"+mxn(Math.min(R.exPrimaVac, f.primaProp+f.primaAdeudo)),"minus"));
  fis.push(li("ISR sobre ingresos ordinarios", "Tarifa mensual "+S.ejercicio, mxn(f.isrOrd)));
  if(f.brutoSep>0.005){
    fis.push(li("Ingresos por separación", "Prima de antigüedad e indemnizaciones", mxn(f.brutoSep)));
    if(S.exencion) fis.push(li("Exención por separación","90 UMA × "+R.aniosEx+" años de servicio","−"+mxn(f.exAplicada),"minus"));
    fis.push(li("Base gravable por separación","",mxn(f.baseSep)));
    fis.push(li("ISR por separación", "Tasa "+dec(R.tasa174*100,2)+"% (art. 174 RLISR)", mxn(f.isrSep)));
  }
  fis.push(li("ISR total a retener","",mxn(f.isrTot),"total minus"));
  if(f.otras > 0.005) fis.push(li("Otras deducciones","Infonavit, Fonacot, préstamos o faltantes","−"+mxn(f.otras),"minus"));
  $("ledgerIsr").innerHTML = fis.join("");
  $("netLabel").textContent = "Neto a pagar · " + f.nombre;
  $("netValue").textContent = mxn(f.neto);

  $("notasFiscales").innerHTML = [
    `<li><b>Ingresos ordinarios.</b> Aguinaldo, vacaciones, prima vacacional y salarios devengados se acumulan y se gravan con la tarifa mensual del art. 96 LISR del ejercicio ${S.ejercicio}.</li>`,
    `<li><b>Exenciones.</b> 30 UMA de aguinaldo y 15 UMA de prima vacacional (art. 93 fr. XIV LISR): ${mxn(R.exAguinaldo)} y ${mxn(R.exPrimaVac)}. Las vacaciones se gravan en su totalidad.</li>`,
    `<li><b>Ingresos por separación.</b> Prima de antigüedad e indemnizaciones se gravan con la tasa efectiva del último sueldo mensual ordinario: <code>${dec(R.tasa174*100,2)}%</code> (art. 174 RLISR).</li>`,
    S.exencion
      ? `<li><b>Exención por separación activada.</b> 90 UMA por cada año de servicio: ${mxn(R.exSeparacion)} (art. 93 fr. XIII LISR; la fracción mayor a seis meses cuenta como año completo).</li>`
      : `<li><b>Exención por separación desactivada.</b> Se grava el 100% de la prima de antigüedad y de las indemnizaciones. Activarla exentaría hasta ${mxn(90*P.uma*R.aniosEx)}.</li>`,
    `<li><b>Gratificación.</b> Se está gravando como ${S.gratSep?"ingreso por separación (tasa del art. 174)":"ingreso ordinario (tarifa del art. 96)"}.</li>`,
    `<li><b>No incluye</b> subsidio para el empleo, cuotas obrero-patronales ni retenciones locales.</li>`
  ].join("");

  $("disclaimer").innerHTML =
    `Cálculo estimativo conforme a la Ley Federal del Trabajo y a la Ley del Impuesto sobre la Renta vigentes en ${S.ejercicio}. ` +
    `Valores del ejercicio: UMA diaria ${mxn(P.uma)}, salario mínimo ${mxn(salarioMinimo(P))} (${S.zona==="general"?"resto del país":"Zona Libre de la Frontera Norte"}). ` +
    `Los importes definitivos dependen de la fecha efectiva de pago, de las prestaciones contractuales por encima de la ley y del criterio que se pacte en el convenio. ` +
    `No sustituye la revisión del expediente laboral ni el dictamen del área fiscal.`;

  const tbl = $("tabla"), pins = [...$("thr").querySelectorAll("th.pin")];
  let acc = 0;
  for(let i = pins.length - 1; i >= 0; i--){
    const key = [...pins[i].classList].find(k => k.endsWith("-col"));
    tbl.style.setProperty("--r-" + key, acc + "px");
    acc += pins[i].offsetWidth;
  }

  window.__tabla = {cols, R};
  window.__ultimo = R;
}

/* ======================= EVENTOS ======================= */
function bindNumber(id, key, after){
  const el = $(id);
  el.value = S[key];
  el.addEventListener("input", () => {
    const v = parseFloat(el.value);
    S[key] = isFinite(v) ? v : 0;
    if(after) after();
    render();
  });
}
function poblarEjercicios(){
  $("ejercicio").innerHTML = EJERCICIOS.map(a => `<option value="${a}">${a}</option>`).join("");
  $("ejercicio").value = S.ejercicio;
}
function bindSeg(id, key, after){
  const box = $(id);
  box.addEventListener("click", e => {
    const b = e.target.closest("button"); if(!b) return;
    S[key] = isNaN(b.dataset.v) ? b.dataset.v : Number(b.dataset.v);
    syncSeg(id, key); if(after) after(); render();
  });
  syncSeg(id, key);
}
function syncSeg(id, key){
  [...$(id).querySelectorAll("button")].forEach(b =>
    b.setAttribute("aria-pressed", String(b.dataset.v == S[key])));
}
function bindCheck(id, key, after){
  const el = $(id); el.checked = S[key];
  el.addEventListener("change", () => { S[key] = el.checked; if(after) after(); render(); });
}

function recalcDesdeFechas(){
  const ing = parseISO(S.ingreso), baj = parseISO(S.baja);
  if(!(baj > ing)) return;
  const antig = Math.round((baj - ing)/DIA);
  const anios = antig/365;
  const inicioAnio = new Date(baj.getFullYear(),0,1);
  const ref = ing > inicioAnio ? ing : inicioAnio;
  const diasAnio = Math.round((baj - ref)/DIA) + 1;
  let ann = new Date(baj.getFullYear(), ing.getMonth(), ing.getDate());
  if(ann > baj) ann = new Date(baj.getFullYear()-1, ing.getMonth(), ing.getDate());
  const desdeAniv = Math.round((baj - ann)/DIA);
  const dv = diasVacaciones(anios + (anios >= 1 ? 1 : 0));

  S.aniosPrima  = Math.round(anios*1e6)/1e6;
  S.dAguinaldo  = Math.round((15 * diasAnio/365)*1e6)/1e6;
  S.dVacProp    = Math.round((dv * desdeAniv/365)*1e6)/1e6;
  S.mesOrdinario= Math.round(((Number(S.sueldo)+Number(S.variable))/30 * 365/12)*100)/100;
  ["aniosPrima","dAguinaldo","dVacProp","mesOrdinario"].forEach(k => $(k).value = S[k]);
}
function cargarEstado(){
  ["sueldo","variable","ingreso","baja","dAguinaldo","dVacProp","dVacAdeudo","dSalarios",
   "aniosPrima","pctPrima","gratA","gratB","gratC","mesesCaidos","mesOrdinario","otras",
   "idTrabajador","idPatron","idExpediente"]
    .forEach(k => { if($(k)) $(k).value = S[k]; });
  syncSeg("segBase","baseIndem");
  $("ejercicio").value = S.ejercicio;
  $("chkPrimaRenuncia").checked = S.primaRenuncia;
  $("chkJuicio").checked = S.juicio;
  $("chk20").checked = S.dias20;
  $("chkExencion").checked = S.exencion;
  $("chkGratSep").checked = S.gratSep;
  $("zona").value = S.zona;
  $("juicioBox").hidden = !S.juicio;
}

function syncMesOrdinario(){
  S.mesOrdinario = Math.round(((Number(S.sueldo) + Number(S.variable))/30 * 365/12) * 100)/100;
  $("mesOrdinario").value = S.mesOrdinario;
}
["sueldo","variable"].forEach(k => bindNumber(k, k, syncMesOrdinario));
["dAguinaldo","dVacProp","dVacAdeudo","dSalarios","aniosPrima","pctPrima",
 "gratA","gratB","gratC","mesesCaidos","mesOrdinario","otras"].forEach(k => bindNumber(k,k));
[["idTrabajador","idTrabajador"],["idPatron","idPatron"],["idExpediente","idExpediente"]]
  .forEach(([id,key]) => $(id).addEventListener("input", () => { S[key] = $(id).value; render(); }));
["ingreso","baja"].forEach(k => $(k).addEventListener("change", () => { S[k] = $(k).value; recalcDesdeFechas(); render(); }));
$("zona").addEventListener("change", () => { S.zona = $("zona").value; render(); });
$("ejercicio").addEventListener("change", () => { S.ejercicio = Number($("ejercicio").value); render(); });
bindSeg("segBase","baseIndem");
bindCheck("chkPrimaRenuncia","primaRenuncia");
bindCheck("chkJuicio","juicio", () => { $("juicioBox").hidden = !S.juicio; if(!S.juicio && S.sel>4) S.sel = 4; });
bindCheck("chk20","dias20");
bindCheck("chkExencion","exencion");
bindCheck("chkGratSep","gratSep");
$("btnRecalc").addEventListener("click", () => { recalcDesdeFechas(); render(); });
$("btnCaso").addEventListener("click", () => { Object.assign(S, CASO_2025); S.sel = 0; cargarEstado(); render(); });
$("btnPrint").addEventListener("click", async () => {
  try{
    await generarCedulaPDF(calcular(), S);
    aviso("Cédula descargada");
  }catch(err){
    console.error(err);
    aviso("No se pudo generar el PDF");
  }
});
$("btnImprimir").addEventListener("click", () => window.print());
$("tbody").addEventListener("click", e => {
  const tr = e.target.closest("tr"); if(!tr) return;
  S.sel = Number(tr.dataset.i); render();
});
$("btnCopy").addEventListener("click", async () => {
  const {cols, R} = window.__tabla;
  const ded = Math.max(0, Number(S.otras) || 0), showDed = ded > 0.005;
  const meta = [];
  if(S.idTrabajador) meta.push("Trabajador:\t" + S.idTrabajador);
  if(S.idPatron) meta.push("Patrón:\t" + S.idPatron);
  if(S.idExpediente) meta.push("Expediente:\t" + S.idExpediente);
  meta.push("Ejercicio:\t" + S.ejercicio, "");
  const head = ["Concepto", ...cols.map(c=>c.t), "Subtotal","ISR",
    ...(showDed?["Otras deducciones"]:[]), "Total"].join("\t");
  const body = R.filas.map(f => [f.nombre, ...cols.map(c=>f[c.k].toFixed(2)),
    f.subtotal.toFixed(2), f.isrTot.toFixed(2),
    ...(showDed?[ded.toFixed(2)]:[]), f.neto.toFixed(2)].join("\t"));
  const esc = v => String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const FF = "font-family:'Courier New',monospace;font-size:10.5pt;";
  const TH = FF + "background:#20204A;color:#FFFFFF;padding:4pt 5pt;text-align:right;font-weight:bold;";
  const TD = FF + "padding:3pt 5pt;text-align:right;border-bottom:0.5pt solid #C8D0D7;";
  const headCells = ["Concepto", ...cols.map(c=>c.t), "Subtotal", "ISR",
    ...(showDed?["Otras deducciones"]:[]), "Total"];
  const html =
    `<div style="${FF}">` +
    meta.filter(Boolean).map(l => `<div>${esc(l.replace("\t"," "))}</div>`).join("") +
    `<table style="border-collapse:collapse;margin-top:6pt">` +
    `<tr>` + headCells.map((h,i)=>`<th style="${TH}${i?"":"text-align:left;"}">${esc(h)}</th>`).join("") + `</tr>` +
    R.filas.map(f => {
      const vals = [...cols.map(c=>f[c.k]), f.subtotal, f.isrTot,
        ...(showDed?[ded]:[]), f.neto];
      return `<tr><td style="${TD}text-align:left;">${esc(f.nombre)}</td>` +
        vals.map((v,i)=>`<td style="${TD}${i>=vals.length-1?"font-weight:bold;":""}">` +
          `${Math.abs(v)<0.005?"–":plain(v)}</td>`).join("") + `</tr>`;
    }).join("") +
    `</table></div>`;
  const plainText = [...meta, head, ...body].join("\n");
  const t = $("toast");
  const ok = () => { t.textContent = "Tabla copiada"; t.classList.add("on"); setTimeout(()=>t.classList.remove("on"), 1800); };
  const fail = () => { t.textContent = "No se pudo copiar"; t.classList.add("on");
    setTimeout(()=>{t.classList.remove("on"); t.textContent="Tabla copiada";}, 2200); };
  try{
    if(window.ClipboardItem && navigator.clipboard.write){
      await navigator.clipboard.write([new ClipboardItem({
        "text/plain": new Blob([plainText], {type:"text/plain"}),
        "text/html":  new Blob([html], {type:"text/html"})
      })]);
    } else {
      await navigator.clipboard.writeText(plainText);
    }
    ok();
  }catch(err){
    try{ await navigator.clipboard.writeText(plainText); ok(); }catch(e2){ fail(); }
  }
});

/* ======================= AVISOS ======================= */
function aviso(txt, ms){
  const t = $("toast");
  t.textContent = txt; t.classList.add("on");
  clearTimeout(aviso._h);
  aviso._h = setTimeout(() => t.classList.remove("on"), ms || 2200);
}

/* ======================= CASOS GUARDADOS ======================= */
const LLAVE_CASOS = "solestra.finiquito.casos";
const LLAVE_BORRADOR = "solestra.finiquito.borrador";

function leerCasos(){
  try{ return JSON.parse(localStorage.getItem(LLAVE_CASOS) || "[]"); }
  catch(e){ return []; }
}
function escribirCasos(lista){
  try{ localStorage.setItem(LLAVE_CASOS, JSON.stringify(lista.slice(0, 40))); return true; }
  catch(e){ return false; }
}
function guardarBorrador(){
  try{ localStorage.setItem(LLAVE_BORRADOR, JSON.stringify(S)); }catch(e){}
}
function restaurarBorrador(){
  try{
    const b = JSON.parse(localStorage.getItem(LLAVE_BORRADOR) || "null");
    if(b && typeof b === "object"){ Object.assign(S, b); return true; }
  }catch(e){}
  return false;
}
function nombreCaso(){
  return (S.idTrabajador || S.idExpediente || S.idPatron || "Caso sin identificar").trim().slice(0, 60);
}
function guardarCaso(){
  const R = calcular();
  const lista = leerCasos();
  const caso = {
    id: Date.now(),
    nombre: nombreCaso(),
    fecha: new Date().toISOString(),
    neto: R.filas[Math.min(S.sel, R.filas.length - 1)].neto,
    escenario: R.filas[Math.min(S.sel, R.filas.length - 1)].nombre,
    estado: JSON.parse(JSON.stringify(S))
  };
  lista.unshift(caso);
  if(escribirCasos(lista)){ pintarCasos(); aviso("Caso guardado"); }
  else aviso("El navegador no permitió guardar");
}
function abrirCaso(id){
  const c = leerCasos().find(x => x.id === id);
  if(!c) return;
  Object.assign(S, c.estado);
  cargarEstado(); render(); aviso("Caso abierto");
}
function borrarCaso(id){
  escribirCasos(leerCasos().filter(x => x.id !== id));
  pintarCasos(); aviso("Caso eliminado");
}
function pintarCasos(){
  const lista = leerCasos(), cont = $("listaCasos");
  $("contadorCasos").textContent = lista.length ? lista.length : "";
  if(!lista.length){
    cont.innerHTML = `<p class="vacio">Todavía no guardas ningún caso. Se guardan en este navegador, en este equipo.</p>`;
    return;
  }
  cont.innerHTML = lista.map(c => {
    const f = new Date(c.fecha);
    const fecha = f.toLocaleDateString("es-MX", {day:"2-digit", month:"short", year:"2-digit"});
    return `<div class="caso"><button type="button" class="caso-abrir" data-id="${c.id}">
      <span class="caso-nom">${c.nombre.replace(/[<>]/g,"")}</span>
      <span class="caso-meta">${fecha} · ${c.escenario.replace(/[<>]/g,"")} · ${mxn(c.neto)}</span>
    </button><button type="button" class="caso-borrar" data-del="${c.id}" title="Eliminar">×</button></div>`;
  }).join("");
}
$("btnGuardarCaso").addEventListener("click", guardarCaso);
$("listaCasos").addEventListener("click", e => {
  const abrir = e.target.closest(".caso-abrir");
  const borrar = e.target.closest(".caso-borrar");
  if(abrir) abrirCaso(Number(abrir.dataset.id));
  else if(borrar) borrarCaso(Number(borrar.dataset.del));
});

/* ======================= ARRANQUE ======================= */
poblarEjercicios();
restaurarBorrador();
cargarEstado();
render();
pintarCasos();
document.addEventListener("input", guardarBorrador);
document.addEventListener("change", guardarBorrador);

if("serviceWorker" in navigator && location.protocol.startsWith("http")){
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(()=>{}));
}
