import { Test, TestingModule } from '@nestjs/testing';
import { CertificadosPdfService } from './certificados-pdf.service';
import { CertificadosService } from './certificados.service';
import { NotFoundException } from '@nestjs/common';

describe('CertificadosPdfService', () => {
  let service: CertificadosPdfService;
  let certificadosService: CertificadosService;

  const mockCertificadosService = {
    findOne: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificadosPdfService,
        {
          provide: CertificadosService,
          useValue: mockCertificadosService
        }
      ],
    }).compile();

    service = module.get<CertificadosPdfService>(CertificadosPdfService);
    certificadosService = module.get<CertificadosService>(CertificadosService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('generarPdfBuffer', () => {
    it('debe lanzar NotFoundException si el certificado no existe', async () => {
      mockCertificadosService.findOne.mockResolvedValue(null);

      await expect(service.generarPdfBuffer(999, 1)).rejects.toThrow(NotFoundException);
      expect(mockCertificadosService.findOne).toHaveBeenCalledWith(999);
    });

    it('debe retornar un Buffer cuando el certificado existe', async () => {
      mockCertificadosService.findOne.mockResolvedValue({
        id: 1,
        tipo: 1,
        fecha_emision: new Date(),
        usuario: {
          id: 1,
          persona: {
            nombres: 'Juan',
            primer_apellido: 'Perez',
            segundo_apellido: 'Gomez'
          }
        },
        actividadAcademica: {
          id: 1,
          nombre: 'Actividad de Prueba',
          evento: {
            id: 1,
            nombre: 'Evento de Prueba'
          }
        }
      });

      const buffer = await service.generarPdfBuffer(1, 1);
      
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      expect(mockCertificadosService.findOne).toHaveBeenCalledWith(1);
    });
  });
});
