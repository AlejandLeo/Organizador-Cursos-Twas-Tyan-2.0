import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfiguracionSistema } from './entities/configuracion-sistema.entity';

@Injectable()
export class SistemaConfigService implements OnModuleInit {
  constructor(
    @InjectRepository(ConfiguracionSistema)
    private readonly configRepository: Repository<ConfiguracionSistema>,
  ) { }

  async onModuleInit() {
    // Inicializar configuración por defecto si no existe
    await this.ensureConfig('WELCOME_MESSAGE_SUBJECT', '¡Bienvenido a la Plataforma!', 'Asunto del correo de bienvenida');
    await this.ensureConfig('WELCOME_MESSAGE_BODY',
      'Hola {{nombre}},\n\nBienvenido a nuestra plataforma. Tus credenciales son:\nUsuario: {{email}}\nPassword: {{password}}\n\n¡Te esperamos!',
      'Cuerpo del correo de bienvenida (Soporta {{nombre}}, {{email}}, {{password}})'
    );
    await this.ensureConfig('MAIL_MASTER_LAYOUT',
      `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .wrapper { background-color: #f4f7f6; padding: 40px 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e1e8ed; }
        .header { background: #d32f2f; padding: 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
        .content { padding: 40px; color: #444; font-size: 15px; }
        .footer { text-align: center; font-size: 11px; color: #999; padding: 30px; background: #fafafa; border-top: 1px solid #eee; }
        .btn { display: inline-block; padding: 14px 28px; background-color: #d32f2f; color: white !important; text-decoration: none; border-radius: 12px; font-weight: bold; margin-top: 25px; text-transform: uppercase; font-size: 13px; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>Plataforma Académica</h1>
            </div>
            <div class="content">
                {{{content}}}
            </div>
            <div class="footer">
                <p>Has recibido este correo porque estás registrado en el Sistema de Gestión de Cursos.</p>
                <p>&copy; {{year}} Universidad Mayor de San Andrés - UMSA</p>
            </div>
        </div>
    </div>
</body>
</html>`,
      'Layout maestro HTML para todos los correos. Usa {{{content}}} para el cuerpo.'
    );
    await this.ensureConfig('SYSTEM_URL', process.env.FRONTEND_URL || '', 'URL pública del sistema (frontend)');
  }

  private async ensureConfig(clave: string, valor: string, descripcion: string) {
    const existe = await this.configRepository.findOne({ where: { clave } });
    if (!existe) {
      await this.configRepository.save({ clave, valor, descripcion });
    }
  }

  async getConfig(clave: string): Promise<string> {
    const config = await this.configRepository.findOne({ where: { clave } });
    return config ? config.valor : '';
  }

  async setConfig(clave: string, valor: string) {
    await this.configRepository.update(clave, { valor });
  }

  async getAllConfigs() {
    return this.configRepository.find();
  }
}
