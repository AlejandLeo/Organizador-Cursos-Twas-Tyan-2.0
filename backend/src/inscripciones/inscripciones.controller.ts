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
  Request,
  Patch,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { InscripcionesService } from './inscripciones.service';
import { RegistrarAsistenciaPinDto } from './dto/registrar-asistencia-pin.dto';

@ApiTags('Inscripciones')
@Controller('inscripciones')
export class InscripcionesController {
  constructor(private readonly service: InscripcionesService) {}

  // ══════════════════════════════════════════════════════════
  //  REGISTRO DE ASISTENCIA POR PIN (público, sin JWT)
  //  El estudiante ingresa su email + sesión + PIN para
  //  marcar su asistencia sin necesidad de iniciar sesión.
  // ══════════════════════════════════════════════════════════


  @Post('registrar-asistencia-pin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Registrar asistencia con PIN (público — sin JWT). Requiere email + id_sesion + pin.',
  })
  registrarAsistenciaPorPin(@Body() dto: RegistrarAsistenciaPinDto) {
    return this.service.registrarAsistenciaPorPin(dto);
  }
}
