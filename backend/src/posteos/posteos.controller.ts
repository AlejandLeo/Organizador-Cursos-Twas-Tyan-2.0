import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PosteosService } from './posteos.service';
import { CreatePosteoDto } from './dto/create-posteo.dto';
import { UpdatePosteoDto } from './dto/update-posteo.dto';

@ApiTags('posteos')
@Controller('posteos')
export class PosteosController {
  constructor(private readonly posteosService: PosteosService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo posteo o noticia' })
  @ApiResponse({ status: 201, description: 'El posteo ha sido creado exitosamente.' })
  create(@Body() createPosteoDto: CreatePosteoDto) {
    return this.posteosService.create(createPosteoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los posteos' })
  @ApiResponse({ status: 200, description: 'Lista de posteos retornada exitosamente.' })
  findAll() {
    return this.posteosService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un posteo por ID' })
  @ApiResponse({ status: 200, description: 'Posteo encontrado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Posteo no encontrado.' })
  findOne(@Param('id') id: string) {
    return this.posteosService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un posteo existente' })
  @ApiResponse({ status: 200, description: 'Posteo actualizado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Posteo no encontrado.' })
  update(@Param('id') id: string, @Body() updatePosteoDto: UpdatePosteoDto) {
    return this.posteosService.update(id, updatePosteoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un posteo' })
  @ApiResponse({ status: 200, description: 'Posteo eliminado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Posteo no encontrado.' })
  remove(@Param('id') id: string) {
    return this.posteosService.remove(id);
  }
}
