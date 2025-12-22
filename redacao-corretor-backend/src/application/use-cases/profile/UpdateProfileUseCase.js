import { NotFoundError, ConflictError, ValidationError } from '../../../utils/errors.js';

/**
 * UpdateProfileUseCase
 *
 * Atualiza informações do perfil do usuário (email e nome).
 * Valida se o novo email já não está em uso por outro usuário.
 *
 * @class UpdateProfileUseCase
 */
export class UpdateProfileUseCase {
  /**
   * @param {IStudentRepository} studentRepository
   * @param {ITeacherRepository} teacherRepository
   */
  constructor(studentRepository, teacherRepository) {
    this.studentRepository = studentRepository;
    this.teacherRepository = teacherRepository;
  }

  /**
   * Executa o caso de uso
   *
   * @param {Object} params
   * @param {string} params.userId - ID do usuário logado
   * @param {string} params.userType - Tipo do usuário ('student' ou 'teacher')
   * @param {string} [params.email] - Novo email (opcional)
   * @param {string} [params.fullName] - Novo nome completo (opcional)
   * @param {string} [params.enrollmentNumber] - Nova matrícula (apenas student, opcional)
   * @param {string} [params.specialization] - Nova especialização (apenas teacher, opcional)
   * @returns {Promise<Object>} Usuário atualizado
   */
  async execute({ userId, userType, email, fullName, enrollmentNumber, specialization }) {
    // Validação básica
    if (!email && !fullName && !enrollmentNumber && !specialization) {
      throw new ValidationError('Nenhum campo para atualizar foi fornecido');
    }

    if (email && (!email.includes('@') || email.length < 5)) {
      throw new ValidationError('Email inválido');
    }

    if (fullName && fullName.trim().length < 3) {
      throw new ValidationError('Nome completo deve ter pelo menos 3 caracteres');
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

    // Se está mudando o email, verificar se já não existe
    if (email && email !== user.email) {
      const existingStudent = await this.studentRepository.findByEmail(email);
      const existingTeacher = await this.teacherRepository.findByEmail(email);

      if (existingStudent || existingTeacher) {
        throw new ConflictError('Este email já está cadastrado');
      }
    }

    // Preparar dados para atualização
    const updateData = {};

    if (email) updateData.email = email;
    if (fullName) updateData.fullName = fullName;

    // Campos específicos por tipo
    if (userType === 'student' && enrollmentNumber !== undefined) {
      updateData.enrollmentNumber = enrollmentNumber;
    }

    if (userType === 'teacher' && specialization !== undefined) {
      updateData.specialization = specialization;
    }

    // Atualizar usuário
    const updatedUser = await repository.update(userId, updateData);

    return {
      user: updatedUser.toPublicData(),
    };
  }
}
