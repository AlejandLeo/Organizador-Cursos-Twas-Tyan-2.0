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
    const validFolders = ['imagenes', 'perfiles', 'fondos', 'eventos', 'cursos', 'inscripciones', 'logo', 'firmas', 'materiales'];
    if (!validFolders.includes(carpeta)) {
      throw new NotFoundException('Carpeta no válida');
    }

    const nombres = new Set<string>();
    const base = nombreArchivo.split(/[/\\]/).pop() || nombreArchivo;
    for (const candidato of [nombreArchivo, base]) {
      if (!candidato || candidato.includes('..')) continue;
      nombres.add(candidato);
      try {
        nombres.add(decodeURIComponent(candidato));
      } catch {
        /* nombre sin codificar */
      }
    }

    const carpetas = [carpeta, ...validFolders.filter((folder) => folder !== carpeta)];
    for (const folder of carpetas) {
      for (const nombre of nombres) {
        const imagePath = join(process.cwd(), 'uploads', folder, nombre);
        if (existsSync(imagePath)) {
          return res.sendFile(imagePath);
        }
      }
    }

    throw new NotFoundException('Imagen no encontrada');
  }
}
