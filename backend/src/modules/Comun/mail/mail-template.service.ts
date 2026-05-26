import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailTemplate, MailTemplateType } from './entities/mail-template.entity';

@Injectable()
export class MailTemplateService {
  constructor(
    @InjectRepository(MailTemplate)
    private readonly templateRepository: Repository<MailTemplate>,
  ) {}

  async findAll() {
    return this.templateRepository.find({
      order: { fecha_creacion: 'DESC' },
    });
  }

  async findByTipo(tipo: MailTemplateType) {
    return this.templateRepository.find({
      where: { tipo, activo: true },
    });
  }

  async findOne(id: number) {
    const template = await this.templateRepository.findOneBy({ id });
    if (!template) throw new NotFoundException(`Plantilla con ID ${id} no encontrada`);
    return template;
  }

  async create(data: Partial<MailTemplate>) {
    const template = this.templateRepository.create(data);
    return this.templateRepository.save(template);
  }

  async update(id: number, data: Partial<MailTemplate>) {
    await this.findOne(id);
    await this.templateRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number) {
    const template = await this.findOne(id);
    return this.templateRepository.remove(template);
  }
}
