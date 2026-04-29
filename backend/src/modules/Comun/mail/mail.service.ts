import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      secure: this.configService.get<boolean>('MAIL_SECURE') || false,
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });
  }

  async sendMail(to: string, subject: string, html: string) {
    try {
      const from = this.configService.get<string>('MAIL_FROM') || '"TYAN Sistema" <noreply@tyan.com>';
      await this.transporter.sendMail({
        from,
        to,
        subject,
        html,
      });
      return true;
    } catch (error) {
      console.error('Error enviando correo:', error);
      return false;
    }
  }

  async sendSolicitudRecibida(email: string, nombre: string) {
    const subject = 'Solicitud de Registro Recibida - TYAN';
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #0284c7;">Hola, ${nombre}</h2>
        <p>Hemos recibido correctamente tu solicitud de registro en el <b>Organizador de Cursos - TYAN</b>.</p>
        <p>Tu cuenta se encuentra actualmente en estado <b>Pendiente de Aprobación</b>. Nuestro equipo administrativo revisará tu documentación en los próximos días.</p>
        <p>Recibirás un nuevo correo una vez que tu cuenta haya sido validada.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">Este es un mensaje automático, por favor no respondas a este correo.</p>
      </div>
    `;
    return this.sendMail(email, subject, html);
  }

  async sendSolicitudAprobada(email: string, nombre: string) {
    const subject = '¡Tu cuenta ha sido aprobada! - TYAN';
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #059669;">¡Buenas noticias, ${nombre}!</h2>
        <p>Tu solicitud de registro ha sido <b>aprobada</b> exitosamente.</p>
        <p>Ya puedes acceder al sistema con tu correo electrónico y la contraseña que configuraste.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${this.configService.get<string>('FRONTEND_URL')}/login" 
             style="background-color: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Iniciar Sesión
          </a>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">Sistema Organizador de Cursos - TYAN</p>
      </div>
    `;
    return this.sendMail(email, subject, html);
  }

  async sendSolicitudRechazada(email: string, nombre: string, motivo: string) {
    const subject = 'Estado de tu solicitud de registro - TYAN';
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #dc2626;">Hola, ${nombre}</h2>
        <p>Te informamos que tu solicitud de registro ha sido <b>rechazada</b> por el siguiente motivo:</p>
        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #991b1b;">${motivo}</p>
        </div>
        <p>Si crees que esto es un error, por favor contacta con el administrador del sistema.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">Sistema Organizador de Cursos - TYAN</p>
      </div>
    `;
    return this.sendMail(email, subject, html);
  }
}
