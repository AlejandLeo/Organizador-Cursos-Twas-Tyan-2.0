import { Controller, Get, Param, NotFoundException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificado } from './entities/certificado.entity';

@ApiTags('Certificados Públicos (Verificación)')
@Controller('public/certificados')
@UseGuards(ThrottlerGuard) // Aplica rate limiting
export class CertificadosPublicController {
  constructor(
    @InjectRepository(Certificado)
    private readonly certificadoRepository: Repository<Certificado>,
  ) {}

  @Get('verificar/:uuid')
  @ApiOperation({ summary: 'Verifica la autenticidad de un certificado por UUID' })
  @ApiParam({ name: 'uuid', description: 'UUID del archivo/certificado (columna uuid_archivo)' })
  @ApiResponse({ status: 200, description: 'Certificado verificado y datos básicos retornados' })
  @ApiResponse({ status: 404, description: 'Certificado no encontrado o inválido' })
  @ApiResponse({ status: 429, description: 'Demasiadas peticiones (Rate Limit)' })
  async verificarCertificado(@Param('uuid') uuid: string) {
    // Buscamos el certificado por uuid_archivo, sin exponer data sensible no necesaria
    const certificado = await this.certificadoRepository.createQueryBuilder('c')
      .leftJoinAndSelect('c.usuario', 'u')
      .leftJoinAndSelect('u.persona', 'p')
      .leftJoinAndSelect('c.actividadAcademica', 'aa')
      .leftJoinAndSelect('aa.evento', 'e')
      .where('c.uuid_archivo = :uuid', { uuid })
      .getOne();

    if (!certificado) {
      throw new NotFoundException('El certificado no existe o ha sido revocado.');
    }

    // Sanitizamos la data expuesta al público
    const nombreUsuario = certificado.usuario?.persona
      ? `${certificado.usuario.persona.nombres} ${certificado.usuario.persona.primer_apellido} ${certificado.usuario.persona.segundo_apellido || ''}`.trim()
      : 'Participante';

    const ciUsuario = certificado.usuario?.persona?.documento_identidad || 'No disponible';

    let eventoNombre = 'Evento Desconocido';
    let fechaInicio: Date | null = null;
    let fechaFin: Date | null = null;

    if (certificado.actividadAcademica) {
      eventoNombre = certificado.actividadAcademica.evento?.nombre || certificado.actividadAcademica.nombre;
      fechaInicio = certificado.actividadAcademica.evento?.fecha_inicio || certificado.actividadAcademica.fecha_inicio;
      fechaFin = certificado.actividadAcademica.evento?.fecha_fin || certificado.actividadAcademica.fecha_fin;
    }

    const tiposStr = {
      1: 'Estudiante / Asistente',
      2: 'Docente / Ponente',
      3: 'Coordinador / Logística'
    };

    return {
      valido: true,
      certificado: {
        codigo_interno: certificado.id,
        uuid: certificado.uuid_archivo,
        fecha_emision: certificado.fecha_emision,
        tipo_participacion: tiposStr[certificado.tipo] || 'Participante',
        estado: certificado.estado === 1 ? 'Activo' : 'Inactivo',
      },
      participante: {
        nombre: nombreUsuario,
        documento: ciUsuario,
      },
      evento: {
        nombre: eventoNombre,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      }
    };
  }
}
