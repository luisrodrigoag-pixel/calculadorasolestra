/* Genera la cédula de cálculo en PDF sobre la identidad de Solestra.
   Depende de vendor/jspdf.umd.min.js y vendor/jspdf.plugin.autotable.min.js.
   Si existe assets/qr.png se dibuja en el pie; si no, se omite sin error. */
(function () {
  "use strict";

  const MARCA = {
    marino: [0x20, 0x20, 0x4a],
    verde:  [0x08, 0x54, 0x4a],
    tinta:  [0x15, 0x1a, 0x22],
    gris:   [0x5c, 0x66, 0x70],
    linea:  [0xc8, 0xd0, 0xd7]
  };
  const DIRECCION = "Calle Sirio #2912, Colonia Rinconada Sur Oriente, Puebla, Puebla, C.P. 72193.";
  const TELEFONO  = "Teléfono: 222 413 9231";
  const FIRMA     = "Elaboró: Lic. Luis Rodrigo Aguilar, por SOLESTRA CONSULTORES MX, S.C.";

  const M = { top: 34, bottom: 32, left: 25, right: 23 };   // mm, como la hoja membretada
  const money = n => Math.abs(n) < 0.005 ? "–" :
    n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pesos = n => "$" + Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const dec = (n, d) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: d, maximumFractionDigits: d });

  function imagenDelDom(sel) {
    const el = document.querySelector(sel);
    return el && el.complete && el.naturalWidth ? el : null;
  }

  async function comoDataURL(url) {
    try {
      const r = await fetch(url);
      if (!r.ok) return null;
      const b = await r.blob();
      return await new Promise(res => {
        const fr = new FileReader();
        fr.onload = () => res(fr.result);
        fr.onerror = () => res(null);
        fr.readAsDataURL(b);
      });
    } catch (e) { return null; }
  }

  function fechaLarga(d) {
    return d.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
  }

  function fechaISO(iso) {
    if (!iso) return "";
    const p = String(iso).split("-");
    if (p.length !== 3) return String(iso);
    const d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    return isNaN(d) ? String(iso) : fechaLarga(d);
  }

  async function generarCedulaPDF(R, S) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "letter", orientation: "portrait" });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const ancho = W - M.left - M.right;

    const logo = imagenDelDom("img.logo-light");
    const qr = await comoDataURL("assets/qr.png");

    function membrete() {
      if (logo) {
        const w = 25, h = w * logo.naturalHeight / logo.naturalWidth;
        doc.addImage(logo, "PNG", W - M.right - w, 9, w, h);
      }
      doc.setFillColor(...MARCA.verde);
      doc.rect(0, H - 24, W * 0.42, 2.2, "F");
      if (qr) { try { doc.addImage(qr, "PNG", M.left - 12, H - 20, 14, 14); } catch (e) {} }
      doc.setDrawColor(...MARCA.marino);
      doc.setLineWidth(0.6);
      doc.line(W * 0.45, H - 22, W * 0.45, H - 8);
      doc.setFont("courier", "normal").setFontSize(7.5).setTextColor(...MARCA.gris);
      doc.text(doc.splitTextToSize(DIRECCION, W - W * 0.45 - M.right - 4), W * 0.45 + 4, H - 18);
      doc.text(TELEFONO, W * 0.45 + 4, H - 9.5);
      const pag = doc.internal.getNumberOfPages();
      doc.text("Página " + pag, W - M.right, H - 5, { align: "right" });
    }

    let y = M.top;
    const salto = alto => { if (y + alto > H - M.bottom) { doc.addPage(); y = M.top; } };

    function titulo(txt) {
      doc.setFont("courier", "bold").setFontSize(11).setTextColor(...MARCA.tinta);
      doc.text(txt, M.left, y); y += 6;
    }
    function parrafo(txt, opts) {
      opts = opts || {};
      doc.setFont("courier", opts.bold ? "bold" : "normal").setFontSize(opts.size || 8.5)
         .setTextColor(...(opts.color || MARCA.tinta));
      const lineas = doc.splitTextToSize(txt, ancho - (opts.sangria || 0));
      salto(lineas.length * 4.1);
      doc.text(lineas, M.left + (opts.sangria || 0), y);
      y += lineas.length * 4.1 + (opts.after === undefined ? 2 : opts.after);
    }
    function rubro(txt, reserva) {
      salto(reserva || 14);
      y += 3;
      doc.setFont("courier", "bold").setFontSize(9).setTextColor(...MARCA.marino);
      doc.text(txt, M.left, y);
      doc.setDrawColor(...MARCA.marino).setLineWidth(0.25);
      doc.line(M.left, y + 1.6, M.left + ancho, y + 1.6);
      y += 5.5;
    }
    function tabla(opciones) {
      doc.autoTable(Object.assign({
        startY: y,
        margin: { left: M.left, right: M.right, top: M.top, bottom: M.bottom },
        styles: { font: "courier", fontSize: 8, cellPadding: { top: 1.2, bottom: 1.2, left: 1.4, right: 1.4 },
                  textColor: MARCA.tinta, lineColor: MARCA.linea, lineWidth: 0 },
        theme: "plain",
        didDrawPage: membrete
      }, opciones));
      y = doc.lastAutoTable.finalY + 1;
    }

    /* ---------------- contenido ---------------- */
    membrete();

    titulo("CÉDULA DE CÁLCULO DE FINIQUITO Y LIQUIDACIÓN");
    parrafo("Comparativo de escenarios de terminación conforme a la Ley Federal del Trabajo y " +
            "determinación del impuesto sobre la renta a cargo del trabajador.", { after: 1 });

    const anchoPar = [ancho * 0.22, ancho * 0.28, ancho * 0.23, ancho * 0.27];
    const estilosPar = {
      0: { cellWidth: anchoPar[0], textColor: MARCA.gris },
      1: { cellWidth: anchoPar[1], halign: "right" },
      2: { cellWidth: anchoPar[2], textColor: MARCA.gris },
      3: { cellWidth: anchoPar[3], halign: "right" }
    };

    rubro("Identificación");
    tabla({
      body: [
        ["Trabajador", S.idTrabajador || "", "Expediente", S.idExpediente || ""],
        ["Patrón", S.idPatron || "", "Elaborada el", fechaLarga(new Date())],
        ["Ejercicio fiscal", String(S.ejercicio), "Área geográfica",
         S.zona === "frontera" ? "Frontera norte" : "Resto del país"]
      ],
      columnStyles: Object.assign({}, estilosPar, { 1: { cellWidth: anchoPar[1] }, 3: { cellWidth: anchoPar[3] } })
    });

    rubro("Bases del cálculo");
    tabla({
      body: [
        ["Fecha de ingreso", fechaISO(S.ingreso), "Salario diario", money(R.sd)],
        ["Fecha de baja", fechaISO(S.baja), "Factor integr.", dec(R.factor, 4)],
        ["Antigüedad", dec(R.anios, 2) + " años", "Salario integrado", money(R.sdi)],
        ["Sueldo mensual", money(Number(S.sueldo) + Number(S.variable)), "Vacaciones LFT", R.dv + " días"],
        ["UMA diaria", money(R.P.uma), "Tope prima antig.", money(R.topePrima) + (R.sd > R.topePrima ? " (aplica)" : " (no aplica)")],
        ["Salario mínimo", money(S.zona === "frontera" ? R.P.smFrontera : R.P.smGeneral),
         "Sueldo mens. ord.", money(R.mesOrd)]
      ],
      columnStyles: estilosPar
    });

    rubro("Días devengados considerados");
    tabla({
      body: [
        ["Aguinaldo", dec(S.dAguinaldo, 6) + " días", "Adeudo vacaciones", dec(S.dVacAdeudo, 2) + " días"],
        ["Vacaciones prop.", dec(S.dVacProp, 6) + " días", "Prima vacacional", S.pctPrima + " %"],
        ["Años prima antig.", dec(S.aniosPrima, 6), "Salarios pend.", dec(S.dSalarios, 2) + " días"]
      ],
      columnStyles: estilosPar
    });

    /* comparativo: conceptos como renglones, escenarios como columnas */
    const esc = R.filas;
    const f0 = esc[0];
    const ded = Math.max(0, Number(S.otras) || 0);
    const conceptos = [
      ["Salarios pendientes", f => f.salarios],
      ["Aguinaldo",           f => f.aguinaldo],
      ["Vacaciones prop.",    f => f.vacProp],
      ["Prima vacacional",    f => f.primaProp],
      ["Adeudo vacaciones",   f => f.vacAdeudo],
      ["Adeudo prima vac.",   f => f.primaAdeudo],
      ["Gratificación",       f => f.grat],
      ["Prima de antigüedad", f => f.prima],
      ["Indemnización",       f => f.indem],
      ["20 días por año",     f => f.v20],
      ["Salarios caídos",     f => f.vCai]
    ].filter(([, g]) => esc.some(f => Math.abs(g(f)) > 0.005));

    const cuerpo = conceptos.map(([n, g]) => [n, ...esc.map(f => money(g(f)))]);
    cuerpo.push(["Subtotal", ...esc.map(f => money(f.subtotal))]);
    cuerpo.push(["ISR a retener", ...esc.map(f => money(f.isrTot))]);
    if (ded > 0.005) cuerpo.push(["Otras deducciones", ...esc.map(() => money(ded))]);
    cuerpo.push(["Neto a pagar", ...esc.map(f => money(f.neto))]);

    const iSub = conceptos.length, iNeto = cuerpo.length - 1;
    const colConcepto = ancho * 0.26;
    const colEsc = (ancho - colConcepto) / esc.length;
    const estilosComp = { 0: { cellWidth: colConcepto, halign: "left" } };
    esc.forEach((_, i) => { estilosComp[i + 1] = { cellWidth: colEsc, halign: "right" }; });

    rubro("Comparativo de escenarios", 30);
    tabla({
      head: [["Concepto", ...esc.map(f => f.nombre)]],
      body: cuerpo,
      pageBreak: "avoid",
      rowPageBreak: "avoid",
      headStyles: { fillColor: MARCA.marino, textColor: [255, 255, 255], fontStyle: "bold",
                    halign: "right", fontSize: 7.5 },
      columnStyles: estilosComp,
      didParseCell: d => {
        if (d.section === "head" && d.column.index === 0) d.cell.styles.halign = "left";
        if (d.section !== "body") return;
        if (d.row.index === iSub || d.row.index === iNeto) {
          d.cell.styles.fontStyle = "bold";
          d.cell.styles.lineWidth = { top: 0.25 };
          d.cell.styles.lineColor = MARCA.marino;
        }
      }
    });

    rubro("Determinación del impuesto sobre la renta", 62);
    tabla({
      head: [["Concepto", ...esc.map(f => f.nombre)]],
      body: [
        ["Base gravable ord.", ...esc.map(f => money(f.baseOrd))],
        ["ISR ordinario art. 96", ...esc.map(f => money(f.isrOrd))],
        ["Ingresos separación", ...esc.map(f => money(f.brutoSep))],
        ...(S.exencion ? [["Exención art. 93 XIII", ...esc.map(f => money(f.exAplicada))]] : []),
        ["ISR separación " + dec(R.tasa174 * 100, 2) + "%", ...esc.map(f => money(f.isrSep))],
        ["ISR total", ...esc.map(f => money(f.isrTot))]
      ],
      pageBreak: "avoid",
      rowPageBreak: "avoid",
      headStyles: { fillColor: MARCA.marino, textColor: [255, 255, 255], fontStyle: "bold",
                    halign: "right", fontSize: 7.5 },
      columnStyles: estilosComp,
      didParseCell: d => {
        if (d.section === "head" && d.column.index === 0) d.cell.styles.halign = "left";
        if (d.section === "body" && d.row.index === (S.exencion ? 5 : 4)) {
          d.cell.styles.fontStyle = "bold";
          d.cell.styles.lineWidth = { top: 0.25 };
          d.cell.styles.lineColor = MARCA.marino;
        }
      }
    });

    rubro("Criterios aplicados y advertencias", 30);
    const notas = [
      "Exenciones de ingresos ordinarios: 30 UMA de aguinaldo (" + pesos(R.exAguinaldo) + ") y 15 UMA de " +
      "prima vacacional (" + pesos(R.exPrimaVac) + "), conforme al artículo 93, fracción XIV, de la Ley del " +
      "Impuesto sobre la Renta. Las vacaciones se gravan en su totalidad.",

      "Ingresos por separación: se aplicó la tasa efectiva del último sueldo mensual ordinario, " +
      dec(R.tasa174 * 100, 2) + " %, en términos del artículo 174 del Reglamento de la Ley del Impuesto sobre " +
      "la Renta. " + (S.exencion
        ? "Se aplicó la exención de 90 UMA por año de servicio del artículo 93, fracción XIII, hasta por " +
          pesos(R.exSeparacion) + "."
        : "No se aplicó la exención de 90 UMA por año de servicio del artículo 93, fracción XIII; de aplicarse, " +
          "quedarían exentos hasta " + pesos(R.exSeparacion || 90 * R.P.uma * R.aniosEx) + "."),

      "Base de las indemnizaciones: se utilizó el " + (S.baseIndem === "sdi" ? "salario diario integrado de " +
      pesos(R.sdi) + ", conforme al artículo 84 de la Ley Federal del Trabajo." : "salario diario simple de " +
      pesos(R.sd) + ". El artículo 84 de la Ley Federal del Trabajo ordena integrar al salario las demás " +
      "prestaciones, lo que arroja un salario diario integrado de " + pesos(R.sdi) + "."),

      "No se incluyen subsidio para el empleo, cuotas obrero-patronales ni retenciones locales."
    ];
    if (R.anios >= 15 && !S.primaRenuncia) {
      notas.splice(3, 0,
        "Prima de antigüedad en renuncia: el trabajador acumula " + dec(R.anios, 2) + " años de servicio. " +
        "Conforme al artículo 162, fracción III, de la Ley Federal del Trabajo, con quince años o más la prima " +
        "de antigüedad se paga también cuando la separación es voluntaria, por lo que el escenario de finiquito " +
        "debe revisarse antes de ofrecerse.");
    }
    notas.forEach(n => parrafo(n, { sangria: 6, after: 2.5 }));

    salto(20);
    y += 4;
    parrafo("H. Puebla de Zaragoza, Puebla; a " + fechaLarga(new Date()) + ".", { after: 4 });
    parrafo(FIRMA, { after: 2 });
    parrafo("Estimación de trabajo. No sustituye la revisión del expediente laboral ni el dictamen del área fiscal.",
            { size: 7.5, color: MARCA.gris, after: 0 });

    const quien = (S.idTrabajador || S.idExpediente || "caso")
      .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "").slice(0, 40) || "caso";
    doc.save("Cedula_" + quien + "_" + new Date().toISOString().slice(0, 10) + ".pdf");
  }

  window.generarCedulaPDF = generarCedulaPDF;
})();
