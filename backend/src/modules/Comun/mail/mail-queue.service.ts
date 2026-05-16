import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { MailQueue } from './entities/mail-queue.entity';
<<<<<<< HEAD
import { MailLog } from './entities/mail-log.entity';
=======
>>>>>>> ba9255c45525f0d13cc726801e273abb8daa4315
import { Cron, CronExpression } from '@nestjs/schedule';
import { MailService } from './mail.service';
import { MailTemplateService } from './mail-template.service';
import { SistemaConfigService } from '../sistema-config/sistema-config.service';
<<<<<<< HEAD
import * as fs from 'fs';
import * as path from 'path';

/** Número máximo de intentos antes de cancelar permanentemente un correo de la cola */
const MAX_INTENTOS = 3;
=======
>>>>>>> ba9255c45525f0d13cc726801e273abb8daa4315

@Injectable()
export class MailQueueService {
  private readonly logger = new Logger(MailQueueService.name);
  private isProcessing = false;

  constructor(
    @InjectRepository(MailQueue)
    private readonly mailQueueRepository: Repository<MailQueue>,
<<<<<<< HEAD
    @InjectRepository(MailLog)
    private readonly mailLogRepository: Repository<MailLog>,
=======
>>>>>>> ba9255c45525f0d13cc726801e273abb8daa4315
    private readonly mailService: MailService,
    private readonly templateService: MailTemplateService,
    private readonly configService: SistemaConfigService,
  ) {}

<<<<<<< HEAD
  // ─────────────────────────────────────────────────────────────────────────
  // ENCOLADO
  // ─────────────────────────────────────────────────────────────────────────

  /** Añade un correo a la cola de envío. */
=======
  /**
   * Añade un correo a la cola de envío.
   */
>>>>>>> ba9255c45525f0d13cc726801e273abb8daa4315
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
<<<<<<< HEAD
   * Renderiza una plantilla (DB o admission.hbs por defecto) y la encola.
=======
   * Renderiza una plantilla (DB o Default) y la encola.
>>>>>>> ba9255c45525f0d13cc726801e273abb8daa4315
   */
  async renderAndEnqueue(to: string, context: any, templateId?: number, defaultTipo?: string) {
    let subject = '';
    let body = '';

    if (templateId) {
      const template = await this.templateService.findOne(templateId);
      subject = template.asunto;
      body = template.cuerpo;
<<<<<<< HEAD
    } else if (defaultTipo === 'WELCOME') {
      const templatePath = path.join(process.cwd(), 'src', 'modules', 'Comun', 'mail', 'templates', 'admission.hbs');
      subject = 'Solicitud de Acceso Aprobada';
      body = fs.readFileSync(templatePath, 'utf-8');
    } else {
      subject = 'Notificación de Sistema';
      body = 'Hola {{nombre}}, tienes una nueva notificación.';
    }

    const systemUrl = await this.configService.getConfig('SYSTEM_URL')
      .catch(() => process.env.FRONTEND_URL || 'http://localhost:5173');

    const fullContext: Record<string, any> = {
      ...context,
      url_sistema: systemUrl,
      loginUrl: systemUrl,
      year: new Date().getFullYear(),
    };

    const replaceVars = (text: string): string => {
      let result = text;
      Object.keys(fullContext).forEach(key => {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(fullContext[key] ?? ''));
=======
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
>>>>>>> ba9255c45525f0d13cc726801e273abb8daa4315
      });
      return result;
    };

    const finalSubject = replaceVars(subject);
<<<<<<< HEAD
    const isFullHtml = body.trimStart().startsWith('<!DOCTYPE html>') || body.trimStart().startsWith('<html');
    const finalHtml = isFullHtml
      ? replaceVars(body)
      : `<html><body>${replaceVars(body).replace(/\n/g, '<br>')}</body></html>`;
=======
    let contentHtml = replaceVars(body).replace(/\n/g, '<br>');

    const finalHtml = masterLayout
      .replace('{{{content}}}', contentHtml)
      .replace('{{year}}', fullContext.year.toString());
>>>>>>> ba9255c45525f0d13cc726801e273abb8daa4315

    return this.enqueue(to, finalSubject, finalHtml);
  }

<<<<<<< HEAD
  // ─────────────────────────────────────────────────────────────────────────
  // PROCESADO DE COLA (CRON)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Proceso en segundo plano cada minuto.
   * - Cancela definitivamente tras MAX_INTENTOS fallidos.
   * - Registra todo en mail_logs para auditoría.
