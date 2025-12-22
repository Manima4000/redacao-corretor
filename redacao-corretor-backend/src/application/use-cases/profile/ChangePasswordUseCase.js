import { NotFoundError, AuthorizationError, ValidationError } from '../../../utils/errors.js';

/**
 * ChangePasswordUseCase
 *
 * Altera a senha do usuário.
 * Valida a senha atual antes de permitir a mudança.
 *
 * @class ChangePasswordUseCase
 */
export class ChangePasswordUseCase {
  /**
   * @param {IStudentRepository} studentRepository
   * @param {ITeacherRepository} teacherRepository
   * @param {IAuthService} authService
   */
  constructor(studentRepository, teacherRepository, authService) {
    this.studentRepository = studentRepository;
    this.teacherRepository = teacherRepository;
    this.authService = authService;
  }

  /**
   * Executa o caso de uso
   *
   * @param {Object} params
   * @param {string} params.userId - ID do usuário logado
   * @param {string} params.userType - Tipo do usuário ('student' ou 'teacher')
   * @param {string} params.currentPassword - Senha atual (para verificação)
   * @param {string} params.newPassword - Nova senha
   * @returns {Promise<Object>} Mensagem de sucesso
   */
  async execute({ userId, userType, currentPassword, newPassword }) {
    // Validação básica
    if (!currentPassword || !newPassword) {
      throw new ValidationError('Senha atual e nova senha são obrigatórias');
    }

    if (newPassword.length < 6) {
      throw new ValidationError('Nova senha deve ter pelo menos 6 caracteres');
    }

    if (currentPassword === newPassword) {
      throw new ValidationError('Nova senha deve ser diferente da atual');
    }

    let user;
    let repository;

    // Buscar usuário
    if (userType === 'student') {
      repository = this.studentRepository;
      user = await repository.findById(userId);

      if (!user) {
        throw new NotFoundError('Aluno não encontrado');
      }

    } else if (userType === 'teacher') {
      repository = this.teacherRepository;
      user = await repository.findById(userId);

      if (!user) {
        throw new NotFoundError('Professor não encontrado');
      }

    } else {
      throw new ValidationError('Tipo de usuário inválido');
    }

    // Verificar senha atual
    const isPasswordValid = await this.authService.comparePasswords(
      currentPassword,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new AuthorizationError('Senha atual incorreta');
    }

    // Gerar hash da nova senha
    const newPasswordHash = await this.authService.hashPassword(newPassword);

    // Atualizar senha no banco
    await repository.update(userId, { passwordHash: newPasswordHash });

    return {
      message: 'Senha alterada com sucesso',
    };
  }
}
