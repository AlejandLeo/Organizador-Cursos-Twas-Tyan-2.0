import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CertificadosService } from './certificados.service';
import { CreateCertificadoDto } from './dto/create-certificado.dto';
import { UpdateCertificadoDto } from './dto/update-certificado.dto';

@ApiTags('certificados')
@Controller('certificados')
export class CertificadosController {
  constructor(private readonly certificadosService: CertificadosService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo certificado' })
  @ApiResponse({ status: 201, description: 'El certificado ha sido creado exitosamente.' })
  create(@Body() createCertificadoDto: CreateCertificadoDto) {
    return this.certificadosService.create(createCertificadoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los certificados' })
  @ApiResponse({ status: 200, description: 'Lista de certificados retornada exitosamente.' })
  findAll() {
    return this.certificadosService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un certificado por ID' })
  @ApiResponse({ status: 200, description: 'Certificado encontrado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Certificado no encontrado.' })
  findOne(@Param('id') id: string) {
    return this.certificadosService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un certificado existente' })
  @ApiResponse({ status: 200, description: 'Certificado actualizado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Certificado no encontrado.' })
  update(@Param('id') id: string, @Body() updateCertificadoDto: UpdateCertificadoDto) {
    return this.certificadosService.update(id, updateCertificadoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un certificado' })
  @ApiResponse({ status: 200, description: 'Certificado eliminado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Certificado no encontrado.' })
  remove(@Param('id') id: string) {
    return this.certificadosService.remove(id);
  }
}
