import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import * as express from 'express';
import { join } from 'path';
import { existsSync } from 'fs';

@Controller('uploads')
export class UploadsController {
  @Get(':carpeta/:nombreArchivo')
  getImagen(
    @Param('carpeta') carpeta: string, 
    @Param('nombreArchivo') nombreArchivo: string, 
    @Res() res: express.Response
  ) {
    const validFolders = ['imagenes', 'perfiles', 'fondos', 'eventos', 'cursos', 'inscripciones', 'logo', 'firmas'];
    if (!validFolders.includes(carpeta)) {
      throw new NotFoundException('Carpeta no válida');
    }

    const imagePath = join(process.cwd(), 'uploads', carpeta, nombreArchivo);
    
    if (existsSync(imagePath)) {
      return res.sendFile(imagePath);
    } else {
      throw new NotFoundException('Imagen no encontrada');
    }
  }
}
