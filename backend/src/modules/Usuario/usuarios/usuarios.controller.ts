import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpStatus,
  UseGuards,
  Request,
  Query,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Res,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RegisterDto } from './dto/register.dto';
import { CrearPonenteDto } from './dto/crear-ponente.dto';
import { FiltrarUsuariosDto } from './dto/filtrar-usuarios.dto';
import { SolicitudRegistroDto } from './dto/solicitud-registro.dto';
import { VerificarRespaldoDto } from './dto/verificar-respaldo.dto';
import { JwtAuthGuard } from '../../Seguridad/auth/jwt-auth.guard';
import { RolesGuard } from '../../Seguridad/auth/roles.guard';
import { Roles } from '../../Seguridad/auth/roles.decorator';

@ApiTags('Usuarios')
@Controller('usuarios')
export class UsuariosController {
  private readonly logger = new Logger(UsuariosController.name);
  constructor(private readonly usuariosService: UsuariosService) { }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('verificar-respaldo')
  @ApiOperation({ summary: 'Verificar la contraseña de respaldo (CI) para cambio de rol' })
  async verificarRespaldo(@Request() req: any, @Body() dto: VerificarRespaldoDto) {
    const userId = Number(req.user.id);
    const userEmail = req.user.email;

    console.log(`[AUDITORÍA] Intento de verificación de respaldo - Usuario ID: ${userId}, Email: ${userEmail}`);

    const esValido = await this.usuariosService.verificarPasswordRespaldo(userId, dto.ci);

    if (!esValido) {
      console.warn(`[AUDITORÍA] Intento FALLIDO de verificación de respaldo - Usuario ID: ${userId}`);
      throw new BadRequestException('La contraseña de respaldo es incorrecta.');
    }

    console.log(`[AUDITORÍA] Verificación de respaldo EXITOSA - Usuario ID: ${userId}`);
    return { valid: true, message: 'Verificación exitosa.' };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('activar-ponente')
  @ApiOperation({ summary: 'Activar portal de ponente' })
  async activarPonente(@Request() req: any, @Body() body: { ci: string, password?: string }) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = Number(req.user.id);
    return this.usuariosService.activarPortalPonente(userId, body.ci, body.password || '');
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('alertas/estudiante')
  @ApiOperation({ summary: 'Obtener notificaciones dinámicas para el estudiante (bienvenida, perfil incompleto)' })
  async getAlertasEstudiante(@Request() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = Number(req.user.id);

    const usuario = await this.usuariosService.getPerfil(userId);
    const alertas: any[] = [];

    if (!usuario) return [];

    // 1. Notificación de Perfil
    if (!usuario.persona?.perfil_completado) {
      alertas.push({
        id: 'perfil-incompleto',
        titulo: '¡Bienvenido(a) al sistema!',
        mensaje: 'Complete toda la información de su perfil y guarde los cambios para continuar correctamente con su proceso.',
        tipo: 'warning',
        fecha: usuario.fecha_creacion,
        prioridad: 'alta'
      });
    }

    // 2. Notificaciones de Actividades Aceptadas
    if (usuario.inscripciones && usuario.inscripciones.length > 0) {
      usuario.inscripciones.forEach((insc: any) => {
        // Estado 1 = Aceptado/Inscrito
        if (insc.estado === 1) {
          alertas.push({
            id: `inscripcion-aceptada-${insc.id}`,
            titulo: 'Solicitud Aprobada',
            mensaje: `Has sido aceptado(a) en la actividad: "${insc.actividadAcademica?.nombre || 'Actividad'}". Ya puedes acceder al material.`,
            tipo: 'info',
            fecha: insc.fecha_actualizacion || insc.fecha_creacion,
            prioridad: 'media',
            link: { name: 'estudiante-actividades-detalle', params: { id: insc.actividadAcademica?.id } }
          });
        }
      });
    }

    // 3. Notificación de Designación como Ponente (Persistente hasta configuración)
    const esPonente = usuario.usuariosRoles?.some((ur: any) => ur.rol?.nombre_rol === 'Ponente');
    if (esPonente) {
      if (!usuario.persona?.ponente_configurado) {
        alertas.push({
          id: 'ponente-designado',
          titulo: '¡Nueva Designación!',
          mensaje: 'Usted ha sido designado como ponente. Configure su acceso desde el cambio de rol para activar su portal.',
          tipo: 'info',
          fecha: new Date(),
          prioridad: 'alta'
        });
      } else {
        // Notificación de Bienvenida post-activación
        alertas.push({
          id: 'ponente-bienvenida',
          titulo: '¡Bienvenido al Portal!',
          mensaje: 'Su portal de ponente ha sido activado. Aquí podrá gestionar sus actividades, notas y certificados.',
          tipo: 'success',
          fecha: new Date(),
          prioridad: 'media'
        });
      }
    }

    // 4. Notificación de Designación como Logística
    const esLogistica = usuario.usuariosRoles?.some((ur: any) => ur.rol?.nombre_rol === 'Logística');
    if (esLogistica) {
      alertas.push({
        id: 'logistica-designado',
        titulo: '¡Nueva Designación!',
        mensaje: 'Usted ha sido designado como personal de logística. Ahora tiene acceso a la herramienta de registro de asistencia en su menú lateral.',
        tipo: 'success',
        fecha: new Date(),
        prioridad: 'alta'
      });
    }

    return alertas;
  }

  @Roles('Super Usuario')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Get('email/:email')
  @ApiOperation({ summary: 'Buscar usuario por email' })
  async findByEmail(@Param('email') email: string) {
    const usuario = await this.usuariosService.findByEmail(email);
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return usuario;
  }

  // ══════════════════════════════════════════════════════════
  //  AUTH
  // POST /usuarios/login            → Iniciar sesión
  // POST /usuarios/registro         → Registro completo (usuario + persona)
  // PATCH /usuarios/:id/password    → Cambiar contraseña
  // ══════════════════════════════════════════════════════════

  /**
   * POST /usuarios/registro
   * Crea un usuario Y su persona en una sola transacción atómica.
   * Si algo falla, se hace rollback completo (no quedan datos a medias).
   */
  @Post('registro')
  @ApiOperation({ summary: 'Registro completo (Usuario + Persona)' })
  register(@Body() registerDto: RegisterDto) {
    return this.usuariosService.register(registerDto);
  }

  // ══════════════════════════════════════════════════════════
  // PERFIL METHODS
  // ══════════════════════════════════════════════════════════

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('perfil/datos')
  @ApiOperation({ summary: 'Actualizar datos personales del perfil' })
  async updatePerfil(@Request() req: any, @Body() data: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
    return this.usuariosService.actualizarPerfil(req.user.id, data);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('perfil/upload-foto')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const p = join(process.cwd(), 'uploads', 'perfiles');
          if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
          cb(null, p);
        },
        filename: (req: any, file, cb) => {
          const id = req.user?.id || 'unknown';
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `user_${id}${ext}`);
        },
      }),
      fileFilter: (req: any, file, cb) => {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
          cb(null, true);
        } else {
          cb(new Error('Extensiones válidas: JPG o PNG'), false);
        }
      },
    }),
  )
  @ApiOperation({ summary: 'Subir foto de perfil (JPG/PNG)' })
  uploadFoto(@Request() req: any, @UploadedFile() file: Express.Multer.File) {
    const idUsuario = req.user?.id;
    fs.appendFileSync('upload_debug.log', `[${new Date().toISOString()}] Inicio upload para usuario: ${idUsuario}\n`);

    if (!file) {
      fs.appendFileSync('upload_debug.log', `[${new Date().toISOString()}] Error: No hay archivo en el request\n`);
      throw new Error('No se pudo subir la foto de perfil');
    }

    fs.appendFileSync('upload_debug.log', `[${new Date().toISOString()}] Archivo recibido: ${file.originalname}, size: ${file.size}, path: ${file.path}\n`);

    const currentExt = extname(file.originalname).toLowerCase();

    // Clean up other extensions
    const exts = ['.jpg', '.jpeg', '.png'];
    for (const e of exts) {
      if (e !== currentExt) {
        const p = join(
          process.cwd(),
          'uploads/perfiles',
          `user_${idUsuario}${e}`,
        );
        try {
          if (fs.existsSync(p)) fs.unlinkSync(p);
        } catch (err) {
          fs.appendFileSync('upload_debug.log', `[${new Date().toISOString()}] Error limpiando archivo viejo ${p}: ${err}\n`);
        }
      }
    }
    fs.appendFileSync('upload_debug.log', `[${new Date().toISOString()}] Upload exitoso para usuario: ${idUsuario}\n`);
    return { message: 'Foto actualizada' };
  }

  @Get('perfil/foto')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener la foto de perfil' })
  getFoto(@Request() req: any, @Res() res: Response) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const id = req.user.id;
    const exts = ['.jpg', '.jpeg', '.png'];
    let filePath: string | null = null;

    for (const ext of exts) {
      const p = join(process.cwd(), 'uploads/perfiles', `user_${id}${ext}`);
      if (fs.existsSync(p)) {
        filePath = p;
        break;
      }
    }

    if (filePath) {
      res.sendFile(filePath);
    } else {
      // Devolvemos 200 pero con un mensaje para que el frontend sepa que no hay foto
      // Esto evita el log rojo 404 en la consola del navegador
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me/asistencia-qr')
  @ApiOperation({ summary: 'Obtener token dinámico para QR de asistencia' })
  async getAttendanceQR(@Request() req: any) {
    const token = await this.usuariosService.getAttendanceToken(req.user.id);
    return { token };
  }

  // ══════════════════════════════════════════════════════════
  // FIRMA DIGITAL (Ponentes)
  // ══════════════════════════════════════════════════════════

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Ponente', 'Coordinador', 'Super Usuario', 'Admin', 'Administrador')
  @ApiBearerAuth()
  @Post('perfil/upload-firma')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const p = join(process.cwd(), 'uploads', 'firmas');
          if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
          cb(null, p);
        },
        filename: (req: any, file, cb) => {
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `${uuidv4()}${ext}`);
        },
      }),
      fileFilter: (req: any, file, cb) => {
        if (file.mimetype === 'image/png') {
          cb(null, true);
        } else {
          cb(new Error('Extensión válida para firma: PNG'), false);
        }
      },
    }),
  )
  @ApiOperation({ summary: 'Subir firma digital (Solo PNG)' })
  async uploadFirma(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new Error('No se pudo subir la firma digital');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const idUsuario = req.user.id as number;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await (this.usuariosService as any).actualizarFirmaLocal(
      idUsuario,
      file.filename,
    );
    return { message: 'Firma digital actualizada', firma: file.filename };
  }

  @Get('perfil/firma')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener la firma digital (Ponente)' })
  async getFirma(@Request() req: any, @Res() res: Response) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const idUsuario = req.user.id as number;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const filePath = await (this.usuariosService as any).obtenerRutaFirmaLocal(
      idUsuario,
    );
    if (filePath) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      res.sendFile(filePath);
    } else {
      res.status(HttpStatus.NOT_FOUND).send('No digital signature');
    }
  }

  /**
   * PATCH /usuarios/:id/password
   * Cambia la contraseña verificando la contraseña actual.
   * La nueva contraseña se hashea antes de guardar.
   */
  @Patch(':id/password')
  @ApiOperation({ summary: 'Cambiar contraseña de un usuario' })
  changePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usuariosService.changePassword(id, changePasswordDto);
  }

  // ══════════════════════════════════════════════════════════
  //  CRUD BÁSICO
  // POST /usuarios          → Crear usuario simple (solo credenciales)
  // GET  /usuarios          → Listar todos (con perfil de persona)
  // GET  /usuarios/:id      → Ver uno por ID (con persona y roles)
  // PATCH /usuarios/:id     → Actualizar email/estado
  // DELETE /usuarios/:id    → Eliminar
  // ══════════════════════════════════════════════════════════

  /**
   * POST /usuarios
   * Crea solo las credenciales (sin perfil). Hashea la contraseña automáticamente.
   */
  @Post()
  @ApiOperation({ summary: 'Crear usuario simple (solo credenciales)' })
  create(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.usuariosService.create(createUsuarioDto);
  }

  /**
   * GET /usuarios
   * Usa FiltrarUsuariosDto para soportar ?rol=, ?q=, ?page=, ?limit=, ?soloActivos=
   * Si el coordinador pasa filtros → llama findConFiltros.
   * Si no hay filtros → comportamiento anterior (findAll).
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Listar usuarios (con filtros y paginación)' })
  findAll(@Query() filtros: FiltrarUsuariosDto) {
    // Si viene algún filtro de coordinador, usar la versión enriquecida
    if (filtros.rol || filtros.q || filtros.page || filtros.limit) {
      return this.usuariosService.findConFiltros(filtros);
    }
    const filtrar = filtros.soloActivos !== 'false';
    this.logger.log(`Listando usuarios (findAll) - soloActivos: ${filtrar}`);
    return this.usuariosService.findAll(filtrar);
  }

  /**
   * GET /usuarios/public/equipo
   * Endpoint público para la landing page. Retorna Ponentes y Coordinadores.
   */
  @Get('public/equipo')
  @ApiOperation({ summary: 'Listar equipo para la página pública (Landing)' })
  async findEquipoPublico(@Query('rol') rol: string) {
    const filtros = new FiltrarUsuariosDto();
    filtros.rol = rol || 'Ponente'; // Por defecto Ponente
    filtros.limit = 100;
    return this.usuariosService.findConFiltros(filtros);
  }

  /**
   * GET /usuarios/:id
   * Busca un usuario por ID. Incluye persona + roles asignados.
   */
  /**
   * PATCH /usuarios/:id/roles
   * Actualización masiva de roles de un usuario con opción de notificación.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Super Usuario', 'Coordinador')
  @ApiBearerAuth()
  @Patch(':id/roles')
  @ApiOperation({ summary: 'Actualización masiva de roles de un usuario' })
  async updateRolesBulk(
    @Param('id', ParseIntPipe) id: number,
    @Body('rolIds') rolIds: number[],
    @Body('notificar') notificar?: boolean,
  ) {
    return this.usuariosService.actualizarRolesBulk(id, rolIds, notificar ?? true);
  }

  /**
   * GET /usuarios/:id
   * Busca un usuario por ID. Incluye persona + roles asignados.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.findOne(id);
  }

  /**
   * GET /usuarios/:id/perfil
   * Perfil completo: usuario + persona + roles + afiliaciones.
   * Ejemplo de endpoint que hace join con múltiples tablas.
   */
  @Get(':id/perfil')
  @ApiOperation({ summary: 'Obtener perfil detallado de un usuario' })
  getPerfil(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.getPerfil(id);
  }

  /**
   * PATCH /usuarios/:id
   * Actualiza email y/o estado. No permite cambio de password por aquí
   * (usar PATCH /usuarios/:id/password).
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar email/estado de un usuario' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
    @Query('notificar') notificar?: string,
  ) {
    return this.usuariosService.update(id, updateUsuarioDto, notificar !== 'false');
  }

  /**
   * DELETE /usuarios/:id
   * Deshabilita el usuario (estado=0). No elimina físicamente por seguridad.
   * Solo accesible por Coordinador o Super Usuario.
   */
  @Roles('Coordinador', 'Super Usuario')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Deshabilitar usuario (Coord/Admin)' })
  deshabilitarUsuario(
    @Param('id', ParseIntPipe) id: number,
    @Query('notificar') notificar?: string,
  ) {
    return this.usuariosService.deshabilitarUsuario(id, notificar !== 'false');
  }

  // ══════════════════════════════════════════════════════════
  //  GESTIÓN DE ROLES
  // ══════════════════════════════════════════════════════════

  @Roles('Super Usuario', 'Coordinador')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Post(':id/roles/asignar')
  @ApiOperation({
    summary: 'Asignar un rol adicional a un usuario (Admin/Coord)',
  })
  async asignarRol(
    @Param('id', ParseIntPipe) id: number,
    @Body('rolId', ParseIntPipe) rolId: number,
  ) {
    return this.usuariosService.asignarRol(id, rolId);
  }

  @Roles('Super Usuario', 'Coordinador')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Post(':id/roles/quitar')
  @ApiOperation({ summary: 'Quitar un rol de un usuario (Admin/Coord)' })
  quitarRol(
    @Param('id', ParseIntPipe) id: number,
    @Body('rolId', ParseIntPipe) rolId: number,
  ) {
    return this.usuariosService.quitarRol(id, rolId);
  }

  @Roles('Super Usuario')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Delete(':id/fisico')
  @ApiOperation({ summary: 'Eliminar físicamente (Solo Super Usuario)' })
  eliminarFisico(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.eliminarFisico(id);
  }

  // ══════════════════════════════════════════════════════════
  //  ENDPOINTS COORDINADOR
  // ══════════════════════════════════════════════════════════

  /**
   * POST /usuarios/ponente
   * Crea un ponente completo (credenciales + persona + rol Ponente).
   * Solo accesible por Coordinador o Super Usuario.
   */
  @Roles('Coordinador', 'Super Usuario')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Post('ponente')
  @ApiOperation({ summary: 'Crear un ponente directamente (Coord/Admin)' })
  crearPonente(@Body() dto: CrearPonenteDto) {
    return this.usuariosService.crearPonente(dto);
  }

  @Roles('Coordinador', 'Super Usuario')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Patch(':id/perfil-completo')
  @ApiOperation({ summary: 'Actualización administrativa de datos (Persona + Afiliación)' })
  actualizarDatosAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
  ) {
    return this.usuariosService.actualizarDatosAdmin(id, data);
  }

  // La ruta de deshabilitar ha sido movida arriba para evitar duplicidad

  // ══════════════════════════════════════════════════════════
  //  INSCRIPCIONES Y CERTIFICADOS DE UN USUARIO (Coordinador)
  // ══════════════════════════════════════════════════════════

  /**
   * GET /usuarios/:id/inscripciones
   * Historial de inscripciones de un usuario con datos de actividad y nota.
   * Accesible por Coordinador y Super Usuario.
   */
  @Roles('Coordinador', 'Super Usuario', 'Logística')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Get(':id/inscripciones')
  @ApiOperation({ summary: 'Inscripciones de un usuario (Coord/Admin)' })
  findInscripciones(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.findInscripciones(id);
  }

  /**
   * GET /usuarios/:id/certificados
   * Certificados emitidos para un usuario.
   * Accesible por Coordinador, Super Usuario y el propio estudiante.
   */
  @Roles('Coordinador', 'Super Usuario', 'Logística')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Get(':id/certificados')
  @ApiOperation({ summary: 'Certificados emitidos de un usuario (Coord/Admin)' })
  findCertificados(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.findCertificados(id);
  }

  /**
   * GET /usuarios/me/certificados
   * Certificados del usuario autenticado. Endpoint dedicado para el estudiante.
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me/certificados')
  @ApiOperation({ summary: 'Mis certificados (Estudiante autenticado)' })
  misCertificados(@Request() req: any) {
    return this.usuariosService.findCertificados(req.user.id);
  }

  // ══════════════════════════════════════════════════════════
  //  GESTIÓN DE ROLES AVANZADA
  // ══════════════════════════════════════════════════════════



  // ══════════════════════════════════════════════════════════
  //  SOLICITUDES DE REGISTRO
  // ══════════════════════════════════════════════════════════

  @Post('solicitud')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'file', maxCount: 1 },
        { name: 'fileReverso', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './uploads/firmas',
          filename: (req, file, cb) => {
            const ext = extname(file.originalname).toLowerCase();
            cb(null, `aval_${uuidv4()}${ext}`);
          },
        }),
        fileFilter: (req, file, cb) => {
          if (
            file.mimetype === 'application/pdf' ||
            file.mimetype.startsWith('image/')
          ) {
            cb(null, true);
          } else {
            cb(
              new BadRequestException(
                'Solo se permiten archivos PDF o imágenes (JPG, PNG).',
              ),
              false,
            );
          }
        },
      },
    ),
  )
  @ApiOperation({
    summary: 'Registrar solicitud con aval adjunto (estado=2, no loguea aún)',
  })
  async registrarSolicitud(
    @Body() dto: SolicitudRegistroDto,
    @UploadedFiles()
    files: {
      file?: Express.Multer.File[];
      fileReverso?: Express.Multer.File[];
    },
  ) {
    const mainFile = files.file?.[0];
    const reversoFile = files.fileReverso?.[0];

    if (!mainFile) {
      throw new BadRequestException('El documento de aval es obligatorio.');
    }

    // Si es imagen, concatenamos nombres si existe reverso
    const docPath = reversoFile
      ? `${mainFile.filename}|${reversoFile.filename}`
      : mainFile.filename;

    return this.usuariosService.registrarSolicitud(dto, docPath);
  }

  @Roles('Coordinador', 'Super Usuario')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Get('solicitudes/pendientes')
  @ApiOperation({
    summary: 'Listar usuarios en estado pendiente de aprobación (estado=2)',
  })
  async listarSolicitudesPendientes() {
    return this.usuariosService.listarSolicitudesPendientes();
  }

  @Roles('Coordinador', 'Super Usuario')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Patch(':id/solicitud/:accion')
  @ApiOperation({ summary: 'Aprobar o rechazar solicitud (accion: aprobar|rechazar)' })
  async aprobarRechazarSolicitud(
    @Param('id', ParseIntPipe) id: number,
    @Param('accion') accion: 'aprobar' | 'rechazar',
    @Body('motivo') motivo?: string,
  ) {
    if (accion !== 'aprobar' && accion !== 'rechazar') {
      throw new BadRequestException('Acción inválida. Use aprobar o rechazar.');
    }
    return this.usuariosService.aprobarRechazarSolicitud(id, accion, motivo);
  }

  @Roles('Coordinador', 'Super Usuario')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Get(':id/doc-aval')
  @ApiOperation({ summary: 'Descargar/Ver documento de aval del usuario' })
  async obtenerDocAval(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
    @Query('parte') parte?: string,
  ) {
    const usuario = await this.usuariosService.getPerfil(id);

    if (!usuario || !usuario.persona || !usuario.persona.firma_dig) {
      throw new BadRequestException(
        'El usuario no tiene un documento de aval o no existe.',
      );
    }

    const docPathStr = usuario.persona.firma_dig;

    // Si contiene |, es que hay anverso y reverso
    const files = docPathStr.split('|');
    let targetFile = files[0];

    if (parte === 'reverso' && files.length > 1) {
      targetFile = files[1];
    }

    const absolutePath = join(process.cwd(), 'uploads', 'firmas', targetFile);

    if (!fs.existsSync(absolutePath)) {
      throw new BadRequestException('El archivo físico no existe en el servidor.');
    }

    res.sendFile(absolutePath);
  }

  @Roles('Super Usuario')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Patch(':id/forzar-reset')
  @ApiOperation({ summary: 'Forzar cambio de contraseña (Solo Super Usuario)' })
  async forzarReset(
    @Param('id', ParseIntPipe) id: number,
    @Body('password') nuevaPassword: string,
    @Body('tipo') tipo: 'principal' | 'ponente' = 'principal',
  ) {
    if (!nuevaPassword || nuevaPassword.length < 4) {
      throw new BadRequestException('La nueva contraseña debe tener al menos 4 caracteres.');
    }
    return this.usuariosService.forzarCambioPassword(id, nuevaPassword, tipo);
  }

  @Roles('Super Usuario')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Patch(':id/habilitar-edicion')
  @ApiOperation({ summary: 'Habilitar edición de perfil (Solo Super Usuario)' })
  async habilitarEdicion(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.habilitarEdicion(id);
  }
}

