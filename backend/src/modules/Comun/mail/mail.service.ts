import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private mailerService: MailerService) {}

  /**
   * Envía un correo electrónico genérico.
   * @param to Destinatario
   * @param subject Asunto
   * @param template Nombre de la plantilla (opcional)
   * @param context Contexto para la plantilla (opcional)
   * @param text Texto plano (si no se usa plantilla)
   */
  async sendMail(
    to: string,
    subject: string,
    template?: string,
    context?: any,
    text?: string,
  ) {
    try {
      const options: any = {
        to,
        subject,
      };

      if (template) {
        options.template = template;
        options.context = context;
      } else {
        options.text = text || '';
      }

      const info = await this.mailerService.sendMail(options);
      this.logger.log(`Correo enviado exitosamente a ${to}. MessageId: ${info.messageId}`);
      return info;
    } catch (error) {
      this.logger.error(`Error enviando correo a ${to}: ${error.message}`, error.stack);
      throw error;
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
   * Envía correo de rechazo de cuenta.
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
   * Ejemplo de método para un correo de bienvenida.
   */
  async sendWelcomeEmail(to: string, name: string) {
    return this.sendMail(
      to,
      'Bienvenido a la Plataforma',
      'welcome', // Debe existir en src/modules/Comun/mail/templates/welcome.hbs
      { name },
      `Hola ${name}, bienvenido a nuestra plataforma.`,
    );
  }
}
