import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { InfoCertificadosService } from './info-certificados.service';
import { InfoCertificado } from './entities/info-certificado.entity';

@Controller('info-certificados')
export class InfoCertificadosController {
  constructor(
    private readonly infoCertificadosService: InfoCertificadosService,
  ) {}

  @Post()
  create(@Body() data: Partial<InfoCertificado>) {
    return this.infoCertificadosService.create(data);
  }

  @Get()
  findAll() {
    return this.infoCertificadosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.infoCertificadosService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<InfoCertificado>,
  ) {
    return this.infoCertificadosService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.infoCertificadosService.remove(id);
  }
}
