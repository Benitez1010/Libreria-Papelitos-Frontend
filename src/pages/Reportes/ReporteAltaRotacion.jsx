/**
 * Generador Oficial de Reporte: Análisis de Productos de Alta Rotación
 * Librería y Papelería Papelitos
 */

// 1. Procesa y agrupa las salidas ordenándolas de mayor a menor
export const procesarAltaRotacion = (movimientos, fechaDesde, fechaHasta) => {
  const salidas = movimientos.filter((m) => {
    if (m.tipo !== 'SALIDA') return false;
    const fechaSoloDia = m.fecha_hora ? m.fecha_hora.split('T')[0] : '';
    let coincideDesde = true;
    let coincideHasta = true;
    if (fechaDesde) coincideDesde = fechaSoloDia >= fechaDesde;
    if (fechaHasta) coincideHasta = fechaSoloDia <= fechaHasta;
    return coincideDesde && coincideHasta;
  });

  const conteo = {};
  salidas.forEach((m) => {
    const nombre = m.producto_nombre || 'Sin nombre';
    conteo[nombre] = (conteo[nombre] || 0) + Number(m.cantidad || 0);
  });

  return Object.entries(conteo)
    .map(([producto, total_salidas]) => ({ producto, total_salidas }))
    .sort((a, b) => b.total_salidas - a.total_salidas);
};

