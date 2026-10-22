import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // <-- Importación corregida para Vite

// Función estándar para tablas simples
export const generarPDF = (tituloReporte, columnas, datosPantalla) => {
  const doc = new jsPDF('portrait', 'mm', 'letter');
  
  doc.setFontSize(22);
  doc.setTextColor(30, 86, 49);
  doc.setFont(undefined, 'bold');
  doc.text('Librería Papelitos', 14, 22);
  
  doc.setFontSize(14);
  doc.setTextColor(55, 71, 79);
  doc.setFont(undefined, 'normal');
  doc.text(tituloReporte, 14, 32);
  
  const fechaActual = new Date();
  const fechaFormateada = fechaActual.toLocaleDateString('es-SV');
  const horaFormateada = fechaActual.toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generado el: ${fechaFormateada} a las ${horaFormateada}`, 14, 40);
  
  const headersTabla = [columnas.map(col => col.header)];
  const dataTabla = datosPantalla.map(fila => 
    columnas.map(col => {
      const valor = fila[col.field];
      return valor !== null && valor !== undefined ? valor : 'N/A';
    })
  );

  // <-- Llamada corregida (ya no usamos doc.autoTable)
  autoTable(doc, {
    startY: 45,
    head: headersTabla,
    body: dataTabla,
    theme: 'striped',
    headStyles: { fillColor: [30, 86, 49], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [234, 244, 236] },
    styles: { fontSize: 9, cellPadding: 3 },
    margin: { top: 45, left: 14, right: 14 },
  });
  
  const nombreArchivo = `${tituloReporte.replace(/ /g, '_')}_${fechaFormateada.replace(/\//g, '-')}.pdf`;
  doc.save(nombreArchivo);
};

// NUEVA FUNCIÓN: Para reportes con múltiples secciones/acordeones
export const generarPDFAgrupado = (tituloReporte, columnas, datosAgrupados) => {
  const doc = new jsPDF('portrait', 'mm', 'letter');
  
  // Membrete
  doc.setFontSize(22);
  doc.setTextColor(30, 86, 49);
  doc.setFont(undefined, 'bold');
  doc.text('Librería Papelitos', 14, 22);
  
  doc.setFontSize(14);
  doc.setTextColor(55, 71, 79);
  doc.setFont(undefined, 'normal');
  doc.text(tituloReporte, 14, 32);

  const fechaActual = new Date();
  const fechaFormateada = fechaActual.toLocaleDateString('es-SV');
  const horaFormateada = fechaActual.toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generado el: ${fechaFormateada} a las ${horaFormateada}`, 14, 40);

  let currentY = 48;

  // Iteramos sobre cada categoría (acordeón)
  Object.entries(datosAgrupados).forEach(([categoria, items]) => {
    // Si nos acercamos mucho al final de la página, creamos una nueva
    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }

    // Dibujamos el título de la categoría
    doc.setFontSize(12);
    doc.setTextColor(30, 86, 49);
    doc.setFont(undefined, 'bold');
    doc.text(categoria, 14, currentY);
    currentY += 4;

    const headersTabla = [columnas.map(col => col.header)];
    const dataTabla = items.map(fila => 
      columnas.map(col => fila[col.field] ?? 'N/A')
    );

    // Dibujamos la sub-tabla para esta categoría
    autoTable(doc, {
      startY: currentY,
      head: headersTabla,
      body: dataTabla,
      theme: 'striped',
      headStyles: { fillColor: [84, 110, 122], textColor: [255, 255, 255] }, // Gris azulado para distinguir del principal
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: 14, right: 14 },
    });

    // Actualizamos la posición Y para la siguiente categoría sumando un espacio
    currentY = doc.lastAutoTable.finalY + 12; 
  });

  const nombreArchivo = `${tituloReporte.replace(/ /g, '_')}_${fechaFormateada.replace(/\//g, '-')}.pdf`;
  doc.save(nombreArchivo);
};