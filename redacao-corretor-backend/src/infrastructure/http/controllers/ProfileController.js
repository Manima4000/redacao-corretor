import { GetMyProfileUseCase } from '../../../application/use-cases/profile/GetMyProfileUseCase.js';
import { UpdateProfileUseCase } from '../../../application/use-cases/profile/UpdateProfileUseCase.js';
import { ChangePasswordUseCase } from '../../../application/use-cases/profile/ChangePasswordUseCase.js';
import { StudentRepository } from '../../database/repositories/StudentRepository.js';
import { TeacherRepository } from '../../database/repositories/TeacherRepository.js';
import { ClassRepository } from '../../database/repositories/ClassRepository.js';
import { AuthService } from '../../services/AuthService.js';

/**
 * Controller para gerenciamento de perfil de usuário
 * Segue SRP - apenas lida com requisições HTTP e delega para use cases
 */
export class ProfileController {
  constructor() {
    // Dependency Injection
    this.studentRepository = new StudentRepository();
    this.teacherRepository = new TeacherRepository();
    this.classRepository = new ClassRepository();
    this.authService = new AuthService();

    this.getMyProfileUseCase = new GetMyProfileUseCase(
      this.studentRepository,
      this.teacherRepository,
      this.classRepository
    );

    this.updateProfileUseCase = new UpdateProfileUseCase(
      this.studentRepository,
      this.teacherRepository
    );

    this.changePasswordUseCase = new ChangePasswordUseCase(
      this.studentRepository,
      this.teacherRepository,
      this.authService
    );

    // Bind dos métodos (para manter contexto quando usado como callback)
    this.getMyProfile = this.getMyProfile.bind(this);
    this.updateProfile = this.updateProfile.bind(this);
    this.changePassword = this.changePassword.bind(this);
  }

  /**
   * GET /api/profile
   * Busca perfil completo do usuário logado
   */
  async getMyProfile(req, res, next) {
    try {
      const { id: userId, userType } = req.user;

      const result = await this.getMyProfileUseCase.execute({
        userId,
        userType,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/profile
   * Atualiza informações do perfil (email, nome, etc)
   */
  async updateProfile(req, res, next) {
    try {
      const { id: userId, userType } = req.user;
      const { email, fullName, enrollmentNumber, specialization } = req.body;

      const result = await this.updateProfileUseCase.execute({
        userId,
        userType,
        email,
        fullName,
        enrollmentNumber,
        specialization,
      });

      res.status(200).json({
        success: true,
        message: 'Perfil atualizado com sucesso',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/profile/password
   * Altera a senha do usuário
   */
  async changePassword(req, res, next) {
    try {
      const { id: userId, userType } = req.user;
      const { currentPassword, newPassword } = req.body;

      const result = await this.changePasswordUseCase.execute({
        userId,
        userType,
        currentPassword,
        newPassword,
      });

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}