=======
  /**
   * Proceso en segundo plano que se ejecuta cada minuto para enviar correos pendientes.
   * Maneja el límite diario de forma escalable.
>>>>>>> ba9255c45525f0d13cc726801e273abb8daa4315
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
<<<<<<< HEAD
=======
      // 1. Obtener correos pendientes (ordenados por fecha)
>>>>>>> ba9255c45525f0d13cc726801e273abb8daa4315
      const pending = await this.mailQueueRepository.find({
        where: [
          { estado: 'PENDING' },
          { estado: 'PAUSED_QUOTA' },
<<<<<<< HEAD
          { estado: 'FAILED', intentos: LessThan(MAX_INTENTOS) },
        ],
        order: { fecha_creacion: 'ASC' },
        take: 10,
      });

      if (pending.length === 0) { this.isProcessing = false; return; }
=======
          { estado: 'FAILED', intentos: LessThan(3) }
        ],
        order: { fecha_creacion: 'ASC' },
        take: 10, // Procesar en bloques pequeños para no saturar
      });

      if (pending.length === 0) {
        this.isProcessing = false;
        return;
      }
>>>>>>> ba9255c45525f0d13cc726801e273abb8daa4315

      this.logger.log(`Procesando ${pending.length} correos de la cola...`);

      for (const mail of pending) {
<<<<<<< HEAD
        // Pre-check: si ya alcanzó el límite, cancelar sin reintentar
        if (mail.intentos >= MAX_INTENTOS) {
          await this.cancelarCorreo(mail, `Cancelado: máximo de ${MAX_INTENTOS} intentos alcanzado.`);
          continue;
        }

        try {
          await this.mailService.sendMail(
            mail.destinatario,
            mail.asunto,
            undefined,
            undefined,
            mail.cuerpo,
          );

          await this.mailQueueRepository.delete(mail.id);

          await this.registrarLog(mail, 'enviado');
          this.logger.log(`✓ Correo enviado a ${mail.destinatario} y eliminado de la cola.`);

        } catch (error) {
          const errorMsg = (error as Error).message || 'Error desconocido';
          const nuevosIntentos = mail.intentos + 1;

          if (errorMsg.includes('Límite diario alcanzado')) {
            await this.mailQueueRepository.update(mail.id, {
              estado: 'PAUSED_QUOTA',
              ultimo_error: 'Límite diario alcanzado. Se reintentará mañana.',
            });
            this.logger.warn(`Cola pausada por cuota diaria.`);
            break;

          } else if (nuevosIntentos >= MAX_INTENTOS) {
            await this.cancelarCorreo(
              { ...mail, intentos: nuevosIntentos, ultimo_error: errorMsg },
              `Cancelado tras ${MAX_INTENTOS} intentos. Último error: ${errorMsg}`,
            );

          } else {
            await this.mailQueueRepository.update(mail.id, {
              estado: 'FAILED',
              intentos: nuevosIntentos,
              ultimo_error: errorMsg,
            });
            this.logger.warn(`Fallo temporal → ${mail.destinatario} (${nuevosIntentos}/${MAX_INTENTOS}): ${errorMsg}`);
=======
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
>>>>>>> ba9255c45525f0d13cc726801e273abb8daa4315
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

<<<<<<< HEAD
  // ─────────────────────────────────────────────────────────────────────────
  // HELPERS PRIVADOS
  // ─────────────────────────────────────────────────────────────────────────

  private async cancelarCorreo(
    mail: Partial<MailQueue> & { id: number; destinatario: string; asunto: string },
    motivo: string,
  ) {
    // Registrar en auditoría primero
    await this.registrarLog(mail as MailQueue, 'cancelado', motivo);
    // Eliminar de la cola de trabajo temporal
    await this.mailQueueRepository.delete(mail.id);
    this.logger.error(`✗ Correo a ${mail.destinatario} CANCELADO (Eliminado de cola): ${motivo}`);
  }

  private async registrarLog(mail: MailQueue, estado: 'enviado' | 'cancelado', error?: string) {
    const logEntry = this.mailLogRepository.create({
      destinatario: mail.destinatario,
      asunto: mail.asunto,
      estado,
      error: error || undefined,
      fecha_envio: estado === 'enviado' ? new Date() : undefined,
    });
    await this.mailLogRepository.save(logEntry);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // AUDITORÍA Y ESTADÍSTICAS
  // ─────────────────────────────────────────────────────────────────────────

  async getAuditoria(page = 1, limit = 50) {
    const [logs, totalLogs] = await this.mailLogRepository.findAndCount({
      order: { fecha_creacion: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const colaFallidos = await this.mailQueueRepository.find({
      where: [
        { estado: 'FAILED' },
        { estado: 'PAUSED_QUOTA' },
      ],
      order: { fecha_creacion: 'DESC' },
      take: 100,
    });

    return { logs, totalLogs, page, limit, colaFallidos, maxIntentos: MAX_INTENTOS };
  }

  async getStats() {
    const [totalCola, pendientes, enviados, fallidos, pausados, cancelados] = await Promise.all([
      this.mailQueueRepository.count(),
      this.mailQueueRepository.count({ where: { estado: 'PENDING' } }),
      this.mailLogRepository.count({ where: { estado: 'enviado' } }),
      this.mailQueueRepository.count({ where: { estado: 'FAILED' } }),
      this.mailQueueRepository.count({ where: { estado: 'PAUSED_QUOTA' } }),
      this.mailLogRepository.count({ where: { estado: 'cancelado' } }),
    ]);
    return { total: totalCola, pendientes, enviados, fallidos, pausados, cancelados };
=======
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
>>>>>>> ba9255c45525f0d13cc726801e273abb8daa4315
  }
}
