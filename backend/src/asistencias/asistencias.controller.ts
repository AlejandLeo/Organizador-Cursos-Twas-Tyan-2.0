import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Asistencias')
@Controller('asistencias')
export class AsistenciasController {
  constructor(private readonly service: AsistenciasService) {}

  // Rutas públicas de asistencias (si las hubiera en el futuro)
}
