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
import { SesionesAcademicasService } from './sesiones-academicas.service';
import { CreateSesionAcademicaDto } from './dto/create-sesion-academica.dto';
import { UpdateSesionAcademicaDto } from './dto/update-sesion-academica.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Sesiones Académicas')
@Controller('sesiones-academicas')
export class SesionesAcademicasController {
  constructor(private readonly service: SesionesAcademicasService) {}

  // ── Coordinador ─────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Crear sesión (Coordinador)' })
  create(@Body() dto: CreateSesionAcademicaDto) {
    return this.service.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Listar sesiones de una modalidad (Coordinador)' })
  @ApiQuery({ name: 'modalidadId', required: false })
  findAll(@Query('modalidadId') modalidadId?: string) {
    if (modalidadId) {
      return this.service.findByModalidad(Number(modalidadId));
    }
    return this.service.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Detalle de sesión (Coordinador)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Put(':id')
  @ApiOperation({ summary: 'Editar sesión (Coordinador)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSesionAcademicaDto,
  ) {
    return this.service.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar sesión (Coordinador)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
