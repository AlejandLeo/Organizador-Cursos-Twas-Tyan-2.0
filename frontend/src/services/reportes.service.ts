/**
 * TYAN — Servicio de Reportes Profesionales
 * Genera reportes en PDF (jsPDF + autoTable) y Excel (SheetJS).
 * Cada función corresponde a un tipo de reporte y un formato.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// ─── Paleta de colores corporativos ──────────────────────────────────────────
const C = {
    skyBlue:     [14,  165, 233] as [n, n, n],   // sky-500
    skyDark:     [2,   132, 199] as [n, n, n],   // sky-600
    emerald:     [16,  185, 129] as [n, n, n],   // emerald-500
    emeraldDark: [5,   150, 105] as [n, n, n],   // emerald-600
    white:       [255, 255, 255] as [n, n, n],
    lightBg:     [240, 249, 255] as [n, n, n],   // sky-50
    stripe:      [236, 253, 245] as [n, n, n],   // emerald-50
    border:      [186, 230, 253] as [n, n, n],   // sky-200
    text:        [15,  23,  42]  as [n, n, n],   // slate-900
    muted:       [100, 116, 139] as [n, n, n],   // slate-500
    accent:      [3,   105, 161] as [n, n, n],   // sky-700
};
type n = number;

// ─── Utilidades compartidas ───────────────────────────────────────────────────

/** Timestamp para nombres de archivo: "22-04-2026" */
function timestamp(): string {
    return new Date().toLocaleDateString('es-BO').replace(/\//g, '-');
}

/** Formatea una fecha ISO o Date a "DD/MM/YYYY". */
const fmt = (d: any): string => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
    catch { return String(d); }
};

/** Trunca un texto y añade "…" si supera maxLen. */
const trunc = (s: any, maxLen = 60): string => {
    const str = String(s ?? '—');
    return str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str;
};

/** Número de página actual de un doc jsPDF. */
const pageCount = (doc: jsPDF) => (doc.internal as any).getNumberOfPages() as number;

// ─── Encabezado y pie de página PDF ──────────────────────────────────────────

/**
 * Dibuja el encabezado institucional en la página activa.
 * @returns La coordenada Y en la que debe empezar el contenido.
 */
