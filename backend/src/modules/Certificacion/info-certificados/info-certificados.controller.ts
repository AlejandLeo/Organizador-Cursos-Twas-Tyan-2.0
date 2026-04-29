import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InfoCertificadosService } from './info-certificados.service';
import { CreateInfoCertificadoDto } from './dto/create-info-certificado.dto';
import { UpdateInfoCertificadoDto } from './dto/update-info-certificado.dto';
import { JwtAuthGuard } from '../../Seguridad/auth/jwt-auth.guard';
import { RolesGuard } from '../../Seguridad/auth/roles.guard';
import { Roles } from '../../Seguridad/auth/roles.decorator';

@ApiTags('Info Certificados (Configuración)')
@Controller('info-certificados')
export class InfoCertificadosController {
  constructor(private readonly service: InfoCertificadosService) {}

  // ── Coordinador ─────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Crear configuración de certificado (Coordinador)' })
  create(@Body() dto: CreateInfoCertificadoDto) {
    return this.service.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Listar configuraciones (Coordinador)' })
  @ApiQuery({ name: 'actividadId', required: false })
  findAll(@Query('actividadId') actividadId?: string) {
    if (actividadId) {
      return this.service.findByActividad(Number(actividadId));
    }
    return this.service.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Detalle de configuración (Coordinador)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Put(':id')
  @ApiOperation({ summary: 'Editar configuración de certificado (Coordinador)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInfoCertificadoDto,
  ) {
    return this.service.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar configuración de certificado (Coordinador)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
