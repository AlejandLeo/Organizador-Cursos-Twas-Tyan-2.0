import { Injectable, NotFoundException } from '@nestjs/common';
import { CertificadosService } from './certificados.service';
import { jsPDF } from 'jspdf';
import * as QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CertificadosPdfService {
  constructor(private readonly certificadosService: CertificadosService) { }

  /**
   * Genera el buffer del PDF dinámicamente al vuelo leyendo la configuración
   * de infoCertificado y estampa el QR en la posición indicada.
   */
  async generarPdfBuffer(certificadoId: number, usuarioId: number): Promise<Buffer> {
    // 1. Obtener el certificado cruzado con infoCertificado, usuario, evento, etc.
    const certificado = await this.certificadosService.findOne(certificadoId);

    if (!certificado) {
      throw new NotFoundException('Certificado no encontrado');
    }

    if (!certificado.infoCertificado || !certificado.infoCertificado.configuracion) {
      throw new NotFoundException('El certificado no tiene un diseño configurado en el Workplace.');
    }

    // Parseamos la configuración visual del certificado
    let configuracion: any[] = [];
    try {
      configuracion = typeof certificado.infoCertificado.configuracion === 'string'
        ? JSON.parse(certificado.infoCertificado.configuracion)
        : certificado.infoCertificado.configuracion;
    } catch (e) {
      configuracion = [];
    }

    // 2. Generar PDF
    const doc = new jsPDF({
      orientation: 'landscape', // Certificados horizontales por defecto
      unit: 'pt', // Usaremos puntos para que coincida con px/percentages
      format: 'letter', // 792 x 612 pt
      compress: true
    });

    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();

    // Dibujar imagen de fondo si existe
    const info = certificado.infoCertificado;
    if (info && info.fondo_url) {
      try {
        const fileName = info.fondo_url.split('?')[0].split('/').pop() || '';
        const localFondoPath = path.join(process.cwd(), 'uploads', 'fondos', fileName);
        if (fs.existsSync(localFondoPath)) {
          const ext = (localFondoPath.split('.').pop() || 'JPG').toUpperCase();
          const imgData = fs.readFileSync(localFondoPath).toString('base64');
          doc.addImage(imgData, ext as any, 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        } else {
          console.warn(`No se encontró la imagen de fondo localmente: ${localFondoPath}`);
        }
      } catch (err) {
        console.warn(`No se pudo cargar la imagen de fondo: ${err.message}`);
      }
    }

    // Información del beneficiario
    const persona = certificado.usuario?.persona;
    const grado = (persona?.grado_academico || '').trim();
    const nombres = (persona?.nombres || '').toUpperCase().trim();
    const primerApellido = (persona?.primer_apellido || '').toUpperCase().trim();
    const segundoApellido = (persona?.segundo_apellido || '').toUpperCase().trim();
    const ciUsuario = persona?.documento_identidad || '';

    // Nombres Apellido1 Apellido2
    const nombreCompleto2 = persona
      ? `${grado ? grado + ' ' : ''}${nombres} ${primerApellido} ${segundoApellido}`.replace(/\s+/g, ' ').trim()
      : 'Usuario Desconocido';
    // Apellido1 Apellido2 Nombres
    const nombreCompleto1 = persona
      ? `${grado ? grado + ' ' : ''}${primerApellido} ${segundoApellido} ${nombres}`.replace(/\s+/g, ' ').trim()
      : 'Usuario Desconocido';

    const nombresApellidosSinGrado = persona
      ? `${nombres} ${primerApellido} ${segundoApellido}`.replace(/\s+/g, ' ').trim()
      : 'Usuario Desconocido';
      
    const apellidosNombresSinGrado = persona
      ? `${primerApellido} ${segundoApellido} ${nombres}`.replace(/\s+/g, ' ').trim()
      : 'Usuario Desconocido';

    const afiliacion = certificado.usuario?.afiliaciones?.[0];
    const areaTematica = (afiliacion?.area_tematica || '').toUpperCase().trim();
    const disciplinaCientifica = (afiliacion?.disciplina_cientifica || '').toUpperCase().trim();

    // Información del Evento
    const eventoNombre = certificado.actividadAcademica?.evento?.nombre
      || certificado.infoCertificado?.evento?.nombre
      || (certificado.actividadAcademica as any)?.nombre
      || 'Evento Desconocido';

    const tiposStr = { 1: 'Asistente', 2: 'Ponente', 3: 'Logística', 4: 'Docente' };
    const rolParticipacion = tiposStr[certificado.tipo] || 'Participante';

    const fechaEmision = certificado.fecha_emision
      ? new Date(certificado.fecha_emision).toLocaleDateString('es-BO')
      : new Date().toLocaleDateString('es-BO');

    // Recuperar temática si es ponente o docente
    let tematica = '';
    const tipoNum = Number(certificado.tipo);
    if ((tipoNum === 2 || tipoNum === 4) && certificado.usuario) {
      const idActividad = certificado.actividadAcademica?.id;
      const idEvento = certificado.infoCertificado?.evento?.id || certificado.actividadAcademica?.evento?.id;
      tematica = await this.certificadosService.obtenerTematicaPonente(certificado.usuario.id, idActividad, idEvento);
    }

    // Mapeo de variables dinámicas a sus valores reales
    const variablesReales: Record<string, string> = {
      '{NOMBRE_ESTUDIANTE}': nombreCompleto2,
      '{NOMBRE_COMPLETO_1}': nombreCompleto1,
      '{NOMBRE_COMPLETO_2}': nombreCompleto2,
      '{NOMBRES_APELLIDOS_SIN_GRADO}': nombresApellidosSinGrado,
      '{APELLIDOS_NOMBRES_SIN_GRADO}': apellidosNombresSinGrado,
      '{NOMBRE}': nombreCompleto2,
      '{NOMBRES}': nombreCompleto2,
      '{PRIMER_APELLIDO}': primerApellido,
      '{SEGUNDO_APELLIDO}': segundoApellido,
      '{AREA_TEMATICA}': areaTematica,
      '{DISCIPLINA}': disciplinaCientifica,
      '{DISCIPLINA_CIENTIFICA}': disciplinaCientifica,
      '{EVENTO}': eventoNombre,
      '{ACTIVIDAD}': (certificado.actividadAcademica as any)?.nombre || '',
      '{GESTION}': new Date().getFullYear().toString(),
      '{ROL}': rolParticipacion,
      '{CI_USUARIO}': ciUsuario,
      '{CARGA_HORARIA}': (certificado.actividadAcademica as any)?.horas?.toString() || '',
      '{FECHA_EMISION}': fechaEmision,
      '{NOTA_FINAL}': '', // Si aplica en el futuro
      '{CODIGO_CERTIFICADO}': certificado.codigo_certificado || '',
      '{TEMATICA}': tematica || '',
    };

    // --- Dibujar elementos ---
    // El editor de Vue usa CSS donde x e y representan la esquina SUPERIOR IZQUIERDA del elemento.
    const CANVAS_W = 1024;
    const CANVAS_H = 724;

    for (const el of configuracion) {
      // x_left, y_top son las coordenadas (Top-Left) del contenedor en puntos del PDF
      const x_left = (el.x / 100) * pdfWidth;
      const y_top = (el.y / 100) * pdfHeight;

      if (el.tipo === 'texto') {
        let textoFinal = el.valor || '';
        // Reemplazar variables dinámicas usando split.join de forma segura
        for (const [variable, valor] of Object.entries(variablesReales)) {
          textoFinal = textoFinal.split(variable).join(valor);
          const varClean = variable.replace(/[\{\}]/g, '');
          textoFinal = textoFinal.split(`[${varClean}]`).join(valor);
          textoFinal = textoFinal.split(`{{${varClean}}}`).join(valor);
        }

        if (el.textTransform) {
          if (el.textTransform === 'uppercase') textoFinal = textoFinal.toUpperCase();
          else if (el.textTransform === 'lowercase') textoFinal = textoFinal.toLowerCase();
          else if (el.textTransform === 'capitalize') {
             textoFinal = textoFinal.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
          }
        }

        const fontSize = el.fontSize || 12;
        doc.setFontSize(fontSize);
        if (el.color) doc.setTextColor(el.color);
        else doc.setTextColor(0, 0, 0);

        // El texto ahora tiene width definido por defecto o se usa un máximo.
        const blockWidthPt = el.width ? (el.width / CANVAS_W) * pdfWidth : pdfWidth;
        const y_baseline = y_top + (fontSize * 0.8);

        let x_anchor = x_left;
        const align = el.alineacion || 'center';

        if (align === 'center') {
          x_anchor = x_left + (blockWidthPt / 2);
        } else if (align === 'right') {
          x_anchor = x_left + blockWidthPt;
        }

        const lines = doc.splitTextToSize(textoFinal, blockWidthPt);
        doc.text(lines, x_anchor, y_baseline, { align: align as any });
      }
      else if (el.tipo === 'cabecera' || el.tipo === 'tenor') {
        const fontSize = el.fontSize || (el.tipo === 'cabecera' ? 16 : 12);
        doc.setFontSize(fontSize);
        doc.setTextColor(el.color || '#000000');

        const y_baseline = y_top + (fontSize * 0.8);

        // En Vue, tienen un width específico (ej. 600px).
        // Calculamos el ancho en pt del PDF
        const blockWidthPt = el.width ? (el.width / CANVAS_W) * pdfWidth : pdfWidth;

        // En Vue, el texto se alinea DENTRO de esa caja.
        // Si la caja empieza en x_left y tiene de ancho blockWidthPt,
        // el centro absoluto para jsPDF está en x_left + blockWidthPt / 2
        let x_anchor = x_left;
        const align = el.alineacion || 'center';

        if (align === 'center') {
          x_anchor = x_left + (blockWidthPt / 2);
        } else if (align === 'right') {
          x_anchor = x_left + blockWidthPt;
        }

        let textoFinal = el.valor || '';
        // Reemplazar variables dinámicas usando split.join de forma segura
        for (const [variable, valor] of Object.entries(variablesReales)) {
          textoFinal = textoFinal.split(variable).join(valor);
          const varClean = variable.replace(/[\{\}]/g, '');
          textoFinal = textoFinal.split(`[${varClean}]`).join(valor);
          textoFinal = textoFinal.split(`{{${varClean}}}`).join(valor);
        }

        const lines = doc.splitTextToSize(textoFinal, blockWidthPt);
        doc.text(lines, x_anchor, y_baseline, { align: align as any });
      }
      else if (el.tipo === 'qr') {
        const frontendUrl = process.env.FRONTEND_URL;
        const urlVerificacion = `${frontendUrl}/verificar-certificado/${certificado.uuid_archivo}`;

        const qrDataUrl = await QRCode.toDataURL(urlVerificacion, {
          errorCorrectionLevel: 'H',
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' }
        });

        const qrSizePx = el.width || 100;
        // Convertimos el tamaño del QR de px a pt
        const qrSizePt = (qrSizePx / CANVAS_W) * pdfWidth;

        // x_left, y_top es la esquina superior izquierda. jsPDF addImage asume top-left por defecto!
        // No restamos el tamaño.
        doc.addImage(qrDataUrl, 'PNG', x_left, y_top, qrSizePt, qrSizePt);
      }
      else if (el.tipo === 'firma') {
        const id_evento = certificado.actividadAcademica?.evento?.id;
        if (id_evento) {
          const firmantesRaw = await this.certificadosService.obtenerFirmantesEvento(id_evento);
          const firmantes = firmantesRaw.filter((f: any) => f.origen === 'coordinador');
          if (firmantes.length > 0) {
            const numFirmas = firmantes.length;
            const blockWidthPx = el.width || 400; // Ancho total en px del editor
            const blockWidthPt = (blockWidthPx / CANVAS_W) * pdfWidth;

            const signatureWidthPx = 100;
            const signatureHeightPx = 50;
            const signatureWidthPt = (signatureWidthPx / CANVAS_W) * pdfWidth;
            const signatureHeightPt = (signatureHeightPx / CANVAS_H) * pdfHeight;

            const gapPt = (blockWidthPt - (numFirmas * signatureWidthPt)) / (numFirmas + 1);

            // x_left es el borde izquierdo del contenedor entero.
            let currentX = x_left + gapPt;
            // El contenedor mide 120px de alto en Vue. La firma se pone "al centro", la línea va abajo.
            // Digamos que la línea va al 80% del alto total de la caja.
            const boxHeightPx = 120;
            const boxHeightPt = (boxHeightPx / CANVAS_H) * pdfHeight;
            const lineY = y_top + (boxHeightPt * 0.8);

            for (const f of firmantes) {
              if (f.firma_filename) {
                const firmaPath = path.join(process.cwd(), 'uploads/firmas', f.firma_filename);
                if (fs.existsSync(firmaPath)) {
                  try {
                    const firmaBuffer = fs.readFileSync(firmaPath);
                    const base64Firma = `data:image/png;base64,${firmaBuffer.toString('base64')}`;
                    doc.addImage(base64Firma, 'PNG', currentX, lineY - signatureHeightPt, signatureWidthPt, signatureHeightPt);
                  } catch (e) { }
                }
              }
              doc.setLineWidth(1);
              doc.line(currentX, lineY, currentX + signatureWidthPt, lineY);

              doc.setFontSize(8);
              doc.text(`${f.grado || ''} ${f.nombre}`.trim(), currentX + (signatureWidthPt / 2), lineY + 12, { align: 'center' });
              doc.setFontSize(7);
              doc.text(`${f.rol || 'Autoridad'}`.trim(), currentX + (signatureWidthPt / 2), lineY + 22, { align: 'center' });

              currentX += signatureWidthPt + gapPt;
            }
          }
        }
      }
      else if (el.tipo === 'firma_individual') {
        const id_evento = certificado.actividadAcademica?.evento?.id;
        if (id_evento && el.id_usuario) {
          const firmantes = await this.certificadosService.obtenerFirmantesEvento(id_evento);
          const f = firmantes.find(firm => firm.id_usuario === el.id_usuario);
          if (f) {
            const signatureWidthPx = el.width || 100;
            const signatureWidthPt = (signatureWidthPx / CANVAS_W) * pdfWidth;
            const signatureHeightPx = el.height || 50;
            const signatureHeightPt = (signatureHeightPx / CANVAS_H) * pdfHeight;

            // La caja en Vue mide el.width x 120px. 
            const boxHeightPx = 120;
            const boxHeightPt = (boxHeightPx / CANVAS_H) * pdfHeight;
            const lineY = y_top + (boxHeightPt * 0.8);

            // La firma ocupa todo el ancho de x_left
            if (f.firma_filename) {
              const firmaPath = path.join(process.cwd(), 'uploads/firmas', f.firma_filename);
              if (fs.existsSync(firmaPath)) {
                try {
                  const firmaBuffer = fs.readFileSync(firmaPath);
                  const base64Firma = `data:image/png;base64,${firmaBuffer.toString('base64')}`;
                  doc.addImage(base64Firma, 'PNG', x_left, lineY - signatureHeightPt, signatureWidthPt, signatureHeightPt);
                } catch (e) { }
              }
            }
            doc.setLineWidth(1);
            doc.line(x_left, lineY, x_left + signatureWidthPt, lineY);

            doc.setFontSize(el.fontSize || 8);
            doc.text(`${f.grado || ''} ${f.nombre}`.trim(), x_left + (signatureWidthPt / 2), lineY + 12, { align: 'center' });
            doc.setFontSize(Math.max(5, (el.fontSize || 8) - 1));
            doc.text(`${f.rol || 'Autoridad'}`.trim(), x_left + (signatureWidthPt / 2), lineY + 22, { align: 'center' });
          }
        }
      }
    }

    const arrayBuffer = doc.output('arraybuffer');
    return Buffer.from(arrayBuffer);
  }
}
