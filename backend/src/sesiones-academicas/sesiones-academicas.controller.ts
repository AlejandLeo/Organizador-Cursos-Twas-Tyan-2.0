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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
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

  // ══════════════════════════════════════════════════════════
  //  PIN DE ASISTENCIA
  // ══════════════════════════════════════════════════════════

  /**
   * POST /sesiones-academicas/:id/generar-pin
   * Genera un nuevo PIN numérico de 6 dígitos para la sesión indicada.
   * El PIN se almacena hasheado en cod_verificacion y también se devuelve
   * en texto plano para que el docente lo proyecte en clase.
   * Solo accesible por Coordinador, Super Usuario y Ponente.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario', 'Ponente', 'Logística')
  @ApiBearerAuth()
  @Post(':id/generar-pin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Generar PIN de 6 dígitos para registro de asistencia en una sesión (Coord/Ponente)',
  })
  generarPin(@Param('id', ParseIntPipe) id: number) {
    return this.service.generarPin(id);
  }

  /**
   * POST /sesiones-academicas/:id/verificar-pin
   * Valida el PIN enviado contra el hash almacenado en la sesión.
   * Uso interno: es llamado por el flujo de registro de asistencia por PIN.
   * También puede exponerse para que el estudiante verifique antes de enviar.
   */
  @Post(':id/verificar-pin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar PIN de asistencia (público, sin JWT)',
  })
  verificarPin(
    @Param('id', ParseIntPipe) id: number,
    @Body('pin') pin: string,
  ) {
    return this.service.verificarPin(id, pin);
  }

  /**
   * GET /sesiones-academicas/activas
   * Lista sesiones cuya fecha es hoy y que ya tienen un PIN generado.
   * Útil para que el estudiante seleccione la sesión en el formulario de PIN.
   * Opcionalmente filtra por modalidad (id_curso_modalidad).
   */
  @Get('activas')
  @ApiOperation({
    summary:
      'Listar sesiones activas hoy con PIN disponible (público, para formulario de asistencia)',
  })
  @ApiQuery({ name: 'modalidadId', required: false })
  findActivas(@Query('modalidadId') modalidadId?: string) {
    return this.service.findActivas(
      modalidadId ? Number(modalidadId) : undefined,
    );
  }
}
