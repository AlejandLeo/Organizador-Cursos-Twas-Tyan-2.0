import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CertificadosService } from './certificados.service';
import { CreateCertificadoDto } from './dto/create-certificado.dto';
import { UpdateCertificadoDto } from './dto/update-certificado.dto';

@Controller('certificados')
export class CertificadosController {
  constructor(private readonly certificadosService: CertificadosService) {}

  @Post()
  create(@Body() createCertificadoDto: CreateCertificadoDto) {
    return this.certificadosService.create(createCertificadoDto);
  }

  @Get()
  findAll() {
    return this.certificadosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.certificadosService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCertificadoDto: UpdateCertificadoDto) {
    return this.certificadosService.update(id, updateCertificadoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.certificadosService.remove(id);
  }
}
