import { Injectable, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHmac } from 'crypto';
import { Certificado } from './entities/certificado.entity';
import { MailService } from '../../Comun/mail/mail.service';
import { MailTemplateType } from '../../Comun/mail/entities/mail-template.entity';
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
  async enviarCertificado(id: number, idTemplate?: number) {
    const cert = await this.certificadoRepository.findOne({
      where: { id },
      relations: [
        'usuario',
        'usuario.persona',
        'usuario.afiliaciones',
        'infoCertificado',
        'actividadAcademica',
        'actividadAcademica.evento',
      ],
    });

    if (!cert) throw new NotFoundException(`Certificado ${id} no encontrado.`);

    // La validación de fase fue removida para homologar la lógica con la emisión,
    // permitiendo enviar certificados en cualquier fase del evento.

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

      // 5. Enviar correo con PDF adjunto usando el helper de dbTemplate
      const result = await this.mailService.sendMailWithDbTemplate(
        MailTemplateType.CERTIFICATE,
        email,
        asunto,
        'certificate-delivery',
        {
          nombre: nombreUsuario, // Usando nombre en lugar de name para ser consistentes con la paleta
          name: nombreUsuario,   // Para compatibilidad con la plantilla .hbs por defecto
          actividad: cert.actividadAcademica.nombre,
          evento: cert.actividadAcademica.evento.nombre,
          codigo: cert.codigo_certificado,
          tipo: tipoLabel,
          verifyUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verificar-certificado/${cert.uuid_archivo}`,
          anio: new Date().getFullYear(),
        },
        idTemplate, // Pasamos el ID de la plantilla específica
        [
          {
            filename: `Certificado_${cert.codigo_certificado}.pdf`,
            content: pdfBuffer,
          },
        ],
      );

      // Si result es null, significa que falló silenciosamente (o algo en sendMail devolvió null)
      if (result === null) {
        throw new Error('El proveedor SMTP no pudo enviar el correo (retornó null). Verifique la conexión SMTP.');
      }

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

    const nombres = (cert.usuario.persona?.nombres || '').toUpperCase().trim();
    const primerApellido = (cert.usuario.persona?.primer_apellido || '').toUpperCase().trim();
    const segundoApellido = (cert.usuario.persona?.segundo_apellido || '').toUpperCase().trim();
    const ciUsuario = (cert.usuario.persona?.documento_identidad || '').toUpperCase().trim();
    const grado = (cert.usuario.persona?.grado_academico || '').trim();
    
    // Nombres Apellido1 Apellido2
    const nombreCompleto2 = `${grado ? grado + ' ' : ''}${nombres} ${primerApellido} ${segundoApellido}`.replace(/\s+/g, ' ').trim();
    // Apellido1 Apellido2 Nombres
    const nombreCompleto1 = `${grado ? grado + ' ' : ''}${primerApellido} ${segundoApellido} ${nombres}`.replace(/\s+/g, ' ').trim();

    const studentName = nombreCompleto2; // Para compatibilidad
    
    const afiliacion = cert.usuario.afiliaciones?.[0];
    const areaTematica = (afiliacion?.area_tematica || '').toUpperCase().trim();
    const disciplinaCientifica = (afiliacion?.disciplina_cientifica || '').toUpperCase().trim();
    
    const courseName = (cert.actividadAcademica?.nombre || '').toUpperCase();
    const eventoNombre = (cert.actividadAcademica?.evento?.nombre || '').toUpperCase();
    const gestionEvento = cert.actividadAcademica?.evento?.gestion?.toString() || new Date().getFullYear().toString();
    
    const certCode = cert.codigo_certificado || '';
    const fechaEmision = cert.fecha_emision ? new Date(cert.fecha_emision).toLocaleDateString('es-BO') : new Date().toLocaleDateString('es-BO');
    
    const tipos = { 1: 'Asistente', 2: 'Expositor', 3: 'Organizador', 4: 'Docente' };
    const rol = (tipos[cert.tipo] || '').toUpperCase();

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

        // Fuente: jsPDF usa puntos (pt). El canvas usa píxeles (px). 1px = 0.75pt
        const fontSizePt = (el.fontSize || 14) * 0.75;
        doc.setFontSize(fontSizePt);
        if (el.fontFamily === 'Courier New') {
          doc.setFont('courier');
        } else if (el.fontFamily === 'Times New Roman') {
          doc.setFont('times');
        } else {
          doc.setFont('helvetica');
        }

        // Función auxiliar para reemplazar todas las variables dinámicas
        const replaceVars = (text: string) => {
          if (!text) return '';
          let res = text;
          // Formatos con corchetes (insensibles a mayúsculas)
          res = res.replace(/\[NOMBRE\]/gi, nombreCompleto2);
          res = res.replace(/\[NOMBRE_COMPLETO_1\]/gi, nombreCompleto1);
          res = res.replace(/\[NOMBRE_COMPLETO_2\]/gi, nombreCompleto2);
          res = res.replace(/\[ACTIVIDAD\]/gi, courseName);
          res = res.replace(/\[CODIGO\]/gi, certCode);
          res = res.replace(/\[FECHA\]/gi, fechaEmision);
          res = res.replace(/\[AREA_TEMATICA\]/gi, areaTematica);
          res = res.replace(/\[DISCIPLINA\]/gi, disciplinaCientifica);
          res = res.replace(/\[DISCIPLINA_CIENTIFICA\]/gi, disciplinaCientifica);
          
          // Formatos con llaves simples
          res = res.replace(/\{NOMBRE_ESTUDIANTE\}/gi, nombreCompleto2); // legacy
          res = res.replace(/\{NOMBRE_COMPLETO_1\}/gi, nombreCompleto1);
          res = res.replace(/\{NOMBRE_COMPLETO_2\}/gi, nombreCompleto2);
          res = res.replace(/\{NOMBRE\}/gi, nombreCompleto2);
          res = res.replace(/\{NOMBRES\}/gi, nombreCompleto2);
          res = res.replace(/\{PRIMER_APELLIDO\}/gi, primerApellido);
          res = res.replace(/\{SEGUNDO_APELLIDO\}/gi, segundoApellido);
          res = res.replace(/\{PRIMER APELLIDO\}/gi, primerApellido);
          res = res.replace(/\{SEGUNDO APELLIDO\}/gi, segundoApellido);
          res = res.replace(/\{PRIMER_APÉLLIDO\}/gi, primerApellido); // Por el typo reportado por el usuario
          res = res.replace(/\{CI_USUARIO\}/gi, ciUsuario);
          res = res.replace(/\{CI\}/gi, ciUsuario);
          
          res = res.replace(/\{NOMBRE_CURSO\}/gi, courseName);
          res = res.replace(/\{CURSO\}/gi, courseName);
          res = res.replace(/\{ACTIVIDAD\}/gi, courseName);
          res = res.replace(/\{EVENTO\}/gi, eventoNombre);
          res = res.replace(/\{GESTION\}/gi, gestionEvento);
          res = res.replace(/\{ROL\}/gi, rol);
          res = res.replace(/\{AREA_TEMATICA\}/gi, areaTematica);
          res = res.replace(/\{DISCIPLINA\}/gi, disciplinaCientifica);
          res = res.replace(/\{DISCIPLINA_CIENTIFICA\}/gi, disciplinaCientifica);
          
          res = res.replace(/\{CODIGO_CERTIFICADO\}/gi, certCode);
          res = res.replace(/\{CODIGO\}/gi, certCode);
          res = res.replace(/\{FECHA_EMISION\}/gi, fechaEmision);
          res = res.replace(/\{FECHA\}/gi, fechaEmision);
 
          // Formatos con llaves dobles
          res = res.replace(/\{\{NOMBRE_ESTUDIANTE\}\}/gi, nombreCompleto2);
          res = res.replace(/\{\{NOMBRE_COMPLETO_1\}\}/gi, nombreCompleto1);
          res = res.replace(/\{\{NOMBRE_COMPLETO_2\}\}/gi, nombreCompleto2);
          res = res.replace(/\{\{NOMBRE\}\}/gi, nombreCompleto2);
          res = res.replace(/\{\{NOMBRE_CURSO\}\}/gi, courseName);
          res = res.replace(/\{\{ACTIVIDAD\}\}/gi, courseName);
          res = res.replace(/\{\{CODIGO_CERTIFICADO\}\}/gi, certCode);
          res = res.replace(/\{\{AREA_TEMATICA\}\}/gi, areaTematica);
          res = res.replace(/\{\{DISCIPLINA\}\}/gi, disciplinaCientifica);
          res = res.replace(/\{\{DISCIPLINA_CIENTIFICA\}\}/gi, disciplinaCientifica);
          return res;
        };

        if (el.tipo === 'texto') {
          // En CSS el X,Y es la esquina superior izquierda. jsPDF text usa baseline por defecto.
          doc.text(replaceVars(el.valor || ''), mmX, mmY, { baseline: 'top' });
        } 
        else if (el.tipo === 'cabecera' || el.tipo === 'tenor') {
          // Si el texto está centrado, en jsPDF el X debe ser el centro real de la caja
          const w = mmW || 200;
          const centerX = mmX + (w / 2);
          doc.text(replaceVars(info[el.tipo] || el.valor || ''), centerX, mmY, { 
            align: 'center', 
            maxWidth: w,
            baseline: 'top' 
          });
        }
        else if (el.tipo === 'qr') {
          // Generar código QR dinámico real apuntando a la página frontend de verificación
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
          const verificationUrl = `${frontendUrl}/verificar-certificado/${cert.uuid_archivo}`;
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
