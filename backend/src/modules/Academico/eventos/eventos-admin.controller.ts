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
  Request,
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
import { JwtAuthGuard } from '../../Seguridad/auth/jwt-auth.guard';
import { RolesGuard } from '../../Seguridad/auth/roles.guard';
import { Roles } from '../../Seguridad/auth/roles.decorator';

/** Configuración de multer para guardar imágenes en uploads/imagenes/ */
/** Configuración de multer para guardar imágenes en subcarpetas organizadas */
const imageStorage = diskStorage({
  destination: (_req, file, cb) => {
    if (file.fieldname === 'imagen_portada') {
      cb(null, './uploads/eventos');
    } else if (file.fieldname === 'imagen_fondo') {
      cb(null, './uploads/fondos');
    } else {
      cb(null, './uploads/imagenes');
    }
  },
  filename: (_req, file, cb) =>
    cb(null, `${uuidv4()}${extname(file.originalname)}`),
});

@ApiTags('Eventos (Admin)')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Coordinador', 'Super Usuario')
@ApiBearerAuth()
@Controller('admin/eventos')
export class EventosAdminController {
  constructor(private readonly eventosService: EventosService) {}

  @Get(':id/actividades-academicas')
  @ApiOperation({ summary: 'Actividades académicas de un evento (Coordinador)' })
  getActividades(@Param('id', ParseIntPipe) id: number) {
    return this.eventosService.getActividades(id);
  }

  @Get('lista')
  @ApiOperation({ summary: 'Lista paginada de eventos (Coordinador)' })
  findAllAdmin(
    @Query('estado') estado?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Request() req?: any,
  ) {
    return this.eventosService.findAllAdmin(
      estado !== undefined ? Number(estado) : undefined,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
      req.user
    );
  }

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
    @Request() req?: any,
  ) {
    return this.eventosService.actualizarConImagen(
      id,
      dto,
      files?.imagen_portada?.[0],
      files?.imagen_fondo?.[0],
      req.user
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar evento (Coordinador)' })
  removeAdmin(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.eventosService.removeAdmin(id, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualización parcial de evento (Legacy)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() data: Partial<Evento>) {
    return this.eventosService.update(id, data);
  }
}
