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
  Request,
  Patch,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { InscripcionesService } from './inscripciones.service';
import { RegistrarAsistenciaPinDto } from './dto/registrar-asistencia-pin.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Inscripciones')
@Controller('inscripciones')
export class InscripcionesController {
  constructor(private readonly service: InscripcionesService) {}

  @Get('alertas-coordinador')
  @Roles('Coordinador', 'Super Usuario')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener conteo de notificaciones para el coordinador' })
  async getNotifications() {
    return this.service.getCoordinadorNotifications();
  }

  // ══════════════════════════════════════════════════════════
  //  REGISTRO DE ASISTENCIA POR PIN (público, sin JWT)
  //  El estudiante ingresa su email + sesión + PIN para
  //  marcar su asistencia sin necesidad de iniciar sesión.
  // ══════════════════════════════════════════════════════════


  @Post('registrar-asistencia-pin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Registrar asistencia con PIN (público — sin JWT). Requiere email + id_sesion + pin.',
  })
  registrarAsistenciaPorPin(@Body() dto: RegistrarAsistenciaPinDto) {
    return this.service.registrarAsistenciaPorPin(dto);
  }

  // ══════════════════════════════════════════════════════════
  //  MÉTODOS CRUD ESTÁNDAR
  // ══════════════════════════════════════════════════════════

  @Get()
  @Roles('Coordinador', 'Super Usuario', 'Ponente')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todas las inscripciones' })
  findAll() {
    return this.service.findAll();
  }



  @Get(':id')
  @Roles('Coordinador', 'Super Usuario', 'Ponente')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener inscripción por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('Coordinador', 'Super Usuario')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una inscripción (Admin)' })
  create(@Body() data: any) {
    return this.service.create(data);
  }

  @Put(':id')
  @Roles('Coordinador', 'Super Usuario')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar una inscripción (ej. cambiar estado)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    // Si data contiene estado, usamos cambiarEstado o update según corresponda
    return this.service.update(id, data);
  }

  @Delete(':id')
  @Roles('Coordinador', 'Super Usuario')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar una inscripción' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
