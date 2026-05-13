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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { InfoCertificadosService } from './info-certificados.service';
import { CreateInfoCertificadoDto } from './dto/create-info-certificado.dto';
import { UpdateInfoCertificadoDto } from './dto/update-info-certificado.dto';
import { JwtAuthGuard } from '../../Seguridad/auth/jwt-auth.guard';
import { RolesGuard } from '../../Seguridad/auth/roles.guard';
import { Roles } from '../../Seguridad/auth/roles.decorator';

/** Configuración de multer para guardar fondos en uploads/fondos/ */
const fondoStorage = diskStorage({
  destination: './uploads/fondos',
  filename: (_req, file, cb) =>
    cb(null, `${uuidv4()}${extname(file.originalname)}`),
});

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
  @Post(':id/fondo')
  @UseInterceptors(FileInterceptor('fondo', { storage: fondoStorage }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir o actualizar imagen de fondo' })
  uploadFondo(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.updateFondo(id, file.filename);
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
  @Get('evento/:eventoId')
  @ApiOperation({ summary: 'Listar configuraciones por evento (Coordinador)' })
  @ApiQuery({ name: 'tipo', required: false })
  findByEvento(
    @Param('eventoId', ParseIntPipe) eventoId: number,
    @Query('tipo') tipo?: string,
  ) {
    return this.service.findByEvento(eventoId, tipo ? Number(tipo) : undefined);
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
