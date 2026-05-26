import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GradosAdministrativosService } from './grados-administrativos.service';

@ApiTags('Grados Administrativos')
@Controller('admin/grados-administrativos') // Usando prefijo admin para coincidir con la gestión
export class GradosAdministrativosController {
  constructor(private readonly service: GradosAdministrativosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los grados administrativos' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un grado administrativo por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un grado administrativo' })
  create(@Body() data: any) {
    return this.service.create(data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un grado administrativo' })
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un grado administrativo' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
