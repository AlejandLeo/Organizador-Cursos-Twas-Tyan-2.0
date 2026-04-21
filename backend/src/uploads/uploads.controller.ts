import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import * as express from 'express';
import { join } from 'path';
import { existsSync } from 'fs';

@Controller('uploads')
export class UploadsController {
  @Get('imagenes/:nombreArchivo')
  getImagen(@Param('nombreArchivo') nombreArchivo: string, @Res() res: express.Response) {
    const imagePath = join(process.cwd(), 'uploads', 'imagenes', nombreArchivo);
    
    if (existsSync(imagePath)) {
      return res.sendFile(imagePath);
    } else {
      throw new NotFoundException('Imagen no encontrada');
    }
  }
}
