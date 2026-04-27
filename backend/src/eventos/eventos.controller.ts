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

}
