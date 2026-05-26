import { Controller, Get, UseGuards, Request, Param, ParseIntPipe, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProduces } from '@nestjs/swagger';
import { CertificadosService } from './certificados.service';
import { CertificadosPdfService } from './certificados-pdf.service';
import { JwtAuthGuard } from '../../Seguridad/auth/jwt-auth.guard';

@ApiTags('Certificados (Mi Cuenta)')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('me/certificados')
export class CertificadosMeController {
  constructor(
    private readonly service: CertificadosService,
    private readonly pdfService: CertificadosPdfService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Mis certificados (Usuario autenticado)' })
  misCertificados(@Request() req: any) {
    return this.service.findByUsuario(req.user.id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Descargar certificado en PDF al vuelo' })
  @ApiProduces('application/pdf')
  async download(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Res() res: any,
  ) {
    const buffer = await this.pdfService.generarPdfBuffer(id, req.user.id);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="certificado_${id}.pdf"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}
