import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { EventosService } from './eventos.service';
import { Evento } from './entities/evento.entity';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

/** Configuración de multer para guardar imágenes en uploads/imagenes/ */
const imageStorage = diskStorage({
  destination: './uploads/imagenes',
  filename: (_req, file, cb) =>
    cb(null, `${uuidv4()}${extname(file.originalname)}`),
});

@ApiTags('Eventos')
@Controller('eventos')
export class EventosController {
  constructor(private readonly eventosService: EventosService) {}

  // ══════════════════════════════════════════════════════════
  //  ENDPOINTS PÚBLICOS
  // ══════════════════════════════════════════════════════════

  /** GET /eventos — Lista (con URLs de imágenes formateadas) */
  @Get()
  @ApiOperation({ summary: 'Listar eventos (público)' })
  findAll() {
    return this.eventosService.findAll();
  }

  /** GET /eventos/:id — Detalles de un evento */
  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un evento (público)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.eventosService.findOne(id);
  }

  /** GET /eventos/:id/sesiones */
  @Get(':id/sesiones')
  @ApiOperation({ summary: 'Cronograma: sesiones y actividades del evento (público)' })
  getSesiones(@Param('id', ParseIntPipe) id: number) {
    return this.eventosService.getSesiones(id);
  }

  /** GET /eventos/:id/imparticiones */
  @Get(':id/imparticiones')
  @ApiOperation({ summary: 'Directorio de expositores del evento (público)' })
  getImparticiones(@Param('id', ParseIntPipe) id: number) {
    return this.eventosService.getImparticiones(id);
  }

  /** GET /eventos/:id/coordinaciones */
  @Get(':id/coordinaciones')
  @ApiOperation({ summary: 'Directorio de coordinadores del evento (público)' })
  getCoordinaciones(@Param('id', ParseIntPipe) id: number) {
    return this.eventosService.getCoordinaciones(id);
  }

  /** GET /eventos/:id/actividades-academicas */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Get(':id/actividades-academicas')
  @ApiOperation({ summary: 'Actividades académicas de un evento (Coordinador)' })
  getActividades(@Param('id', ParseIntPipe) id: number) {
    return this.eventosService.getActividades(id);
  }

  // ══════════════════════════════════════════════════════════
  //  ENDPOINTS COORDINADOR (JWT + Rol)
  // ══════════════════════════════════════════════════════════

  /**
   * GET /eventos/admin/lista
   * Lista paginada con filtros para el panel del coordinador.
   * Ruta separada para no colisionar con :id
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Get('admin/lista')
  @ApiOperation({ summary: 'Lista paginada de eventos (Coordinador)' })
  findAllAdmin(
    @Query('estado') estado?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.eventosService.findAllAdmin(
      estado !== undefined ? Number(estado) : undefined,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  /**
   * POST /eventos
   * Crea un evento con imágenes opcionales (multipart/form-data).
   * Campos de imagen: imagen_portada (→ logo) e imagen_fondo.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Crear evento con imágenes opcionales (Coordinador)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'imagen_portada', maxCount: 1 },
        { name: 'imagen_fondo', maxCount: 1 },
      ],
      { storage: imageStorage },
    ),
  )
  crearConImagen(
    @Body() dto: CreateEventoDto,
    @UploadedFiles()
    files?: {
      imagen_portada?: Express.Multer.File[];
      imagen_fondo?: Express.Multer.File[];
    },
  ) {
    return this.eventosService.crearConImagen(
      dto,
      files?.imagen_portada?.[0],
      files?.imagen_fondo?.[0],
    );
  }

  /**
   * PUT /eventos/:id
   * Actualiza un evento. Reemplaza imágenes si se envían nuevas.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Put(':id')
  @ApiOperation({ summary: 'Actualizar evento con imágenes opcionales (Coordinador)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'imagen_portada', maxCount: 1 },
        { name: 'imagen_fondo', maxCount: 1 },
      ],
      { storage: imageStorage },
    ),
  )
  actualizarConImagen(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventoDto,
    @UploadedFiles()
    files?: {
      imagen_portada?: Express.Multer.File[];
      imagen_fondo?: Express.Multer.File[];
    },
  ) {
    return this.eventosService.actualizarConImagen(
      id,
      dto,
      files?.imagen_portada?.[0],
      files?.imagen_fondo?.[0],
    );
  }

  /**
   * DELETE /eventos/:id
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar evento (Coordinador)' })
  removeAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.eventosService.removeAdmin(id);
  }

  // Mantener PATCH legacy por compatibilidad
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: Partial<Evento>) {
    return this.eventosService.update(id, data);
  }
}
