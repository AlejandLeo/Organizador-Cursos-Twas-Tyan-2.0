import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailLog } from './entities/mail-log.entity';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    @InjectRepository(MailLog)
    private readonly mailLogRepository: Repository<MailLog>,
    private readonly mailerService: MailerService,
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
      const options: any = { to, subject, attachments };
      if (template) {
        options.template = template;
        options.context = context;
      } else {
        options.text = text || '';
      }

      const info = await this.mailerService.sendMail(options);

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
    return this.sendMail(
      to,
      'Solicitud de Acceso Aprobada',
      'admission',
      { 
        name, 
        email: to, 
        password: tempPassword,
        loginUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
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
   * Notifica a administración sobre una nueva solicitud de cuenta pendiente.
   */
  async sendNewRegistrationRequestNotification(studentName: string, studentEmail: string) {
    // Usamos el mismo MAIL_USER como destino si no hay un admin email específico
    const adminEmail = process.env.MAIL_USER || 'coursemanagementsystemumsa@gmail.com';
    return this.sendMail(
      adminEmail,
      'Nueva Solicitud de Registro Pendiente',
      'admin-notification',
      { studentName, studentEmail },
    );
  }

  /**
   * Envía correo de bienvenida tras el registro exitoso.
   */
  async sendWelcomeRegistrationEmail(to: string, name: string) {
    return this.sendMail(
      to,
      '¡Bienvenido a la Plataforma!',
      'welcome-registration',
      { 
        name,
        loginUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
      },
    );
  }

  async sendWelcomeEmail(to: string, name: string) {
    return this.sendMail(
      to,
      'Bienvenido a la Plataforma',
      'welcome', // Debe existir en src/modules/Comun/mail/templates/welcome.hbs
      { name },
      `Hola ${name}, bienvenido a nuestra plataforma.`,
    );
  }

  async sendActivationRequestNotification(actividadNombre: string, coordinadorNombre: string, coordinadorEmail: string) {
    const adminEmail = process.env.MAIL_USER || 'coursemanagementsystemumsa@gmail.com';
    return this.sendMail(
      adminEmail,
      'Solicitud de Reactivación de Actividad',
      'activation-request',
      { 
        actividadNombre, 
        coordinadorNombre, 
        coordinadorEmail,
        fecha: new Date().toLocaleString()
      },
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
}
