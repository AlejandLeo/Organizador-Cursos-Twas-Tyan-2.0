import { Injectable, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHmac } from 'crypto';
import { Certificado } from './entities/certificado.entity';
import { MailService } from '../../Comun/mail/mail.service';
import { CertificadosService } from './certificados.service';
import jsPDF from 'jspdf';
import * as fs from 'fs';
import { join } from 'path';

@Injectable()
export class CertificadosEnvioService {
  private readonly logger = new Logger(CertificadosEnvioService.name);

  constructor(
    @InjectRepository(Certificado)
    private readonly certificadoRepository: Repository<Certificado>,
    private readonly mailService: MailService,
    @Inject(forwardRef(() => CertificadosService))
    private readonly certificadosService: CertificadosService,
  ) {}

  /**
   * Genera y envía un certificado individual.
   * Calcula el HMAC-SHA256 real del PDF y lo persiste en DB antes de enviar.
   */
  async enviarCertificadoIndividual(id: number) {
    const cert = await this.certificadoRepository.findOne({
      where: { id },
      relations: [
        'usuario',
        'usuario.persona',
        'infoCertificado',
        'actividadAcademica',
        'actividadAcademica.evento',
      ],
    });

    if (!cert) throw new NotFoundException(`Certificado ${id} no encontrado.`);

    // Validar Fase del Evento (Solo fase >= 4: Finalizado o Archivado)
    const faseEvento = cert.actividadAcademica.evento.fase;
    if (faseEvento < 4) {
      const errorMsg = `No se puede enviar el certificado. El evento '${cert.actividadAcademica.evento.nombre}' aún no ha finalizado (Fase actual: ${faseEvento}).`;
      this.logger.warn(errorMsg);
      await this.certificadoRepository.update(id, {
        estado_envio: 'error',
        log_error_envio: errorMsg,
        fecha_ultimo_envio: new Date(),
        reintentos: cert.reintentos + 1,
      });
      throw new Error(errorMsg);
    }

    try {
      // 1. Generar el PDF en memoria
      const pdfBuffer = await this.generarBufferPDF(cert);

      // 2. Calcular HMAC-SHA256 real del contenido del PDF
      const hmacSecret = process.env.CERT_HMAC_SECRET || 'default_insecure_secret';
      const hashIntegridad = createHmac('sha256', hmacSecret)
        .update(pdfBuffer)
        .digest('hex');

      // 3. Persistir el hash ANTES de enviar (garantía de integridad)
      await this.certificadoRepository.update(id, { hash_integridad: hashIntegridad });
      this.logger.log(`[HMAC] Certificado #${id} → hash calculado y persistido.`);

      // 4. Preparar datos del correo
      const nombreUsuario = cert.usuario.persona
        ? `${cert.usuario.persona.nombres} ${cert.usuario.persona.primer_apellido}`
        : 'Estudiante';

      const email = cert.usuario.email;
      const asunto = `Tu Certificado: ${cert.actividadAcademica.nombre}`;

      const tiposMap: Record<number, string> = {
        1: 'Asistente',
        2: 'Expositor',
        3: 'Organizador',
        4: 'Docente',
      };
      const tipoLabel = tiposMap[cert.tipo] ?? 'Participante';

      // 5. Enviar correo con PDF adjunto
      await this.mailService.sendMail(
        email,
        asunto,
        'certificate-delivery',
        {
          name: nombreUsuario,
          actividad: cert.actividadAcademica.nombre,
          evento: cert.actividadAcademica.evento.nombre,
          codigo: cert.codigo_certificado,
          tipo: tipoLabel,
          verifyUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verificar/${cert.codigo_certificado}`,
          anio: new Date().getFullYear(),
        },
        undefined,
        [
          {
            filename: `Certificado_${cert.codigo_certificado}.pdf`,
            content: pdfBuffer,
          },
        ],
      );

      // 6. Actualizar estado en DB → éxito
      await this.certificadoRepository.update(id, {
        estado_envio: 'enviado',
        fecha_ultimo_envio: new Date(),
        log_error_envio: null,
      });

      this.logger.log(`✓ Certificado #${id} enviado con éxito a ${email}`);
    } catch (error) {
      // 7. Registrar fallo en DB
      const certActual = await this.certificadoRepository.findOne({
        where: { id },
        select: ['reintentos'],
      });
      await this.certificadoRepository.update(id, {
        estado_envio: 'error',
        log_error_envio: error.message,
        fecha_ultimo_envio: new Date(),
        reintentos: (certActual?.reintentos ?? 0) + 1,
      });
      throw error;
    }
  }

  /**
   * Reconstruye el PDF en memoria usando jsPDF.
   * Lee cabecera, tenor y configuración de posición desde InfoCertificado.
   */
  private async generarBufferPDF(cert: Certificado): Promise<Buffer> {
    const info = cert.infoCertificado;
    if (!info) throw new Error('No hay plantilla configurada para este certificado.');

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // 1. Dibujar imagen de fondo si existe
    if (info.fondo_url) {
      try {
        const localFondoPath = join(process.cwd(), 'uploads', 'fondos', info.fondo_url);
        if (fs.existsSync(localFondoPath)) {
          const ext = (localFondoPath.split('.').pop() || 'JPG').toUpperCase();
          const imgData = fs.readFileSync(localFondoPath).toString('base64');
          doc.addImage(imgData, ext as any, 0, 0, pageWidth, pageHeight);
        }
      } catch (err) {
        this.logger.warn(`No se pudo cargar la imagen de fondo: ${err.message}`);
      }
    }

    // 2. Cargar firmantes del evento para mapeo rápido
    const id_evento = cert.actividadAcademica?.evento?.id;
    let firmantes: any[] = [];
    if (id_evento) {
      try {
        firmantes = await this.certificadosService.obtenerFirmantesEvento(id_evento);
      } catch (err) {
        this.logger.error(`Error al obtener firmantes para PDF: ${err.message}`);
      }
    }
    const firmantesMap = new Map<number, any>();
    for (const f of firmantes) {
      firmantesMap.set(f.id_usuario, f);
    }

    // 3. Procesar elementos del lienzo
    let elementos: any[] = [];
    if (info.configuracion) {
      try {
        elementos = typeof info.configuracion === 'string'
          ? JSON.parse(info.configuracion)
          : info.configuracion;
      } catch (e) {
        elementos = [];
      }
    }

    const studentName = `${cert.usuario.persona?.nombres ?? ''} ${cert.usuario.persona?.primer_apellido ?? ''} ${cert.usuario.persona?.segundo_apellido ?? ''}`.trim().toUpperCase();
    const courseName = (cert.actividadAcademica?.nombre || '').toUpperCase();
    const certCode = cert.codigo_certificado || '';

    // Si existen elementos definidos en el lienzo, realizamos renderizado 100% dinámico
    if (Array.isArray(elementos) && elementos.length > 0) {
      for (const el of elementos) {
        // Conversión matemática perfecta de porcentaje canvas a milímetros PDF
        const mmX = (el.x / 100) * pageWidth;
        const mmY = (el.y / 100) * pageHeight;
        const mmW = el.width ? el.width * (pageWidth / 1123) : undefined;
        const mmH = el.height ? el.height * (pageHeight / 794) : undefined;

        // Color del texto
        if (el.color) {
          try {
            const hex = el.color.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16) || 0;
            const g = parseInt(hex.substring(2, 4), 16) || 0;
            const b = parseInt(hex.substring(4, 6), 16) || 0;
            doc.setTextColor(r, g, b);
          } catch (e) {
            doc.setTextColor(0, 0, 0);
          }
        } else {
          doc.setTextColor(0, 0, 0);
        }

        // Fuente
        doc.setFontSize(el.fontSize || 14);
        if (el.fontFamily === 'Courier New') {
          doc.setFont('courier');
        } else if (el.fontFamily === 'Times New Roman') {
          doc.setFont('times');
        } else {
          doc.setFont('helvetica');
        }

        if (el.tipo === 'texto') {
          let val = el.valor || '';
          val = val.replace('{NOMBRE_ESTUDIANTE}', studentName);
          val = val.replace('{NOMBRE_CURSO}', courseName);
          val = val.replace('{CODIGO_CERTIFICADO}', certCode);
          doc.text(val, mmX, mmY);
        } 
        else if (el.tipo === 'cabecera') {
          let val = info.cabecera || el.valor || '';
          val = val.replace('{NOMBRE_ESTUDIANTE}', studentName);
          val = val.replace('{NOMBRE_CURSO}', courseName);
          val = val.replace('{CODIGO_CERTIFICADO}', certCode);
          doc.text(val, mmX, mmY, { align: 'center', maxWidth: mmW || 200 });
        } 
        else if (el.tipo === 'tenor') {
          let val = info.tenor || el.valor || '';
          val = val.replace('{NOMBRE_ESTUDIANTE}', studentName);
          val = val.replace('{NOMBRE_CURSO}', courseName);
          val = val.replace('{CODIGO_CERTIFICADO}', certCode);
          val = val.replace('[NOMBRE]', studentName);
          val = val.replace('[ACTIVIDAD]', courseName);
          val = val.replace('[CODIGO]', certCode);
          doc.text(val, mmX, mmY, { align: 'center', maxWidth: mmW || 200 });
        }
        else if (el.tipo === 'qr') {
          // Generar código QR dinámico real
          const verificationUrl = `http://localhost:3000/api/certificados/verificar/${certCode}`;
          let qrDrawn = false;
          try {
            const qrRes = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}`);
            if (qrRes.ok) {
              const buffer = await qrRes.arrayBuffer();
              const base64Img = Buffer.from(buffer).toString('base64');
              doc.addImage(base64Img, 'PNG', mmX, mmY, mmW || 30, mmH || 30);
              qrDrawn = true;
            }
          } catch (fetchErr) {
            this.logger.warn(`No se pudo obtener QR online: ${fetchErr.message}. Usando fallback local.`);
          }

          // Fallback en caso de que esté offline o falle el API
          if (!qrDrawn) {
            doc.setFillColor(245, 245, 245);
            doc.setDrawColor(200, 200, 200);
            doc.rect(mmX, mmY, mmW || 30, mmH || 30, 'FD');
            doc.setFontSize(6);
            doc.setTextColor(100, 100, 100);
            doc.text("VERIFICAR QR", mmX + (mmW || 30) / 2, mmY + 10, { align: 'center' });
            doc.text(certCode, mmX + (mmW || 30) / 2, mmY + 20, { align: 'center' });
          }
        }
        else if (el.tipo === 'firma') {
          // Bloque dinámico multi-firmas (código heredado)
          if (firmantes && firmantes.length > 0) {
            const blockY = mmY;
            const blockX = mmX;
            const firmaWidth = 40;
            const firmaHeight = 20;
            const spaceBetween = 10;
            const totalWidth = (firmantes.length * firmaWidth) + ((firmantes.length - 1) * spaceBetween);
            
            let currentX = blockX - (totalWidth / 2) + (firmaWidth / 2);
            
            for (const f of firmantes) {
              try {
                const localPath = join(process.cwd(), 'uploads', 'firmas', f.firma_filename || f.firma_url.split('doc=')[1] || f.firma_url.split('/').pop());
                if (fs.existsSync(localPath)) {
                  const ext = (localPath.split('.').pop() || 'PNG').toUpperCase();
                  const imgData = fs.readFileSync(localPath).toString('base64');
                  doc.addImage(imgData, ext as any, currentX - (firmaWidth / 2), blockY - firmaHeight, firmaWidth, firmaHeight);
                }
              } catch (imgError) {
                this.logger.warn(`No se pudo cargar la imagen de firma para ${f.nombre}: ${imgError.message}`);
              }
              
              doc.setLineWidth(0.2);
              doc.setDrawColor(0, 0, 0);
              doc.line(currentX - 20, blockY + 2, currentX + 20, blockY + 2);
              
              doc.setFontSize(8);
              doc.setTextColor(0, 0, 0);
              const nombreLinea = f.grado ? `${f.grado} ${f.nombre}` : f.nombre;
              doc.text(nombreLinea, currentX, blockY + 6, { align: 'center' });
              
              doc.setFontSize(7);
              doc.setTextColor(100, 100, 100);
              doc.text(f.rol, currentX, blockY + 10, { align: 'center' });
              
              currentX += firmaWidth + spaceBetween;
            }
          }
        }
        else if (el.tipo === 'firma_individual') {
          // Firma individual arrastrada y configurada en el lienzo
          const f = firmantesMap.get(el.id_usuario);
          if (f) {
            try {
              const localPath = join(process.cwd(), 'uploads', 'firmas', f.firma_filename || f.firma_url.split('doc=')[1] || f.firma_url.split('/').pop());
              if (fs.existsSync(localPath)) {
                const ext = (localPath.split('.').pop() || 'PNG').toUpperCase();
                const imgData = fs.readFileSync(localPath).toString('base64');
                doc.addImage(imgData, ext as any, mmX - (mmW || 40) / 2, mmY - (mmH || 20), mmW || 40, mmH || 20);
              }
            } catch (imgError) {
              this.logger.warn(`No se pudo cargar firma para ${f.nombre}: ${imgError.message}`);
            }

            doc.setLineWidth(0.2);
            doc.setDrawColor(0, 0, 0);
            doc.line(mmX - 20, mmY + 2, mmX + 20, mmY + 2);

            doc.setFontSize(8);
            doc.setTextColor(0, 0, 0);
            const nombreLinea = f.grado ? `${f.grado} ${f.nombre}` : f.nombre;
            doc.text(nombreLinea, mmX, mmY + 6, { align: 'center' });

            doc.setFontSize(7);
            doc.setTextColor(100, 100, 100);
            doc.text(f.rol, mmX, mmY + 10, { align: 'center' });
          } else {
            doc.setLineWidth(0.2);
            doc.setDrawColor(0, 0, 0);
            doc.line(mmX - 20, mmY + 2, mmX + 20, mmY + 2);
            doc.setFontSize(8);
            doc.setTextColor(0, 0, 0);
            doc.text(el.valor || "Autoridad", mmX, mmY + 6, { align: 'center' });
          }
        }
      }
    } else {
      // ══════════════════════════════════════════════════════════
      // RENDERIZADO HEREDADO (BACKWARDS-COMPATIBILITY FALLBACK)
      // ══════════════════════════════════════════════════════════
      const config: any = info.configuracion || {};

      // Cabecera
      if (info.cabecera) {
        doc.setFontSize(24);
        doc.setTextColor(0, 0, 0);
        const x = config.cabecera?.x ?? pageWidth / 2;
        const y = config.cabecera?.y ?? 40;
        doc.text(info.cabecera, x, y, { align: 'center' });
      }

      // Tenor (cuerpo) con variables sustituidas
      if (info.tenor) {
        let texto = info.tenor;
        texto = texto.replace('[NOMBRE]', studentName);
        texto = texto.replace('[ACTIVIDAD]', courseName);
        texto = texto.replace('[CODIGO]', certCode);

        doc.setFontSize(14);
        const x = config.tenor?.x ?? pageWidth / 2;
        const y = config.tenor?.y ?? 80;
        doc.text(texto, x, y, { align: 'center', maxWidth: 200 });
      }

      // Inyectar Firmas Dinámicas
      if (config.firma) {
        try {
          if (firmantes && firmantes.length > 0) {
            const blockY = config.firma.y ?? pageHeight - 40;
            const blockX = config.firma.x ?? pageWidth / 2;
            const firmaWidth = 40;
            const firmaHeight = 20;
            const spaceBetween = 10;
            const totalWidth = (firmantes.length * firmaWidth) + ((firmantes.length - 1) * spaceBetween);
            
            let currentX = blockX - (totalWidth / 2) + (firmaWidth / 2);
            
            for (const f of firmantes) {
              try {
                const localPath = join(process.cwd(), 'uploads', 'firmas', f.firma_filename || f.firma_url.split('doc=')[1] || f.firma_url.split('/').pop());
                if (fs.existsSync(localPath)) {
                  const ext = (localPath.split('.').pop() || 'PNG').toUpperCase();
                  const imgData = fs.readFileSync(localPath).toString('base64');
                  doc.addImage(imgData, ext as any, currentX - (firmaWidth / 2), blockY - firmaHeight, firmaWidth, firmaHeight);
                }
              } catch (imgError) {
                this.logger.warn(`No se pudo cargar la imagen de firma para ${f.nombre}: ${imgError.message}`);
              }
              
              doc.setLineWidth(0.2);
              doc.setDrawColor(0, 0, 0);
              doc.line(currentX - 20, blockY + 2, currentX + 20, blockY + 2);
              
              doc.setFontSize(8);
              doc.setTextColor(0, 0, 0);
              const nombreLinea = f.grado ? `${f.grado} ${f.nombre}` : f.nombre;
              doc.text(nombreLinea, currentX, blockY + 6, { align: 'center' });
              
              doc.setFontSize(7);
              doc.setTextColor(100, 100, 100);
              doc.text(f.rol, currentX, blockY + 10, { align: 'center' });
              
              currentX += firmaWidth + spaceBetween;
            }
          }
        } catch (err) {
          this.logger.error(`Error al procesar bloque de firmas heredado: ${err.message}`);
        }
      }
    }

    // Pie de página: código de verificación
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`Código de Verificación: ${cert.codigo_certificado}`, 10, pageHeight - 10);

    const arrayBuffer = doc.output('arraybuffer');
    return Buffer.from(arrayBuffer);
  }
}
