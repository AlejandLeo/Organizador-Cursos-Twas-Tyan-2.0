import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FirmasService } from './firmas.service';
import { CreateFirmaDto } from './dto/create-firma.dto';
import { UpdateFirmaDto } from './dto/update-firma.dto';

@Controller('firmas')
export class FirmasController {
  constructor(private readonly firmasService: FirmasService) {}

  @Post()
  create(@Body() createFirmaDto: CreateFirmaDto) {
    return this.firmasService.create(createFirmaDto);
  }

  @Get()
  findAll() {
    return this.firmasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.firmasService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFirmaDto: UpdateFirmaDto) {
    return this.firmasService.update(id, updateFirmaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.firmasService.remove(id);
  }
}
