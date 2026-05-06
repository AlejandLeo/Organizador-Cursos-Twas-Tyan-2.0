import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, ParseIntPipe, UseGuards, Query, Request,
  UseInterceptors, UploadedFile
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ActividadesAcademicasService } from './actividades-academicas.service';
import { CreateActividadDto } from './dto/create-actividad.dto';
import { UpdateActividadDto } from './dto/update-actividad.dto';
import { JwtAuthGuard } from '../../Seguridad/auth/jwt-auth.guard';
import { RolesGuard } from '../../Seguridad/auth/roles.guard';
import { Roles } from '../../Seguridad/auth/roles.decorator';

/** Configuración de multer para guardar imágenes en uploads/cursos/ */
const activityImageStorage = diskStorage({
  destination: './uploads/cursos',
  filename: (_req, file, cb) =>
    cb(null, `${uuidv4()}${extname(file.originalname)}`),
});

@ApiTags('Actividades Académicas')
@Controller('actividades-academicas')
export class ActividadesAcademicasController {
  constructor(private readonly service: ActividadesAcademicasService) {}

  /** GET /actividades-academicas — lista todas */
  @Get()
  @ApiOperation({ summary: 'Listar actividades académicas' })
  findAll() {
    return this.service.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Super Usuario')
  @ApiBearerAuth()
  @Get('solicitudes/pendientes')
  @ApiOperation({ summary: 'Listar solicitudes de reactivación pendientes (Super Admin)' })
  getSolicitudesPendientes() {
    return this.service.getSolicitudesPendientes();
  }

  /** GET /actividades-academicas/:id */
  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una actividad' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  // ── Coordinador ─────────────────────────────────────────────

  /** POST /actividades-academicas */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Crear actividad académica (Coordinador)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('imagen', { storage: activityImageStorage }))
  crear(
    @Body() dto: CreateActividadDto, 
    @Request() req: any,
    @UploadedFile() file?: Express.Multer.File
  ) {
    return this.service.crear(dto, req.user, file);
  }

  /** PUT /actividades-academicas/:id */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Put(':id')
  @ApiOperation({ summary: 'Actualizar actividad académica (Coordinador)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('imagen', { storage: activityImageStorage }))
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateActividadDto,
    @Request() req: any,
    @UploadedFile() file?: Express.Multer.File
  ) {
    return this.service.actualizar(id, dto, req.user, file);
  }

  /** PATCH /actividades-academicas/:id - Para inhabilitar o cambios rápidos */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Actualización parcial de actividad académica (Coordinador)' })
  patch(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateActividadDto,
    @Request() req: any
  ) {
    return this.service.actualizar(id, dto, req.user);
  }

  /** DELETE /actividades-academicas/:id */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar actividad académica (Coordinador)' })
  eliminar(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.service.eliminar(id, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Post(':id/solicitar-activacion')
  @ApiOperation({ summary: 'Solicitar reactivación de una actividad al Super Usuario' })
  solicitarActivacion(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.service.solicitarActivacion(id, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Super Usuario')
  @ApiBearerAuth()
  @Patch(':id/activar')
  @ApiOperation({ summary: 'Aprobar reactivación de una actividad (Super Admin)' })
  aprobarReactivacion(@Param('id', ParseIntPipe) id: number) {
    return this.service.aprobarReactivacion(id);
  }
}
