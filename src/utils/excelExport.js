import * as XLSX from 'xlsx';

export const generarExcel = (tituloReporte, columnas, datosPantalla) => {
  const fechaActual = new Date();
  const fechaFormateada = fechaActual.toLocaleDateString('es-SV');
  const horaFormateada = fechaActual.toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' });

  const encabezados = columnas.map(col => col.header);
  const filas = datosPantalla.map(fila =>
    columnas.map(col => {
      const valor = fila[col.field];
      return valor !== null && valor !== undefined ? valor : 'N/A';
    })
  );

  const contenido = [
    ['Librería Papelitos'],
    [tituloReporte],
    [`Generado el: ${fechaFormateada} a las ${horaFormateada}`],
    [],
    encabezados,
    ...filas
  ];

  const hoja = XLSX.utils.aoa_to_sheet(contenido);

  hoja['!cols'] = columnas.map((col, i) => {
    const largoMaximo = Math.max(
      col.header.length,
      ...filas.map(fila => String(fila[i]).length)
    );
    return { wch: largoMaximo + 2 };
  });

  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'Reporte');

  const nombreArchivo = `${tituloReporte.replace(/ /g, '_')}_${fechaFormateada.replace(/\//g, '-')}.xlsx`;
  XLSX.writeFile(libro, nombreArchivo);
};