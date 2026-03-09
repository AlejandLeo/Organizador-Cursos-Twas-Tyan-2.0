import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { InfoCertificadosService } from './info-certificados.service';
import { CreateInfoCertificadoDto } from './dto/create-info-certificado.dto';
import { UpdateInfoCertificadoDto } from './dto/update-info-certificado.dto';

@Controller('info-certificados')
export class InfoCertificadosController {
  constructor(private readonly infoCertificadosService: InfoCertificadosService) {}

  @Post()
  create(@Body() createInfoCertificadoDto: CreateInfoCertificadoDto) {
    return this.infoCertificadosService.create(createInfoCertificadoDto);
  }

  @Get()
  findAll() {
    return this.infoCertificadosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.infoCertificadosService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateInfoCertificadoDto: UpdateInfoCertificadoDto) {
    return this.infoCertificadosService.update(id, updateInfoCertificadoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.infoCertificadosService.remove(id);
  }
}
