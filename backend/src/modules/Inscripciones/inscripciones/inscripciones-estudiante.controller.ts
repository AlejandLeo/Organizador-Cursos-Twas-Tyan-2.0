import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InscripcionesService } from './inscripciones.service';
import { JwtAuthGuard } from '../../Seguridad/auth/jwt-auth.guard';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

@ApiTags('Inscripciones (Mi Cuenta)')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('me/inscripciones')
export class InscripcionesEstudianteController {
  constructor(private readonly service: InscripcionesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar mis inscripciones' })
  misInscripciones(@Request() req: any) {
    return this.service.findByUsuario(req.user.id);
  }

  @Post('preinscribir')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Pre-inscribirme a una actividad (Soporta archivos)' })
  @UseInterceptors(AnyFilesInterceptor({
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = join(process.cwd(), 'uploads', 'inscripciones');
        if (!existsSync(uploadPath)) {
          mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `doc-${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  async preinscribir(@Request() req: any, @Body() body: any, @UploadedFiles() files: Express.Multer.File[]) {
    let datosAdicionales = {};
    try {
      datosAdicionales = typeof body.datos_adicionales === 'string' 
        ? JSON.parse(body.datos_adicionales) 
        : (body.datos_adicionales || {});
    } catch (e) {
      datosAdicionales = body.datos_adicionales || {};
    }

    // Mapear archivos subidos a los datos adicionales
    if (files && files.length > 0) {
      files.forEach(file => {
        const fieldName = file.fieldname.replace('file_', '');
        datosAdicionales[fieldName] = `/uploads/inscripciones/${file.filename}`;
      });
    }

    return this.service.inscribir({
      id_usuario: req.user.id,
      id_actividad_academica: Number(body.id_actividad),
      miembro_tyan: body.miembro_tyan !== undefined ? Number(body.miembro_tyan) : 0,
      razon: body.razon || '',
      datos_adicionales: datosAdicionales,
      estado: 0,
    });
  }
}
