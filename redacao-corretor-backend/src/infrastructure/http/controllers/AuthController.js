import { RegisterUseCase } from '../../../application/use-cases/auth/RegisterUseCase.js';
import { LoginUseCase } from '../../../application/use-cases/auth/LoginUseCase.js';
import { RefreshTokenUseCase } from '../../../application/use-cases/auth/RefreshTokenUseCase.js';
import { RegisterDTO } from '../../../application/dtos/RegisterDTO.js';
import { LoginDTO } from '../../../application/dtos/LoginDTO.js';
import { StudentRepository } from '../../database/repositories/StudentRepository.js';
import { TeacherRepository } from '../../database/repositories/TeacherRepository.js';
import { AuthService } from '../../services/AuthService.js';

/**
 * Controller para autenticação
 * Segue SRP - apenas lida com requisições HTTP e delega para use cases
 */
export class AuthController {
  constructor() {
    // Dependency Injection
    this.studentRepository = new StudentRepository();
    this.teacherRepository = new TeacherRepository();
    this.authService = new AuthService();

    this.registerUseCase = new RegisterUseCase(
      this.studentRepository,
      this.teacherRepository,
      this.authService
    );

    this.loginUseCase = new LoginUseCase(
      this.studentRepository,
      this.teacherRepository,
      this.authService
    );

    this.refreshTokenUseCase = new RefreshTokenUseCase(
      this.studentRepository,
      this.teacherRepository,
      this.authService
    );

    // Bind dos métodos (para manter contexto quando usado como callback)
    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
    this.refresh = this.refresh.bind(this);
    this.me = this.me.bind(this);
  }

  /**
   * POST /api/auth/register
   * Registra um novo usuário
   */
  async register(req, res, next) {
    try {
      const registerDTO = new RegisterDTO(req.body);
      const result = await this.registerUseCase.execute(registerDTO);

      res.status(201).json({
        success: true,
        message: 'Usuário registrado com sucesso',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   * Faz login de um usuário
   */
  async login(req, res, next) {
    try {
      const loginDTO = new LoginDTO(req.body);
      const result = await this.loginUseCase.execute(loginDTO);

      res.status(200).json({
        success: true,
        message: 'Login realizado com sucesso',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/refresh
   * Renova o access token usando refresh token
   */
  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token não fornecido',
        });
      }

      const result = await this.refreshTokenUseCase.execute(refreshToken);

      res.status(200).json({
        success: true,
        message: 'Token renovado com sucesso',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   * Retorna dados do usuário autenticado
   * Requer authMiddleware
   */
  async me(req, res, next) {
    try {
      // Buscar em ambas as tabelas
      let user = await this.studentRepository.findById(req.user.id);

      if (!user) {
        user = await this.teacherRepository.findById(req.user.id);
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Usuário não encontrado',
        });
      }

      res.status(200).json({
        success: true,
        data: user.toPublicData(),
      });
    } catch (error) {
      next(error);
    }
  }
}
