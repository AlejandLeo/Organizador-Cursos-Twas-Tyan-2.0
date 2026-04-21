import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InfoCertificado } from './entities/info-certificado.entity';
import { CreateInfoCertificadoDto } from './dto/create-info-certificado.dto';
import { UpdateInfoCertificadoDto } from './dto/update-info-certificado.dto';

@Injectable()
export class InfoCertificadosService {
  constructor(
    @InjectRepository(InfoCertificado)
    private readonly infoRepository: Repository<InfoCertificado>,
  ) {}

  // ── Coordinador ─────────────────────────────────────────────

  async create(dto: CreateInfoCertificadoDto) {
    const { id_evento, ...rest } = dto;
    
    // Validar si ya existe info para esta actividad (evento en este caso)
    const existe = await this.infoRepository.findOne({
      where: { evento: { id: id_evento } },
    });
    
    if (existe) {
      // Si ya existe, actualiza
      return this.update(existe.id, dto as any);
    }

    const info = this.infoRepository.create({
      ...rest,
      evento: { id: id_evento },
    });
    return this.infoRepository.save(info);
  }

  async findByEvento(eventoId: number) {
    return this.infoRepository.findOne({
      where: { evento: { id: eventoId } },
      relations: ['evento'],
    });
  }

  // Para compatibilidad o uso por actividadId (si se requiere buscar por evento del que depende la actividad)
  async findByActividad(actividadId: number) {
    // Nota: Como InfoCertificado pertenece a Evento, si se busca por actividad, 
    // se asume que se quiere el certificado del evento al que pertenece la actividad.
    // Pero la relación directa es con evento.
    return this.infoRepository.findOne({
       where: { evento: { actividades: { id: actividadId } } },
       relations: ['evento'],
    });
  }

  async findAll() {
    return this.infoRepository.find({
      relations: ['evento'],
    });
  }

  async findOne(id: number) {
    const info = await this.infoRepository.findOne({
      where: { id },
      relations: ['evento'],
    });
    if (!info) throw new NotFoundException(`Info de certificado ${id} no encontrada`);
    return info;
  }

  async update(id: number, dto: UpdateInfoCertificadoDto) {
    await this.findOne(id);
    const { id_evento, ...rest } = dto;
    const payload: any = { ...rest };
    if (id_evento) {
      payload.evento = { id: id_evento };
    }
    await this.infoRepository.update(id, payload);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.infoRepository.delete(id);
    return { mensaje: `Info de certificado ${id} eliminada` };
  }
}
