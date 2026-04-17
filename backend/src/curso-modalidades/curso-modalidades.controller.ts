import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CursoModalidadesService } from './curso-modalidades.service';
import { CreateCursoModalidadDto } from './dto/create-curso-modalidad.dto';
import { UpdateCursoModalidadDto } from './dto/update-curso-modalidad.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Curso Modalidades')
@Controller('curso-modalidades')
export class CursoModalidadesController {
  constructor(private readonly service: CursoModalidadesService) {}

  // ── Coordinador ─────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Crear una modalidad (Coordinador)' })
  create(@Body() dto: CreateCursoModalidadDto) {
    return this.service.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Listar modalidades por actividad (Coordinador)' })
  findAll(@Query('actividadId') actividadId?: string) {
    if (actividadId) {
      return this.service.findByActividad(Number(actividadId));
    }
    return this.service.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Detalle de modalidad (Coordinador)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Put(':id')
  @ApiOperation({ summary: 'Editar modalidad (Coordinador)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCursoModalidadDto,
  ) {
    return this.service.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar modalidad (Coordinador)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
