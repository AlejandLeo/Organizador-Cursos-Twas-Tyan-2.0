import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SolicitudSoporte } from './entities/solicitud-soporte.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class SoporteService {
  constructor(
    @InjectRepository(SolicitudSoporte)
    private readonly soporteRepo: Repository<SolicitudSoporte>,
    private readonly mailService: MailService,
  ) {}

  async crearSolicitud(idUsuario: number | null, tipo: string, mensaje: string, email?: string) {
    let idVinculado = idUsuario;

    // Si no tenemos ID de usuario pero sí tenemos un email (ej. desde el login)
    // Intentamos buscar al usuario para vincularlo automáticamente
    if (!idVinculado && email) {
      const usuarioEncontrado = await this.soporteRepo.manager.getRepository('usuarios').findOne({
        where: { email: email }
      });
      if (usuarioEncontrado) {
        idVinculado = (usuarioEncontrado as any).id;
      }
    }

    // 1. Guardar el ticket en la BD para control administrativo
    const nueva = this.soporteRepo.create({
      id_usuario: idVinculado,
      tipo,
      mensaje,
    });
    const ticketGuardado = await this.soporteRepo.save(nueva);

    // 2. Si es recuperación de contraseña, intentar automatizar envío de correo
    if (tipo === 'password' && email) {
      try {
        await this.mailService.sendMail(
          email, 
          'Recibimos tu solicitud de acceso - TYAN',
          'soporte-password',
          { mensaje }
        );
      } catch (error) {
        console.error('Error enviando correo automático:', error);
      }
    }

    return ticketGuardado;
  }

  async obtenerTodas() {
    return await this.soporteRepo.find({
      relations: ['usuario', 'usuario.persona'],
      order: { fechaCreacion: 'DESC' },
    });
  }

  async resolverSolicitud(id: number) {
    return await this.soporteRepo.update(id, { estado: 1 });
  }

  async archivarSolicitud(id: number) {
    // Estado 2 = Archivado / Eliminado de la vista principal
    return await this.soporteRepo.update(id, { estado: 2 });
  }

  async vincularUsuario(id: number, usuarioId: number) {
    return await this.soporteRepo.update(id, { usuario: { id: usuarioId } });
  }
}
