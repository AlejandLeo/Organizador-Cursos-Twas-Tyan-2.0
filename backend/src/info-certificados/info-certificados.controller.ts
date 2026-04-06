import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InfoCertificadosService } from './info-certificados.service';
import { CreateInfoCertificadoDto } from './dto/create-info-certificado.dto';
import { UpdateInfoCertificadoDto } from './dto/update-info-certificado.dto';

@ApiTags('info-certificados')
@Controller('info-certificados')
export class InfoCertificadosController {
  constructor(private readonly infoCertificadosService: InfoCertificadosService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nueva información de certificado' })
  @ApiResponse({ status: 201, description: 'La información del certificado ha sido creada exitosamente.' })
  create(@Body() createInfoCertificadoDto: CreateInfoCertificadoDto) {
    return this.infoCertificadosService.create(createInfoCertificadoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener toda la información de certificados' })
  @ApiResponse({ status: 200, description: 'Lista de información de certificados retornada exitosamente.' })
  findAll() {
    return this.infoCertificadosService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener información de certificado por ID' })
  @ApiResponse({ status: 200, description: 'Información de certificado encontrada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Información de certificado no encontrada.' })
  findOne(@Param('id') id: string) {
    return this.infoCertificadosService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar información de certificado existente' })
  @ApiResponse({ status: 200, description: 'Información de certificado actualizada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Información de certificado no encontrada.' })
  update(@Param('id') id: string, @Body() updateInfoCertificadoDto: UpdateInfoCertificadoDto) {
    return this.infoCertificadosService.update(id, updateInfoCertificadoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar información de certificado' })
  @ApiResponse({ status: 200, description: 'Información de certificado eliminada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Información de certificado no encontrada.' })
  remove(@Param('id') id: string) {
    return this.infoCertificadosService.remove(id);
  }
}
