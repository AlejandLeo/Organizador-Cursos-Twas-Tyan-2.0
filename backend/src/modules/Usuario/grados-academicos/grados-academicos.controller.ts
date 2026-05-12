import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { GradosAcademicosService } from './grados-academicos.service';

@ApiTags('Grados Académicos')
@Controller('grados-academicos')
export class GradosAcademicosController {
  constructor(private readonly service: GradosAcademicosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los grados académicos' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un grado académico por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }
}
