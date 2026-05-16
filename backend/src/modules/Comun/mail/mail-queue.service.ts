import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { MailQueue } from './entities/mail-queue.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MailService } from './mail.service';
import { MailTemplateService } from './mail-template.service';
import { SistemaConfigService } from '../sistema-config/sistema-config.service';

@Injectable()
export class MailQueueService {
  private readonly logger = new Logger(MailQueueService.name);
  private isProcessing = false;

  constructor(
    @InjectRepository(MailQueue)
    private readonly mailQueueRepository: Repository<MailQueue>,
    private readonly mailService: MailService,
    private readonly templateService: MailTemplateService,
    private readonly configService: SistemaConfigService,
  ) {}

  /**
   * Añade un correo a la cola de envío.
   */
  async enqueue(to: string, subject: string, body: string) {
    const entry = this.mailQueueRepository.create({
      destinatario: to,
      asunto: subject,
      cuerpo: body,
      estado: 'PENDING',
    });
    return this.mailQueueRepository.save(entry);
  }

  /**
   * Renderiza una plantilla (DB o Default) y la encola.
   */
  async renderAndEnqueue(to: string, context: any, templateId?: number, defaultTipo?: string) {
    let subject = '';
    let body = '';

    if (templateId) {
      const template = await this.templateService.findOne(templateId);
      subject = template.asunto;
      body = template.cuerpo;
    } else {
      // Fallback a configuración global si no hay templateId
      if (defaultTipo === 'WELCOME') {
        subject = await this.configService.getConfig('WELCOME_MESSAGE_SUBJECT');
        body = await this.configService.getConfig('WELCOME_MESSAGE_BODY');
      } else {
        subject = 'Notificación de Sistema';
        body = 'Hola {{nombre}}, tienes una nueva notificación.';
      }
    }

    const masterLayout = await this.configService.getConfig('MAIL_MASTER_LAYOUT');
    const systemUrl = await this.configService.getConfig('SYSTEM_URL');

    // Reemplazar variables
    const fullContext = { ...context, url_sistema: systemUrl, year: new Date().getFullYear() };
    
    const replaceVars = (text: string) => {
      let result = text;
      Object.keys(fullContext).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(regex, String(fullContext[key]));
      });
      return result;
    };

    const finalSubject = replaceVars(subject);
    let contentHtml = replaceVars(body).replace(/\n/g, '<br>');

    const finalHtml = masterLayout
      .replace('{{{content}}}', contentHtml)
      .replace('{{year}}', fullContext.year.toString());

    return this.enqueue(to, finalSubject, finalHtml);
  }

  /**
   * Proceso en segundo plano que se ejecuta cada minuto para enviar correos pendientes.
   * Maneja el límite diario de forma escalable.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // 1. Obtener correos pendientes (ordenados por fecha)
      const pending = await this.mailQueueRepository.find({
        where: [
          { estado: 'PENDING' },
          { estado: 'PAUSED_QUOTA' },
          { estado: 'FAILED', intentos: LessThan(3) }
        ],
        order: { fecha_creacion: 'ASC' },
        take: 10, // Procesar en bloques pequeños para no saturar
      });

      if (pending.length === 0) {
        this.isProcessing = false;
        return;
      }

      this.logger.log(`Procesando ${pending.length} correos de la cola...`);

      for (const mail of pending) {
        try {
          // Intentar enviar usando el MailService base
          // Nota: El MailService base ya tiene una validación de límite diario.
          // Si arroja error por límite, lo capturamos aquí para pausar la cola.
          await this.mailService.sendMail(
            mail.destinatario,
            mail.asunto,
            undefined, // No template, usaremos cuerpo directo
            undefined,
            mail.cuerpo
          );

          // Éxito
          await this.mailQueueRepository.update(mail.id, {
            estado: 'SENT',
            fecha_envio: new Date(),
            intentos: mail.intentos + 1,
          });

        } catch (error) {
          const errorMsg = error.message || 'Error desconocido';
          
          if (errorMsg.includes('Límite diario alcanzado')) {
            // Si es por límite, marcamos como PAUSED_QUOTA y dejamos de procesar por este ciclo
            await this.mailQueueRepository.update(mail.id, {
              estado: 'PAUSED_QUOTA',
              ultimo_error: 'Límite diario alcanzado. Se reintentará en el próximo ciclo.',
            });
            this.logger.warn(`Cola de correos pausada por cuota diaria alcanzada.`);
            break; 
          } else {
            // Otro error (ej: SMTP caído, dirección inválida)
            await this.mailQueueRepository.update(mail.id, {
              estado: 'FAILED',
              intentos: mail.intentos + 1,
              ultimo_error: errorMsg,
            });
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Obtiene estadísticas de la cola para el dashboard.
   */
  async getStats() {
    const total = await this.mailQueueRepository.count();
    const pendientes = await this.mailQueueRepository.count({ where: { estado: 'PENDING' } });
    const enviados = await this.mailQueueRepository.count({ where: { estado: 'SENT' } });
    const fallidos = await this.mailQueueRepository.count({ where: { estado: 'FAILED' } });
    const pausados = await this.mailQueueRepository.count({ where: { estado: 'PAUSED_QUOTA' } });

    return { total, pendientes, enviados, fallidos, pausados };
  }
}
