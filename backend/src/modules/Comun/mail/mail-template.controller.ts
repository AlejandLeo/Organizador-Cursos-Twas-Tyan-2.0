<<<<<<< HEAD
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
=======
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
>>>>>>> ba9255c45525f0d13cc726801e273abb8daa4315
import { MailTemplateService } from './mail-template.service';
import { MailTemplateType } from './entities/mail-template.entity';
import { JwtAuthGuard } from '../../Seguridad/auth/jwt-auth.guard';
import { RolesGuard } from '../../Seguridad/auth/roles.guard';
import { Roles } from '../../Seguridad/auth/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Admin - Plantillas de Correo')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/mail-templates')
export class MailTemplateController {
  constructor(private readonly mailTemplateService: MailTemplateService) {}

  @Get()
  @Roles('Super Usuario')
  @ApiOperation({ summary: 'Listar todas las plantillas de correo' })
  findAll() {
    return this.mailTemplateService.findAll();
  }

<<<<<<< HEAD
  @Get('default-preview')
  @Roles('Super Usuario')
  @ApiOperation({ summary: 'Devuelve el HTML de admission.hbs con datos de muestra para previsualización' })
  getDefaultPreview() {
    const templatePath = path.join(process.cwd(), 'src', 'modules', 'Comun', 'mail', 'templates', 'admission.hbs');
    let html = fs.readFileSync(templatePath, 'utf-8');

    const sampleContext: Record<string, string> = {
      nombre: 'Juan',
      apellidos: 'Pérez',
      email: 'ejemplo@correo.com',
      password: 'Contraseña123',
      loginUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    };

    Object.keys(sampleContext).forEach((key) => {
      html = html.replace(new RegExp(`{{${key}}}`, 'g'), sampleContext[key]);
    });

    return { html };
  }

=======
>>>>>>> ba9255c45525f0d13cc726801e273abb8daa4315
  @Get('tipo/:tipo')
  @ApiOperation({ summary: 'Listar plantillas por tipo (WELCOME, ENROLLMENT, etc)' })
  findByTipo(@Param('tipo') tipo: MailTemplateType) {
    return this.mailTemplateService.findByTipo(tipo);
  }

  @Get(':id')
  @Roles('Super Usuario')
  findOne(@Param('id') id: string) {
    return this.mailTemplateService.findOne(+id);
  }

  @Post()
  @Roles('Super Usuario')
  create(@Body() data: any) {
    return this.mailTemplateService.create(data);
  }

  @Patch(':id')
  @Roles('Super Usuario')
  update(@Param('id') id: string, @Body() data: any) {
    return this.mailTemplateService.update(+id, data);
  }

  @Delete(':id')
  @Roles('Super Usuario')
  remove(@Param('id') id: string) {
    return this.mailTemplateService.remove(+id);
  }
}