function drawHeader(doc: jsPDF, titulo: string, subtitulo: string): number {
    const W = doc.internal.pageSize.getWidth();

    // Banda principal (celeste)
    doc.setFillColor(C.skyDark[0], C.skyDark[1], C.skyDark[2]);
    doc.rect(0, 0, W, 30, 'F');

    // Franja de acento (verde esmeralda)
    doc.setFillColor(C.emerald[0], C.emerald[1], C.emerald[2]);
    doc.rect(0, 30, W, 3, 'F');

    // Institución (arriba izq.)
    doc.setTextColor(C.white[0], C.white[1], C.white[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('TYAN · GESTIÓN ACADÉMICA — UMSA', 12, 9);

    // Fecha de generación (arriba der.)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const ahora = new Date().toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' });
    doc.text(`Generado: ${ahora}`, W - 12, 9, { align: 'right' });

    // Título del reporte
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(titulo, 12, 23);

    // Subtítulo (fuera de la banda, sobre fondo blanco)
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(C.muted[0], C.muted[1], C.muted[2]);
    doc.text(subtitulo, 12, 42);

    return 50; // Y de inicio del contenido
}

/** Añade pie de página con número de página a todas las páginas del doc. */
function drawFooters(doc: jsPDF): void {
    const total = pageCount(doc);
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();

    for (let i = 1; i <= total; i++) {
        doc.setPage(i);
        doc.setFillColor(C.lightBg[0], C.lightBg[1], C.lightBg[2]);
        doc.rect(0, H - 12, W, 12, 'F');
        doc.setDrawColor(C.border[0], C.border[1], C.border[2]);
        doc.setLineWidth(0.3);
        doc.line(0, H - 12, W, H - 12);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(C.muted[0], C.muted[1], C.muted[2]);
        doc.text('Sistema de Gestión Académica TYAN — UMSA', 12, H - 4);
        doc.text(`Página ${i} / ${total}`, W - 12, H - 4, { align: 'right' });
    }
}

/** Configuración de estilos de tabla compartida. */
function tableStyles(headColor: [number, number, number]) {
    return {
        theme: 'grid' as const,
        styles: {
            font: 'helvetica' as const,
            fontSize: 8.5,
            cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
            textColor: C.text as [number, number, number],
            lineColor: C.border as [number, number, number],
            lineWidth: 0.2,
            overflow: 'linebreak' as const,
        },
        headStyles: {
            fillColor: headColor,
            textColor: C.white as [number, number, number],
            fontStyle: 'bold' as const,
            fontSize: 8.5,
            halign: 'left' as const,
        },
        alternateRowStyles: { fillColor: C.stripe as [number, number, number] },
        columnStyles: { 0: { fontStyle: 'bold' as const } },
        margin: { left: 12, right: 12 },
    };
}

// ═════════════════════════════════════════════════════════════════════════════
//  REPORTE DE EVENTOS
// ═════════════════════════════════════════════════════════════════════════════

export function generarPdfEventos(eventos: any[]): void {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const activos    = eventos.filter(e => e.estado === 1);
    const finalizados = eventos.filter(e => e.estado !== 1);

    let y = drawHeader(
        doc,
        'REPORTE DE EVENTOS ACADÉMICOS',
        `Total: ${eventos.length} eventos  ·  Activos: ${activos.length}  ·  Finalizados: ${finalizados.length}`
    );

    // ── Resumen ejecutivo (cajas) ──────────────────────────────────────────
    const boxes = [
        { label: 'Total Eventos',   val: eventos.length,    col: C.skyDark   },
        { label: 'Activos',         val: activos.length,    col: C.emeraldDark },
        { label: 'Finalizados',     val: finalizados.length, col: C.muted     },
    ];
    const bw = 55, bh = 16, gap = 6, startX = 12;
    boxes.forEach((b, i) => {
        const x = startX + i * (bw + gap);
        doc.setFillColor(b.col[0], b.col[1], b.col[2]);
        doc.roundedRect(x, y, bw, bh, 3, 3, 'F');
        doc.setTextColor(C.white[0], C.white[1], C.white[2]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(String(b.val), x + bw / 2, y + 9, { align: 'center' });
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.text(b.label.toUpperCase(), x + bw / 2, y + 14, { align: 'center' });
    });
    y += bh + 8;

    // ── Tabla principal ────────────────────────────────────────────────────
    const headers = ['#', 'Nombre del Evento', 'Gestión', 'Ubicación / Dirección', 'Fecha Inicio', 'Fecha Fin', 'Estado', 'Actividades', 'Versión'];
    const rows = eventos.map((e, i) => [
        String(i + 1),
        trunc(e.nombre, 45),
        e.gestion || '—',
        trunc(`${e.ubicacion || ''}${e.direccion ? ' · ' + e.direccion : ''}`, 50),
        fmt(e.fecha_inicio),
        fmt(e.fecha_fin),
        e.estado === 1 ? 'Activo' : 'Finalizado',
        String(e.actividades?.length ?? 0),
        e.version || '—',
    ]);

    autoTable(doc, {
        ...tableStyles(C.skyDark),
        startY: y,
        head: [headers],
        body: rows,
        didDrawCell: (data: any) => {
            // Colorear la celda "Estado"
            if (data.section === 'body' && data.column.index === 6) {
                const isActive = data.cell.raw === 'Activo';
                const col = isActive ? C.emerald : C.muted;
                doc.setFillColor(col[0], col[1], col[2]);
                doc.roundedRect(data.cell.x + 1, data.cell.y + 1.5, data.cell.width - 2, data.cell.height - 3, 1.5, 1.5, 'F');
                doc.setTextColor(C.white[0], C.white[1], C.white[2]);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(7.5);
                doc.text(data.cell.raw as string, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 0.5, { align: 'center' });
            }
        },
    });

    drawFooters(doc);
    doc.save(`TYAN_Eventos_${timestamp()}.pdf`);
}

export function generarExcelEventos(eventos: any[]): void {
    const todos = eventos.map((e, i) => ({
        '#': i + 1,
        'Nombre del Evento':   e.nombre        || '—',
        'Gestión':             e.gestion        || '—',
        'Ubicación':           e.ubicacion      || '—',
        'Dirección':           e.direccion      || '—',
        'Fecha Inicio':        fmt(e.fecha_inicio),
        'Fecha Fin':           fmt(e.fecha_fin),
        'Estado':              e.estado === 1 ? 'Activo' : 'Finalizado',
        'Versión':             e.version        || '—',
        'Nro. Actividades':    e.actividades?.length ?? 0,
        'Descripción':         e.descripcion    || '—',
    }));

    const activos = eventos.filter(e => e.estado === 1).map((e, i) => ({
        '#': i + 1,
        'Nombre del Evento': e.nombre   || '—',
        'Gestión':           e.gestion  || '—',
        'Ubicación':         e.ubicacion || '—',
        'Fecha Inicio':      fmt(e.fecha_inicio),
        'Fecha Fin':         fmt(e.fecha_fin),
        'Nro. Actividades':  e.actividades?.length ?? 0,
    }));

    exportToExcel([
        { name: 'Todos los Eventos', rows: todos },
        { name: 'Activos', rows: activos }
    ], 'TYAN_Eventos');
}

// ═════════════════════════════════════════════════════════════════════════════
//  REPORTE DE ACTIVIDADES ACADÉMICAS
// ═════════════════════════════════════════════════════════════════════════════

export function generarPdfActividades(actividades: any[]): void {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // Agrupar por tipo para el resumen
    const porTipo: Record<string, number> = {};
    actividades.forEach(a => {
        const t = a.tipo || 'Sin tipo';
        porTipo[t] = (porTipo[t] || 0) + 1;
    });

    let y = drawHeader(
        doc,
        'REPORTE DE ACTIVIDADES ACADÉMICAS',
        `Total registradas: ${actividades.length}  ·  Tipos: ${Object.keys(porTipo).join(', ')}`
    );

    // ── Cajas de resumen por tipo ──────────────────────────────────────────
    const tiposArr = Object.entries(porTipo);
    const bw2 = 45, bh2 = 16, gap2 = 5;
    const colors2 = [C.emeraldDark, C.skyDark, C.skyBlue, C.emerald, C.accent];
    tiposArr.slice(0, 5).forEach(([tipo, cnt], i) => {
        const x = 12 + i * (bw2 + gap2);
        const col = colors2[i % colors2.length] || C.skyDark;
        doc.setFillColor(col[0], col[1], col[2]);
        doc.roundedRect(x, y, bw2, bh2, 3, 3, 'F');
        doc.setTextColor(C.white[0], C.white[1], C.white[2]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text(String(cnt), x + bw2 / 2, y + 9, { align: 'center' });
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.text(tipo.toUpperCase(), x + bw2 / 2, y + 14, { align: 'center' });
    });
    y += bh2 + 8;

    // ── Tabla principal ────────────────────────────────────────────────────
    const headers = ['#', 'Nombre de Actividad', 'Tipo', 'Evento Asociado', 'Fecha Inicio', 'Fecha Fin', 'Horas', 'Inscritos', 'Descripción'];
    const rows = actividades.map((a, i) => [
        String(i + 1),
        trunc(a.nombre, 40),
        a.tipo || '—',
        trunc(a.evento?.nombre ?? '—', 35),
        fmt(a.fecha_inicio),
        fmt(a.fecha_fin),
        a.horas != null ? `${a.horas} h` : '—',
        String(a.inscripciones?.length ?? 0),
        trunc(a.descripcion, 55),
    ]);

    autoTable(doc, {
        ...tableStyles(C.emeraldDark),
        startY: y,
        head: [headers],
        body: rows,
        columnStyles: {
            0: { cellWidth: 8,  fontStyle: 'bold' },
            1: { cellWidth: 48 },
            2: { cellWidth: 22 },
            3: { cellWidth: 40 },
            4: { cellWidth: 22 },
            5: { cellWidth: 22 },
            6: { cellWidth: 14 },
            7: { cellWidth: 16 },
            8: { cellWidth: 'auto' as any },
        },
    });

    drawFooters(doc);
    doc.save(`TYAN_Actividades_${timestamp()}.pdf`);
}

export function generarExcelActividades(actividades: any[]): void {
    const sheets: { name: string; rows: any[] }[] = [];

    const todos = actividades.map((a, i) => ({
        '#':                   i + 1,
        'Nombre de Actividad': a.nombre                  || '—',
        'Tipo':                a.tipo                    || '—',
        'Evento Asociado':     a.evento?.nombre          || '—',
        'Fecha Inicio':        fmt(a.fecha_inicio),
        'Fecha Fin':           fmt(a.fecha_fin),
        'Horas':               a.horas != null ? a.horas : '—',
        'Nro. Inscritos':      a.inscripciones?.length   ?? 0,
        'Descripción':         a.descripcion             || '—',
        'Fecha Registro':      fmt(a.fecha_creacion),
    }));
    sheets.push({ name: 'Actividades', rows: todos });

    // Hojas separadas por tipo
    const tipos = [...new Set(actividades.map(a => a.tipo || 'Sin tipo'))];
    tipos.forEach(tipo => {
        const subSet = actividades
            .filter(a => (a.tipo || 'Sin tipo') === tipo)
            .map((a, i) => ({
                '#':                   i + 1,
                'Nombre':              a.nombre               || '—',
                'Evento':              a.evento?.nombre       || '—',
                'Fecha Inicio':        fmt(a.fecha_inicio),
                'Fecha Fin':           fmt(a.fecha_fin),
                'Horas':               a.horas != null ? a.horas : '—',
                'Inscritos':           a.inscripciones?.length ?? 0,
            }));
        sheets.push({ name: tipo.slice(0, 30), rows: subSet });
    });

    exportToExcel(sheets, 'TYAN_Actividades');
}

// ═════════════════════════════════════════════════════════════════════════════
//  REPORTE GENERAL CONSOLIDADO (PDF de varias páginas / Excel de varias hojas)
// ═════════════════════════════════════════════════════════════════════════════

export function generarPdfGeneral(eventos: any[], actividades: any[]): void {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();

    // ── Portada ────────────────────────────────────────────────────────────
    doc.setFillColor(C.skyDark[0], C.skyDark[1], C.skyDark[2]);
    doc.rect(0, 0, W, 210, 'F');
    doc.setFillColor(C.emerald[0], C.emerald[1], C.emerald[2]);
    doc.rect(0, 0, 8, 210, 'F');

    doc.setTextColor(C.white[0], C.white[1], C.white[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.text('TYAN', 30, 60);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Gestión de Cursos y Eventos Académicos', 30, 72);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE GENERAL CONSOLIDADO', 30, 100);

    const ahora = new Date().toLocaleString('es-BO', { dateStyle: 'full', timeStyle: 'short' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(186, 230, 253);
    doc.text(`Generado el ${ahora}`, 30, 112);

    // Estadísticas en portada
    const stats = [
        { label: 'Eventos Totales',    val: eventos.length },
        { label: 'Eventos Activos',    val: eventos.filter(e => e.estado === 1).length },
        { label: 'Actividades',        val: actividades.length },
        { label: 'Total Inscritos',    val: actividades.reduce((acc, a) => acc + (a.inscripciones?.length ?? 0), 0) },
    ];
    const sw = 55, sh = 22, sgap = 8;
    stats.forEach((s, i) => {
        const x = 30 + i * (sw + sgap);
        const y = 135;
        doc.setFillColor(255, 255, 255, 0.15 as any);
        doc.setDrawColor(C.emerald[0], C.emerald[1], C.emerald[2]);
        doc.setLineWidth(0.5);
        doc.roundedRect(x, y, sw, sh, 3, 3);
        doc.setTextColor(C.white[0], C.white[1], C.white[2]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text(String(s.val), x + sw / 2, y + 12, { align: 'center' });
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.text(s.label.toUpperCase(), x + sw / 2, y + 19, { align: 'center' });
    });

    // ── Página 2: Eventos ──────────────────────────────────────────────────
    doc.addPage();
    let y2 = drawHeader(doc, 'EVENTOS ACADÉMICOS', `${eventos.length} eventos registrados`);
    const evHeaders = ['#', 'Nombre', 'Gestión', 'Ubicación', 'Inicio', 'Fin', 'Estado', 'Actividades'];
    const evRows = eventos.map((e, i) => [
        String(i + 1),
        trunc(e.nombre, 42),
        e.gestion || '—',
        trunc(e.ubicacion || '—', 35),
        fmt(e.fecha_inicio),
        fmt(e.fecha_fin),
        e.estado === 1 ? 'Activo' : 'Finalizado',
        String(e.actividades?.length ?? 0),
    ]);
    autoTable(doc, { ...tableStyles(C.skyDark), startY: y2, head: [evHeaders], body: evRows });

    // ── Página 3: Actividades ──────────────────────────────────────────────
    doc.addPage();
    let y3 = drawHeader(doc, 'ACTIVIDADES ACADÉMICAS', `${actividades.length} actividades registradas`);
    const actHeaders = ['#', 'Nombre', 'Tipo', 'Evento', 'Inicio', 'Fin', 'Horas', 'Inscritos'];
    const actRows = actividades.map((a, i) => [
        String(i + 1),
        trunc(a.nombre, 42),
        a.tipo || '—',
        trunc(a.evento?.nombre ?? '—', 32),
        fmt(a.fecha_inicio),
        fmt(a.fecha_fin),
        a.horas != null ? `${a.horas} h` : '—',
        String(a.inscripciones?.length ?? 0),
    ]);
    autoTable(doc, { ...tableStyles(C.emeraldDark), startY: y3, head: [actHeaders], body: actRows });

    drawFooters(doc);
    doc.save(`TYAN_Reporte_General_${timestamp()}.pdf`);
}

export function generarExcelGeneral(eventos: any[], actividades: any[]): void {
    const shEventos = eventos.map((e, i) => ({
        '#':                i + 1,
        'Nombre':           e.nombre       || '—',
        'Gestión':          e.gestion      || '—',
        'Ubicación':        e.ubicacion    || '—',
        'Dirección':        e.direccion    || '—',
        'Fecha Inicio':     fmt(e.fecha_inicio),
        'Fecha Fin':        fmt(e.fecha_fin),
        'Estado':           e.estado === 1 ? 'Activo' : 'Finalizado',
        'Actividades':      e.actividades?.length ?? 0,
        'Versión':          e.version      || '—',
        'Descripción':      e.descripcion  || '—',
    }));

    const shActiv = actividades.map((a, i) => ({
        '#':                i + 1,
        'Nombre':           a.nombre               || '—',
        'Tipo':             a.tipo                 || '—',
        'Evento':           a.evento?.nombre       || '—',
        'Fecha Inicio':     fmt(a.fecha_inicio),
        'Fecha Fin':        fmt(a.fecha_fin),
        'Horas':            a.horas != null ? a.horas : '—',
        'Inscritos':        a.inscripciones?.length ?? 0,
        'Descripción':      a.descripcion          || '—',
    }));

    const totalInscritos = actividades.reduce((acc, a) => acc + (a.inscripciones?.length ?? 0), 0);
    const resumen = [
        { 'Métrica': 'Total de Eventos',      'Valor': eventos.length },
        { 'Métrica': 'Eventos Activos',        'Valor': eventos.filter(e => e.estado === 1).length },
        { 'Métrica': 'Eventos Finalizados',    'Valor': eventos.filter(e => e.estado !== 1).length },
        { 'Métrica': 'Total de Actividades',   'Valor': actividades.length },
        { 'Métrica': 'Total de Inscritos',     'Valor': totalInscritos },
        { 'Métrica': 'Fecha del Reporte',      'Valor': new Date().toLocaleString('es-BO') },
    ];

    exportToExcel([
        { name: 'Eventos', rows: shEventos },
        { name: 'Actividades', rows: shActiv },
        { name: 'Resumen', rows: resumen }
    ], 'TYAN_Reporte_General');
}

// ============================================================
// HELPER EXCEL: Exportar a .xlsx con formato profesional
// ============================================================
function exportToExcel(sheets: { name: string; rows: any[] }[], fileName: string) {
    try {
        const wb = XLSX.utils.book_new();

        sheets.forEach(({ name, rows }) => {
            if (!rows || rows.length === 0) {
                rows = [{ 'Aviso': 'No hay datos registrados para esta sección.' }];
            }

            // 1. Crear datos con encabezado decorativo
            const metadata = [
                ['TYAN · SISTEMA DE GESTIÓN ACADÉMICA UMSA'],
                [`REPORTE: ${name.toUpperCase()}`],
                [`FECHA: ${new Date().toLocaleString('es-BO')}`],
                [] // Fila vacía de separación
            ];

            const dataHeaders = Object.keys(rows[0]);
            const dataRows = rows.map(r => dataHeaders.map(h => r[h] ?? '—'));
            
            const finalData = [...metadata, dataHeaders, ...dataRows];
            const ws = XLSX.utils.aoa_to_sheet(finalData);

            // 4. Configuración de anchos de columna dinámicos
            const colWidths = dataHeaders.map((header, colIdx) => {
                const maxLen = Math.max(
                    header.length,
                    ...dataRows.map(row => String(row[colIdx] ?? '').length)
                );
                return { wch: Math.min(maxLen + 4, 30) }; // Padding de 4, max 30 para evitar columnas gigantes
            });
            ws['!cols'] = colWidths;

            // 3. Unir celdas para el título
            ws['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: dataHeaders.length - 1 } },
                { s: { r: 1, c: 0 }, e: { r: 1, c: dataHeaders.length - 1 } },
                { s: { r: 2, c: 0 }, e: { r: 2, c: dataHeaders.length - 1 } }
            ];

            XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
        });

        XLSX.writeFile(wb, `${fileName}_${timestamp()}.xlsx`);
    } catch (err) {
        console.error('Error crítico en exportToExcel:', err);
    }
}


