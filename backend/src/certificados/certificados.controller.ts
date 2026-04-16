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
import { CertificadosService } from './certificados.service';
import { Certificado } from './entities/certificado.entity';

@Controller('certificados')
export class CertificadosController {
  constructor(private readonly certificadosService: CertificadosService) {}

  @Post()
  create(@Body() data: Partial<Certificado>) {
    return this.certificadosService.create(data);
  }

  @Get()
  findAll() {
    return this.certificadosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.certificadosService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<Certificado>,
  ) {
    return this.certificadosService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.certificadosService.remove(id);
  }
}