// 2. Exportación a Excel (.xls limpio sin referencias académicas)
export const exportarExcelAltaRotacion = (movimientos, fechaDesde, fechaHasta) => {
  const ranking = procesarAltaRotacion(movimientos, fechaDesde, fechaHasta);
  if (ranking.length === 0) {
    alert('No se encontraron movimientos de salida en el período seleccionado.');
    return;
  }

  const rangoTexto = (fechaDesde && fechaHasta)
    ? `${fechaDesde} al ${fechaHasta}`
    : (fechaDesde ? `Desde ${fechaDesde}` : (fechaHasta ? `Hasta ${fechaHasta}` : 'Todo el Histórico'));

  const contenidoExcel = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <style>
          .titulo { font-size: 16pt; font-weight: bold; color: #1E5631; }
          .subtitulo { font-size: 12pt; font-weight: bold; color: #333333; }
          .periodo { font-size: 10pt; color: #555555; font-style: italic; }
          th { background-color: #1E5631; color: #ffffff; font-weight: bold; border: 1px solid #143d22; padding: 10px; font-size: 11pt; text-align: center; }
          td { border: 1px solid #dcdcdc; padding: 8px; font-size: 10pt; }
          .posicion { text-align: center; font-weight: bold; background-color: #f4fbf7; }
          .total { text-align: center; font-weight: bold; color: #1E5631; font-size: 11pt; }
          .rotacion-lider { color: #d32f2f; font-weight: bold; text-align: center; }
          .rotacion-alta { color: #ed6c02; font-weight: bold; text-align: center; }
          .rotacion-normal { color: #555555; text-align: center; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="4" class="titulo">LIBRERÍA Y PAPELERÍA PAPELITOS</td></tr>
          <tr><td colspan="4" class="subtitulo">Reporte de Productos con Mayor Demanda y Rotación</td></tr>
          <tr><td colspan="4" class="periodo">Período auditado: ${rangoTexto}</td></tr>
          <tr><td colspan="4"></td></tr>
          <thead>
            <tr>
              <th>Ranking</th>
              <th>Nombre del Producto</th>
              <th>Total Salidas (Despachos)</th>
              <th>Nivel de Demanda Estacional</th>
            </tr>
          </thead>
          <tbody>
            ${ranking.map((item, idx) => `
              <tr>
                <td class="posicion">#${idx + 1}</td>
                <td>${item.producto}</td>
                <td class="total">${item.total_salidas}</td>
                <td class="${idx === 0 ? 'rotacion-lider' : (idx < 3 ? 'rotacion-alta' : 'rotacion-normal')}">
                  ${idx === 0 ? 'Líder en Demanda' : (idx < 3 ? 'Alta Rotación' : 'Rotación Regular')}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([contenidoExcel], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Alta_Rotacion_Papelitos_${fechaDesde || 'inicio'}_a_${fechaHasta || 'hoy'}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 3. Exportación a PDF / Impresión formal para la Empresa
export const exportarPDFAltaRotacion = (movimientos, fechaDesde, fechaHasta) => {
  const ranking = procesarAltaRotacion(movimientos, fechaDesde, fechaHasta);
  if (ranking.length === 0) {
    alert('No se encontraron movimientos de salida en el período seleccionado.');
    return;
  }

  const rangoTexto = (fechaDesde && fechaHasta)
    ? `${fechaDesde} hasta ${fechaHasta}`
    : (fechaDesde ? `Desde ${fechaDesde}` : (fechaHasta ? `Hasta ${fechaHasta}` : 'Todo el Histórico'));

  const ventana = window.open('', '', 'width=950,height=750');
  ventana.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Reporte de Productos de Alta Rotación - Librería Papelitos</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 30px; color: #222; }
          .header-reporte { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #1E5631; padding-bottom: 15px; margin-bottom: 20px; }
          .header-info h1 { margin: 0; color: #1E5631; font-size: 24px; text-transform: uppercase; letter-spacing: 0.5px; }
          .header-info p { margin: 4px 0 0 0; color: #444; font-size: 13px; }
          .logo-empresa { width: 140px; height: auto; object-fit: contain; }
          .banner-resumen { background: #f0f7f2; border-left: 5px solid #1E5631; padding: 12px 18px; border-radius: 4px; margin-bottom: 25px; display: flex; justify-content: space-between; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          thead tr { background-color: #1E5631; color: #ffffff; }
          th { padding: 12px 10px; text-align: left; font-size: 12px; letter-spacing: 0.5px; text-transform: uppercase; }
          td { padding: 10px; border-bottom: 1px solid #e0e0e0; font-size: 13px; }
          tbody tr:nth-child(even) { background-color: #fdfdfd; }
          tbody tr:hover { background-color: #f4fbf7; }
          .posicion { font-weight: bold; text-align: center; width: 60px; color: #1E5631; }
          .total { text-align: center; font-weight: bold; font-size: 14px; width: 150px; }
          .badge-lider { background: #fde8e8; color: #d32f2f; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 11px; display: inline-block; }
          .badge-alto { background: #fff4e5; color: #ed6c02; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 11px; display: inline-block; }
          .badge-normal { background: #f5f5f5; color: #555; padding: 4px 10px; border-radius: 12px; font-size: 11px; display: inline-block; }
          .footer { margin-top: 35px; text-align: right; font-size: 11px; color: #888; border-top: 1px solid #e0e0e0; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header-reporte">
          <div class="header-info">
            <h1>Librería y Papelería Papelitos</h1>
            <p><strong>Reporte Analítico:</strong> Productos con Mayor Demanda y Rotación</p>
            <p>Sistema de Control y Gestión de Inventarios</p>
          </div>
          <img src="/logo.png" alt="Logo Papelitos" class="logo-empresa" onerror="this.src='/src/assets/logo.png';" />
        </div>

        <div class="banner-resumen">
          <div><strong>Período Auditado:</strong> ${rangoTexto}</div>
          <div><strong>Total de Artículos Evaluados:</strong> ${ranking.length}</div>
          <div><strong>Fecha de Emisión:</strong> ${new Date().toLocaleDateString('es-SV')}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="text-align: center;">Ranking</th>
              <th>Nombre del Producto</th>
              <th style="text-align: center;">Total Unidades Despachadas</th>
              <th style="text-align: center;">Comportamiento de Demanda</th>
            </tr>
          </thead>
          <tbody>
            ${ranking.map((item, idx) => `
              <tr>
                <td class="posicion">#${idx + 1}</td>
                <td style="font-weight: 600;">${item.producto}</td>
                <td class="total">${item.total_salidas}</td>
                <td style="text-align: center;">
                  ${idx === 0 ? '<span class="badge-lider">★ Producto Líder</span>' : (idx < 3 ? '<span class="badge-alto">Alta Demanda</span>' : '<span class="badge-normal">Rotación Regular</span>')}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          Generado automáticamente por el Módulo de Control de Inventario • Librería Papelitos
        </div>
      </body>
    </html>
  `);
  ventana.document.close();
  ventana.focus();
  setTimeout(() => {
    ventana.print();
  }, 500);
};