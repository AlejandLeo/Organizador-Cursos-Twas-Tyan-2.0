import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ImparticionesService } from './imparticiones.service';
import { CreateImparticionDto } from './dto/create-imparticion.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Imparticiones')
@Controller('imparticiones')
export class ImparticionesController {
  constructor(private readonly service: ImparticionesService) {}

  // ── Coordinador ─────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Asignar un ponente a una actividad (Coordinador)' })
  asignar(@Body() dto: CreateImparticionDto) {
    return this.service.asignar(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Ver asignaciones filtrables por evento (Coordinador)' })
  findByEvento(@Query('eventoId') eventoId?: string) {
    if (eventoId) {
      return this.service.findByEvento(Number(eventoId));
    }
    return this.service.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Remover asignación de ponente (Coordinador)' })
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.service.remover(id);
  }
}
