import { Controller, Post, Get, Patch, Body, Param, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SoporteService } from './soporte.service';
import { JwtAuthGuard } from '../../Seguridad/auth/jwt-auth.guard';
import { RolesGuard } from '../../Seguridad/auth/roles.guard';
import { Roles } from '../../Seguridad/auth/roles.decorator';

@ApiTags('Soporte')
@Controller('soporte')
export class SoporteController {
  constructor(private readonly soporteService: SoporteService) {}

  @Post()
  @ApiOperation({ summary: 'Enviar una solicitud de soporte' })
  async enviarTicket(
    @Request() req,
    @Body('tipo') tipo: string,
    @Body('mensaje') mensaje: string,
    @Body('usuarioId') usuarioId?: number,
    @Body('email') email?: string,
  ) {
    // Si hay token, extraemos el ID del usuario, si no, usamos el que venga en el body o null
    const id = req.user?.id || usuarioId || null;
    return await this.soporteService.crearSolicitud(id, tipo, mensaje, email);
  }

  @Roles('Super Usuario')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Listar todos los tickets (Admin)' })
  async listarTickets() {
    return await this.soporteService.obtenerTodas();
  }

  @Roles('Super Usuario')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Patch(':id/resolver')
  @ApiOperation({ summary: 'Marcar ticket como resuelto' })
  async resolver(@Param('id', ParseIntPipe) id: number) {
    return await this.soporteService.resolverSolicitud(id);
  }

  @Roles('Super Usuario')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Patch(':id/archivar')
  @ApiOperation({ summary: 'Archivar ticket (borrado lógico)' })
  async archivar(@Param('id', ParseIntPipe) id: number) {
    return await this.soporteService.archivarSolicitud(id);
  }

  @Roles('Super Usuario')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Patch(':id/vincular/:usuarioId')
  @ApiOperation({ summary: 'Vincular un usuario a un ticket externo' })
  async vincular(
    @Param('id', ParseIntPipe) id: number,
    @Param('usuarioId', ParseIntPipe) usuarioId: number
  ) {
    return await this.soporteService.vincularUsuario(id, usuarioId);
  }
}
