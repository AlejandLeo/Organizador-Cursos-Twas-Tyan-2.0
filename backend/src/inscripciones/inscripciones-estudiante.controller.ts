import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InscripcionesService } from './inscripciones.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Inscripciones (Mi Cuenta)')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('me/inscripciones')
export class InscripcionesEstudianteController {
  constructor(private readonly service: InscripcionesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar mis inscripciones' })
  misInscripciones(@Request() req: any) {
    return this.service.findByUsuario(req.user.id || req.user.sub);
  }

  @Post('preinscribir')
  @ApiOperation({ summary: 'Pre-inscribirme a una actividad' })
  preinscribir(@Request() req: any, @Body() body: any) {
    return this.service.inscribir({
      id_usuario: req.user.id || req.user.sub,
      id_actividad_academica: Number(body.id_actividad),
      miembro_tyan: body.miembro_tyan !== undefined ? Number(body.miembro_tyan) : 0,
      razon: body.razon || '',
      datos_adicionales: body.datos_adicionales || {},
      estado: 0,
    });
  }
}
