import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHmac } from 'crypto';
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

    const config = info.configuracion || {};

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

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
      texto = texto.replace(
        '[NOMBRE]',
        `${cert.usuario.persona?.nombres ?? ''} ${cert.usuario.persona?.primer_apellido ?? ''}`,
      );
      texto = texto.replace('[ACTIVIDAD]', cert.actividadAcademica.nombre);
      texto = texto.replace('[CODIGO]', cert.codigo_certificado);

      doc.setFontSize(14);
      const x = config.tenor?.x ?? pageWidth / 2;
      const y = config.tenor?.y ?? 80;
      doc.text(texto, x, y, { align: 'center', maxWidth: 200 });
    }

    // Pie de página: código de verificación
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`Código de Verificación: ${cert.codigo_certificado}`, 10, pageHeight - 10);

    const arrayBuffer = doc.output('arraybuffer');
    return Buffer.from(arrayBuffer);
  }
}
