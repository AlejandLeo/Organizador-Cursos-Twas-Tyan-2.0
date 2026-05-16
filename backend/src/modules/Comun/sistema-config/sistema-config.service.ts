import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfiguracionSistema } from './entities/configuracion-sistema.entity';

@Injectable()
export class SistemaConfigService implements OnModuleInit {
  constructor(
    @InjectRepository(ConfiguracionSistema)
    private readonly configRepository: Repository<ConfiguracionSistema>,
  ) {}

  async onModuleInit() {
    // Inicializar configuración por defecto si no existe
    await this.ensureConfig('WELCOME_MESSAGE_SUBJECT', '¡Bienvenido a la Plataforma!', 'Asunto del correo de bienvenida');
    await this.ensureConfig('WELCOME_MESSAGE_BODY', 
      'Hola {{nombre}},\n\nBienvenido a nuestra plataforma. Tus credenciales son:\nUsuario: {{email}}\nPassword: {{password}}\n\n¡Te esperamos!', 
      'Cuerpo del correo de bienvenida (Soporta {{nombre}}, {{email}}, {{password}})'
    );
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
