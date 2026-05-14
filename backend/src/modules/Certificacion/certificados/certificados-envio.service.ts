import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificado } from './entities/certificado.entity';
import { MailService } from '../../Comun/mail/mail.service';
import jsPDF from 'jspdf';

@Injectable()
export class CertificadosEnvioService {
  private readonly logger = new Logger(CertificadosEnvioService.name);

  constructor(
    @InjectRepository(Certificado)
    private readonly certificadoRepository: Repository<Certificado>,
    private readonly mailService: MailService,
  ) {}

  /**
   * Envía un lote de certificados por correo electrónico.
   * Procesa con un pequeño delay para no saturar el SMTP.
   */
  async enviarLoteMasivo(ids: number[]) {
    this.logger.log(`Iniciando envío masivo de ${ids.length} certificados.`);
    let exitosos = 0;
    let fallidos = 0;

    for (const id of ids) {
      try {
        await this.enviarCertificadoIndividual(id);
        exitosos++;
        // Pequeño delay de 500ms entre correos para evitar bloqueos
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        this.logger.error(`Error en envío masivo para Certificado ${id}: ${error.message}`);
        fallidos++;
      }
    }

    return {
      mensaje: `Proceso finalizado. Éxitos: ${exitosos}, Fallos: ${fallidos}`,
      exitosos,
      fallidos,
    };
  }

  /**
   * Genera y envía un certificado individual.
   */
  async enviarCertificadoIndividual(id: number) {
    const cert = await this.certificadoRepository.findOne({
      where: { id },
      relations: ['usuario', 'usuario.persona', 'infoCertificado', 'actividadAcademica', 'actividadAcademica.evento'],
    });

    if (!cert) throw new NotFoundException(`Certificado ${id} no encontrado.`);

    // Validar Fase del Evento (Solo permitir fase 4: Finalizado o 5: Archivado)
    const faseEvento = cert.actividadAcademica.evento.fase;
    if (faseEvento < 4) {
      const errorMsg = `No se puede enviar el certificado. El evento '${cert.actividadAcademica.evento.nombre}' aún no ha finalizado (Fase actual: ${faseEvento}).`;
      this.logger.warn(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      // 1. Generar el PDF en memoria
      const pdfBuffer = await this.generarBufferPDF(cert);

      // 2. Preparar el correo
      const nombreUsuario = cert.usuario.persona 
        ? `${cert.usuario.persona.nombres} ${cert.usuario.persona.primer_apellido}`
        : 'Estudiante';
      
      const email = cert.usuario.email;
      const asunto = `Tu Certificado: ${cert.actividadAcademica.nombre}`;

      // 3. Enviar
      await this.mailService.sendMail(
        email,
        asunto,
        'certificate-delivery', // Template que debemos crear o usar uno genérico
        {
          name: nombreUsuario,
          actividad: cert.actividadAcademica.nombre,
          evento: cert.actividadAcademica.evento.nombre,
          codigo: cert.codigo_certificado,
        },
        undefined,
        [
          {
            filename: `Certificado_${cert.codigo_certificado}.pdf`,
            content: pdfBuffer,
          }
        ]
      );

      // 4. Actualizar estado en DB
      await this.certificadoRepository.update(id, {
        estado_envio: 'enviado',
        fecha_ultimo_envio: new Date(),
        log_error_envio: null,
      });

      this.logger.log(`Certificado ${id} enviado con éxito a ${email}`);
    } catch (error) {
      // 5. Registrar fallo
      await this.certificadoRepository.update(id, {
        estado_envio: 'error',
        log_error_envio: error.message,
        fecha_ultimo_envio: new Date(),
        reintentos: cert.reintentos + 1,
      });
      throw error;
    }
  }

  /**
   * Lógica para reconstruir el PDF usando jsPDF en el servidor.
   * Utiliza la 'configuracion' JSON guardada en InfoCertificado.
   */
  private async generarBufferPDF(cert: Certificado): Promise<Buffer> {
    const info = cert.infoCertificado;
    if (!info) throw new Error('No hay plantilla configurada para este certificado.');

    // Configuración por defecto si no existe JSON
    const config = info.configuracion || {};
    
    // Crear documento A4 Landscape (lo más común en certificados)
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // 1. Dibujar Fondo (si existe)
    // Nota: Para fondos externos, jsPDF en Node necesita que la imagen esté en base64 o buffer local.
    // Por ahora haremos una implementación de texto básica que respeta las posiciones.

    // 2. Dibujar Cabecera
    if (info.cabecera) {
      doc.setFontSize(24);
      doc.setTextColor(0, 0, 0);
      const x = config.cabecera?.x || pageWidth / 2;
      const y = config.cabecera?.y || 40;
      doc.text(info.cabecera, x, y, { align: 'center' });
    }

    // 3. Dibujar Tenor (Cuerpo)
    if (info.tenor) {
      let texto = info.tenor;
      // Reemplazar variables
      texto = texto.replace('[NOMBRE]', `${cert.usuario.persona?.nombres} ${cert.usuario.persona?.primer_apellido}`);
      texto = texto.replace('[ACTIVIDAD]', cert.actividadAcademica.nombre);
      texto = texto.replace('[CODIGO]', cert.codigo_certificado);

      doc.setFontSize(14);
      const x = config.tenor?.x || pageWidth / 2;
      const y = config.tenor?.y || 80;
      doc.text(texto, x, y, { align: 'center', maxWidth: 200 });
    }

    // 4. Código de Verificación (Esquina inferior)
    doc.setFontSize(8);
    doc.text(`ID de Verificación: ${cert.codigo_certificado}`, 10, pageHeight - 10);

    // Retornar como Buffer para nodemailer
    const arrayBuffer = doc.output('arraybuffer');
    return Buffer.from(arrayBuffer);
  }
}
