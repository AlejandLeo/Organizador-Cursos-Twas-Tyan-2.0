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
