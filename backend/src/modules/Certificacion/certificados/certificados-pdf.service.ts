import { Injectable, NotFoundException } from '@nestjs/common';
import { CertificadosService } from './certificados.service';
import { jsPDF } from 'jspdf';
import * as QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CertificadosPdfService {
  constructor(private readonly certificadosService: CertificadosService) {}

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
      format: 'letter' // 792 x 612 pt
    });

    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();

    // Información del beneficiario
    const persona = certificado.usuario?.persona;
    const nombreCompleto = persona 
      ? `${persona.nombres} ${persona.primer_apellido} ${persona.segundo_apellido || ''}`.trim()
      : 'Usuario Desconocido';
    const ciUsuario = persona?.documento_identidad || '';

    // Información del Evento
    const eventoNombre = certificado.actividadAcademica?.evento?.nombre || (certificado.actividadAcademica as any)?.nombre || 'Evento Desconocido';
    
    const tiposStr = { 1: 'Asistente', 2: 'Ponente', 3: 'Logística', 4: 'Docente' };
    const rolParticipacion = tiposStr[certificado.tipo] || 'Participante';

    const fechaEmision = certificado.fecha_emision 
      ? new Date(certificado.fecha_emision).toLocaleDateString('es-BO')
      : new Date().toLocaleDateString('es-BO');

    // Mapeo de variables dinámicas a sus valores reales
    const variablesReales: Record<string, string> = {
      '{NOMBRE_ESTUDIANTE}': persona?.nombres || '',
      '{PRIMER_APELLIDO}': persona?.primer_apellido || '',
      '{SEGUNDO_APELLIDO}': persona?.segundo_apellido || '',
      '{EVENTO}': eventoNombre,
      '{ACTIVIDAD}': (certificado.actividadAcademica as any)?.nombre || '',
      '{GESTION}': new Date().getFullYear().toString(),
      '{ROL}': rolParticipacion,
      '{CI_USUARIO}': ciUsuario,
      '{CARGA_HORARIA}': (certificado.actividadAcademica as any)?.horas?.toString() || '',
      '{FECHA_EMISION}': fechaEmision,
      '{NOTA_FINAL}': '', // Si aplica en el futuro
      '{CODIGO_CERTIFICADO}': certificado.codigo_certificado || '',
    };

    // --- Dibujar elementos ---
    for (const el of configuracion) {
      // Coordenadas relativas (%) a absolutas (pt)
      const x = (el.x / 100) * pdfWidth;
      const y = (el.y / 100) * pdfHeight;

      if (el.tipo === 'texto') {
        let textoFinal = el.valor || '';
        // Reemplazar variables dinámicas
        for (const [variable, valor] of Object.entries(variablesReales)) {
          if (textoFinal.includes(variable)) {
            textoFinal = textoFinal.replace(new RegExp(variable, 'g'), valor);
          }
        }
        
        doc.setFontSize(el.fontSize || 12);
        // Si el color viene en hex, jsPDF lo soporta usando text(..., {color: '#hex'}) en versiones recientes, o setTextColor
        if (el.color) {
           doc.setTextColor(el.color);
        } else {
           doc.setTextColor(0, 0, 0);
        }
        doc.text(textoFinal, x, y, { align: 'center' }); // Asumimos center para textos dinámicos por defecto, o left si lo requiere
      }
      else if (el.tipo === 'cabecera') {
        doc.setFontSize(el.fontSize || 16);
        doc.setTextColor(el.color || '#000000');
        doc.text(el.valor || '', x, y, { align: 'center', maxWidth: el.width });
      }
      else if (el.tipo === 'tenor') {
        doc.setFontSize(el.fontSize || 12);
        doc.setTextColor(el.color || '#000000');
        doc.text(el.valor || '', x, y, { align: 'center', maxWidth: el.width });
      }
      else if (el.tipo === 'qr') {
        // Generar código QR apuntando a la URL pública de verificación
        // Reemplazar por process.env.FRONTEND_URL en un entorno real
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const urlVerificacion = `${frontendUrl}/verificar-certificado/${certificado.uuid_archivo}`;
        
        const qrDataUrl = await QRCode.toDataURL(urlVerificacion, {
          errorCorrectionLevel: 'H',
          margin: 1,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        });

        // Dibujar el QR en el PDF
        // el.width suele representar el ancho en px del canvas, lo mapeamos a pt
        const qrSize = el.width || 100;
        doc.addImage(qrDataUrl, 'PNG', x - (qrSize/2), y - (qrSize/2), qrSize, qrSize);
      }
      else if (el.tipo === 'firma') {
        const id_evento = certificado.actividadAcademica?.evento?.id;
        if (id_evento) {
          const firmantesRaw = await this.certificadosService.obtenerFirmantesEvento(id_evento);
          const firmantes = firmantesRaw.filter((f: any) => f.origen === 'coordinador');
          if (firmantes.length > 0) {
            const numFirmas = firmantes.length;
            const blockWidth = el.width || 400; // Ancho total del bloque dinámico
            const signatureWidth = 100;
            const signatureHeight = 50;
            const gap = (blockWidth - (numFirmas * signatureWidth)) / (numFirmas + 1);
            
            let currentX = (x - (blockWidth / 2)) + gap;
            
            for (const f of firmantes) {
              if (f.firma_filename) {
                const firmaPath = path.join(process.cwd(), 'uploads/firmas', f.firma_filename);
                if (fs.existsSync(firmaPath)) {
                  try {
                    const firmaBuffer = fs.readFileSync(firmaPath);
                    const base64Firma = `data:image/png;base64,${firmaBuffer.toString('base64')}`;
                    doc.addImage(base64Firma, 'PNG', currentX, y - signatureHeight, signatureWidth, signatureHeight);
                  } catch(e) {}
                }
              }
              doc.setLineWidth(1);
              doc.line(currentX, y + 2, currentX + signatureWidth, y + 2);
              
              doc.setFontSize(8);
              doc.text(`${f.grado || ''} ${f.nombre}`.trim(), currentX + (signatureWidth/2), y + 12, { align: 'center' });
              doc.setFontSize(7);
              doc.text(`${f.rol || 'Autoridad'}`.trim(), currentX + (signatureWidth/2), y + 22, { align: 'center' });
              
              currentX += signatureWidth + gap;
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
            const signatureWidth = el.width || 100;
            const signatureHeight = el.height || 50;
            
            if (f.firma_filename) {
              const firmaPath = path.join(process.cwd(), 'uploads/firmas', f.firma_filename);
              if (fs.existsSync(firmaPath)) {
                try {
                  const firmaBuffer = fs.readFileSync(firmaPath);
                  const base64Firma = `data:image/png;base64,${firmaBuffer.toString('base64')}`;
                  doc.addImage(base64Firma, 'PNG', x - (signatureWidth/2), y - signatureHeight, signatureWidth, signatureHeight);
                } catch(e) {}
              }
            }
            doc.setLineWidth(1);
            doc.line(x - (signatureWidth/2), y + 2, x + (signatureWidth/2), y + 2);
            doc.setFontSize(el.fontSize || 8);
            doc.text(`${f.grado || ''} ${f.nombre}`.trim(), x, y + 12, { align: 'center' });
            doc.setFontSize(Math.max(5, (el.fontSize || 8) - 1));
            doc.text(`${f.rol || 'Autoridad'}`.trim(), x, y + 22, { align: 'center' });
          }
        }
      }
    }

    const arrayBuffer = doc.output('arraybuffer');
    return Buffer.from(arrayBuffer);
  }
}
