import { Injectable, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHmac } from 'crypto';
import { Certificado } from './entities/certificado.entity';
import { MailService } from '../../Comun/mail/mail.service';
import { MailTemplateType } from '../../Comun/mail/entities/mail-template.entity';
import { CertificadosService } from './certificados.service';
import { CertificadosPdfService } from './certificados-pdf.service';

@Injectable()
export class CertificadosEnvioService {
  private readonly logger = new Logger(CertificadosEnvioService.name);

  constructor(
    @InjectRepository(Certificado)
    private readonly certificadoRepository: Repository<Certificado>,
    private readonly mailService: MailService,
    @Inject(forwardRef(() => CertificadosService))
    private readonly certificadosService: CertificadosService,
    private readonly pdfService: CertificadosPdfService,
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
      const pdfBuffer = await this.pdfService.generarPdfBuffer(cert.id, cert.usuario.id);

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

}
