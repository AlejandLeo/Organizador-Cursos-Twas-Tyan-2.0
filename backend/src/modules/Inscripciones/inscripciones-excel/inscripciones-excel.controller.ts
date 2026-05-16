import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  Body,
  Res,
  UseGuards,
  BadRequestException,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as express from 'express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { InscripcionesExcelService } from './inscripciones-excel.service';
import { JwtAuthGuard } from '../../Seguridad/auth/jwt-auth.guard';
import { RolesGuard } from '../../Seguridad/auth/roles.guard';
import { Roles } from '../../Seguridad/auth/roles.decorator';

@ApiTags('Inscripciones por Excel')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Controller('admin/inscripciones-excel')
export class InscripcionesExcelController {
  constructor(private readonly service: InscripcionesExcelService) {}

  @Roles('Coordinador', 'Super Usuario')
  @Post('registro-masivo')
  @ApiOperation({ summary: 'Registrar usuarios masivamente desde Excel' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        notificar: { type: 'string', description: 'true/false' },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    fileFilter: (_req, file, cb) => {
      if (file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls')
        || file.mimetype.includes('spreadsheet') || file.mimetype.includes('excel')) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Solo se permiten archivos Excel (.xlsx, .xls)'), false);
      }
    },
  }))
  async registroMasivo(
    @UploadedFile(new ParseFilePipe({ validators: [new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 })] }))
    file: Express.Multer.File,
    @Body('notificar') notificar?: string,
    @Body('modo') modo?: 'verificar' | 'guardar',
  ) {
    if (!file) throw new BadRequestException('Debe adjuntar un archivo Excel.');
    return this.service.registroMasivoUsuarios(file.buffer, notificar === 'true', modo || 'guardar');
  }

  @Roles('Coordinador', 'Super Usuario')
  @Post('inscripcion-masiva')
  @ApiOperation({ summary: 'Inscribir estudiantes masivamente a una actividad académica desde Excel' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        notificar: { type: 'string', description: 'true/false' },
        id_actividad: { type: 'string', description: 'ID de la actividad académica' },
        modo: { type: 'string', description: 'verificar / guardar' },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    fileFilter: (_req, file, cb) => {
      if (file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls')
        || file.mimetype.includes('spreadsheet') || file.mimetype.includes('excel')) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Solo se permiten archivos Excel (.xlsx, .xls)'), false);
      }
    },
  }))
  async inscripcionMasiva(
    @UploadedFile(new ParseFilePipe({ validators: [new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 })] }))
    file: Express.Multer.File,
    @Body('notificar') notificar?: string,
    @Body('id_actividad') idActividad?: string,
    @Body('modo') modo?: 'verificar' | 'guardar',
  ) {
    if (!file) throw new BadRequestException('Debe adjuntar un archivo Excel.');
    return this.service.inscripcionMasivaEvento(
      file.buffer,
      notificar === 'true',
      idActividad ? Number(idActividad) : undefined,
      modo || 'guardar'
    );
  }

  @Roles('Coordinador', 'Super Usuario')
  @Get('plantilla-usuarios')
  @ApiOperation({ summary: 'Descargar plantilla Excel para registro masivo de usuarios' })
  descargarPlantillaUsuarios(@Res() res: express.Response) {
    const buffer = this.service.generarPlantillaUsuarios();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="plantilla_registro_usuarios.xlsx"',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Roles('Coordinador', 'Super Usuario')
  @Get('plantilla-inscripciones')
  @ApiOperation({ summary: 'Descargar plantilla Excel para inscripción masiva a evento' })
  descargarPlantillaInscripciones(@Res() res: express.Response) {
    const buffer = this.service.generarPlantillaInscripciones();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="plantilla_inscripcion_masiva.xlsx"',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
