import { NotFoundError } from "../../../utils/errors.js";

/**
 * GetMyProfileUseCase
 *
 * Busca o perfil completo do usuário logado, incluindo suas turmas.
 *
 * Para estudantes: retorna dados do aluno + turma que pertence
 * Para professores: retorna dados do professor + turmas que criou
 *
 * @class GetMyProfileUseCase
 */
export class GetMyProfileUseCase {
  /**
   * @param {IStudentRepository} studentRepository
   * @param {ITeacherRepository} teacherRepository
   * @param {IClassRepository} classRepository
   */
  constructor(studentRepository, teacherRepository, classRepository) {
    this.studentRepository = studentRepository;
    this.teacherRepository = teacherRepository;
    this.classRepository = classRepository;
  }

  /**
   * Executa o caso de uso
   *
   * @param {Object} params
   * @param {string} params.userId - ID do usuário logado
   * @param {string} params.userType - Tipo do usuário ('student' ou 'teacher')
   * @returns {Promise<Object>} Perfil completo do usuário
   */
  async execute({ userId, userType }) {
    let user;
    let classes = [];

    if (userType === 'student') {
      // Buscar aluno
      user = await this.studentRepository.findById(userId);

      if (!user) {
        throw new NotFoundError('Aluno não encontrado');
      }

      // Se o aluno tem uma turma, buscar os dados dela
      if (user.classId) {
        const studentClass = await this.classRepository.findById(user.classId);
        if (studentClass) {
          classes = [studentClass];
        }
      }

    } else if (userType === 'teacher') {
      // Buscar professor
      user = await this.teacherRepository.findById(userId);

      if (!user) {
        throw new NotFoundError('Professor não encontrado');
      }

      // Buscar todas as turmas criadas pelo professor
      classes = await this.classRepository.findByTeacherId(userId);

    } else {
      throw new NotFoundError('Tipo de usuário inválido');
    }

    // Retornar perfil completo
    return {
      user: user.toPublicData(),
      classes: classes.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    };
  }
}
