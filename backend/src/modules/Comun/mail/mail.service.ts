import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailLog } from './entities/mail-log.entity';
import { MailerService } from '@nestjs-modules/mailer';
import { MailTemplate, MailTemplateType } from './entities/mail-template.entity';
import { SistemaConfigService } from '../sistema-config/sistema-config.service';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    @InjectRepository(MailLog)
    private readonly mailLogRepository: Repository<MailLog>,
    @InjectRepository(MailTemplate)
    private readonly mailTemplateRepository: Repository<MailTemplate>,
    private readonly mailerService: MailerService,
    private readonly sistemaConfigService: SistemaConfigService,
  ) {}

  /**
   * Envía un correo electrónico de forma síncrona.
   * Si el envío falla o se alcanza el límite diario, lanza una excepción.
   */
  async sendMail(
    to: string,
    subject: string,
    template?: string,
    context?: any,
    text?: string,
    attachments?: any[],
  ) {
    // 1. Control de Límite Diario (Para cuentas Free)
    const limit = parseInt(process.env.MAIL_DAILY_LIMIT || '100', 10);
    const countToday = await this.mailLogRepository.createQueryBuilder('log')
      .where('log.estado = :estado', { estado: 'enviado' })
      .andWhere('log.fecha_creacion >= CURRENT_DATE')
      .getCount();

    if (countToday >= limit) {
      this.logger.warn(`Límite diario de correos alcanzado (${countToday}/${limit}). Bloqueando envío a ${to}.`);
      throw new Error(`Servicio de mensajería temporalmente agotado (Límite diario alcanzado). Intente mañana o contacte a soporte.`);
    }

    // 2. Registrar intención de envío
    const logEntry = new MailLog();
    logEntry.destinatario = to;
    logEntry.asunto = subject;
    logEntry.template = template || undefined;
    logEntry.contexto = context ? JSON.stringify(context) : undefined;
    logEntry.estado = 'pendiente';

    const log = await this.mailLogRepository.save(logEntry);

    try {
      let info: any;

      if (template) {
        // Ruta con plantilla Handlebars — usa mailerService normalmente
        info = await this.mailerService.sendMail({
          to,
          subject,
          template,
          context,
          attachments,
        });
      } else {
        // Ruta con HTML pre-renderizado — saltamos el HandlebarsAdapter
        // porque está registrado como plugin de nodemailer y falla con template=undefined
        const transporter = (this.mailerService as any).transporter;
        info = await transporter.sendMail({
          to,
          subject,
          html: text || '',
          attachments,
        });
      }

      // 3. Éxito: Actualizar log
      await this.mailLogRepository.update(log.id, {
        estado: 'enviado',
        message_id: info.messageId,
        fecha_envio: new Date(),
      });

      this.logger.log(`Correo enviado correctamente a ${to}. [${countToday + 1}/${limit}] MessageId: ${info.messageId}`);
      return info;
    } catch (error) {
      // Logueamos el error para auditoría
      this.logger.error(`Error enviando correo a ${to}: ${error.message}`, error.stack);
      // NO relanzamos el error para evitar que los flujos de negocio (inscripciones, roles)
      // se rompan por un problema de conexión con el proveedor de correo.
      return null;
    }
  }




  /**
   * Envía correo de aprobación de cuenta con contraseña temporal.
   */
  async sendAccountApprovalEmail(to: string, name: string, tempPassword: string) {
    const nombres = name.split(' ')[0] || name; // Simplificación si viene el nombre completo
    return this.sendMailWithDbTemplate(
      MailTemplateType.WELCOME,
      to,
      'Solicitud de Acceso Aprobada',
      'admission', // Fallback
      { 
        nombre: nombres, // Usar 'nombre' como nombres para la nueva paleta
        nombres: nombres,
        email: to, 
        password: tempPassword,
        loginUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
        url_sistema: process.env.FRONTEND_URL || 'http://localhost:5173',
        year: new Date().getFullYear()
      },
    );
  }

  /**
   * Envía correo de reactivación de cuenta (sin cambio de clave).
   */
  async sendAccountReactivationEmail(to: string, name: string) {
    return this.sendMail(
      to,
      'Cuenta Reactivada',
      'reactivation',
      { 
        name, 
        loginUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
      },
    );
  }

  /**
   * Envía correo de rechazo de solicitud inicial.
   */
  async sendAccountRejectionEmail(to: string, name: string, reason?: string) {
    return this.sendMail(
      to,
      'Estado de tu Solicitud de Acceso',
      'rejection',
      { name, reason },
    );
  }

  /**
   * Envía correo de cuenta desactivada (para cuentas que ya estaban activas).
   */
  async sendAccountDeactivationEmail(to: string, name: string) {
    return this.sendMail(
      to,
      'Cuenta Desactivada',
      'deactivation',
      { name },
    );
  }


  /**
   * Envía correo de confirmación de inscripción.
   */
  async sendEnrollmentConfirmedEmail(to: string, name: string, actividad: string, evento: string) {
    return this.sendMail(
      to,
      'Inscripción Confirmada',
      'enrollment-confirmed',
      { name, actividad, evento },
    );
  }

  /**
   * Envía correo de rechazo/observación de inscripción.
   */
  async sendEnrollmentRejectedEmail(to: string, name: string, actividad: string, reason?: string) {
    return this.sendMail(
      to,
      'Actualización de tu Inscripción',
      'enrollment-rejected',
      { name, actividad, reason },
    );
  }

  /**
   * Envía correo de bienvenida tras el registro exitoso.
   */
  async sendWelcomeRegistrationEmail(to: string, nombres: string, primer_apellido: string, segundo_apellido: string = '') {
    return this.sendMailWithDbTemplate(
      MailTemplateType.WELCOME,
      to,
      '¡Bienvenido a la Plataforma!',
      'welcome-registration',
      { 
        nombre: nombres,
        nombres: nombres,
        primer_apellido,
        segundo_apellido,
        email: to,
        loginUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
        url_sistema: process.env.FRONTEND_URL || 'http://localhost:5173',
        year: new Date().getFullYear()
      },
    );
  }

  async sendWelcomeEmail(to: string, name: string) {
    return this.sendMail(
      to,
      'Bienvenido a la Plataforma',
      'welcome',
      { name },
      `Hola ${name}, bienvenido a nuestra plataforma.`,
    );
  }

  /**
   * Notifica a un usuario que se le ha asignado un nuevo rol (ej: Logística).
   */
  async sendRoleDesignationEmail(to: string, name: string, roleName: string) {
    return this.sendMail(
      to,
      'Nueva Designación de Cargo',
      'role-designation',
      { 
        name, 
        role: roleName,
        loginUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
      },
    );
  }

  /**
   * Notifica cambios detallados en los roles del usuario.
   */
  async sendRoleUpdateEmail(to: string, name: string, addedRoles: string[], removedRoles: string[]) {
    return this.sendMail(
      to,
      'Actualización de Permisos en la Plataforma',
      'role-update',
      { 
        name, 
        addedRoles, 
        removedRoles,
        loginUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
        currentYear: new Date().getFullYear()
      },
    );
  }

  // ── Helper para enviar usando plantillas de DB ─────────────────────────────

  /**
   * Envía un correo buscando primero una plantilla activa en la BD.
   * Si no la encuentra, utiliza el template fallback (archivo .hbs).
   * Puede usarse pasando un ID de plantilla específico.
   */
  async sendMailWithDbTemplate(
    tipo: MailTemplateType,
    to: string,
    fallbackSubject: string,
    fallbackTemplateName: string,
    context: any,
    specificTemplateId?: number,
    attachments?: any[]
  ) {
    let dbTemplate: MailTemplate | null = null;

    if (specificTemplateId) {
      dbTemplate = await this.mailTemplateRepository.findOne({ where: { id: specificTemplateId } });
    } else {
      // Buscar la plantilla activa para este tipo
      dbTemplate = await this.mailTemplateRepository.findOne({
        where: { tipo, activo: true },
        order: { fecha_creacion: 'DESC' }
      });
    }

    if (dbTemplate && dbTemplate.cuerpo) {
      // 1. Obtener Master Layout
      const masterLayout = await this.sistemaConfigService.getConfig('MAIL_MASTER_LAYOUT') || '<html><body>{{{content}}}</body></html>';
      
      // 2. Reemplazar variables en el cuerpo de la plantilla
      let htmlCuerpo = dbTemplate.cuerpo.replace(/\n/g, '<br>');
      Object.keys(context).forEach(k => {
        const value = context[k] !== undefined && context[k] !== null ? String(context[k]) : '';
        htmlCuerpo = htmlCuerpo.replace(new RegExp(`{{${k}}}`, 'g'), value);
      });

      // 3. Reemplazar variables en el layout maestro (como cabecera y year)
      const cabeceraText = dbTemplate.cabecera || 'Plataforma Académica'; // Fallback a texto genérico si no hay cabecera en DB
      const yearStr = new Date().getFullYear().toString();
      
      // Reemplazamos el título estático "Plataforma Académica" (si existe en el layout por defecto) por el título dinámico
      let finalHtml = masterLayout.replace('Plataforma Académica', cabeceraText);
      // Reemplazamos la etiqueta {{{content}}} y el año
      finalHtml = finalHtml.replace('{{{content}}}', htmlCuerpo).replace('{{year}}', yearStr);

      // 4. Reemplazar variables en el asunto
      let asunto = dbTemplate.asunto || fallbackSubject;
      Object.keys(context).forEach(k => {
        const value = context[k] !== undefined && context[k] !== null ? String(context[k]) : '';
        asunto = asunto.replace(new RegExp(`{{${k}}}`, 'g'), value);
      });

      return this.sendMail(to, asunto, undefined, undefined, finalHtml, attachments);
    }

    // Fallback al sistema anterior basado en archivos .hbs
    return this.sendMail(to, fallbackSubject, fallbackTemplateName, context, undefined, attachments);
  }
}
