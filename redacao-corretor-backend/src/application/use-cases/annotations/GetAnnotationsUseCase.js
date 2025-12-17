import { NotFoundError, ForbiddenError } from '../../../utils/errors.js';

/**
 * Use Case: Buscar Anotações de Redação
 *
 * Responsabilidades:
 * 1. Validar que a redação existe
 * 2. Validar permissões (professor da turma OU aluno dono da redação)
 * 3. Buscar todas as anotações (por página se for PDF multi-página)
 *
 * Segue SOLID:
 * - SRP: Apenas orquestra busca de anotações
 * - DIP: Depende de abstrações (repositories)
 *
 * @class
 */
export class GetAnnotationsUseCase {
  /**
   * @param {IAnnotationRepository} annotationRepository - Repositório de anotações
   * @param {IEssayRepository} essayRepository - Repositório de redações
   * @param {ITaskRepository} taskRepository - Repositório de tarefas
   */
  constructor(annotationRepository, essayRepository, taskRepository) {
    this.annotationRepository = annotationRepository;
    this.essayRepository = essayRepository;
    this.taskRepository = taskRepository;
  }

  /**
   * Executa a busca das anotações
   *
   * @async
   * @param {Object} params - Parâmetros
   * @param {string} params.essayId - ID da redação
   * @param {string} params.userId - ID do usuário (professor ou aluno)
   * @param {string} params.userType - Tipo do usuário ('teacher' ou 'student')
   * @param {number} [params.pageNumber] - Número da página específica (opcional)
   * @returns {Promise<Object|Array>} Anotação(ões)
   * @throws {NotFoundError} Se redação não existir
   * @throws {ForbiddenError} Se não tiver permissão
   */
  async execute({ essayId, userId, userType, pageNumber = null }) {
    // 1. Validar que a redação existe
    const essay = await this.essayRepository.findById(essayId);

    if (!essay) {
      throw new NotFoundError('Redação');
    }

    // 2. Validar permissões
    await this._validatePermissions(essay, userId, userType);

    // 3. Buscar anotações
    if (pageNumber !== null) {
      // Buscar anotação de página específica
      const annotation = await this.annotationRepository.findByPage(essayId, pageNumber);

      return annotation || { essayId, pageNumber, annotationData: { version: '1.0', lines: [] } };
    } else {
      // Buscar todas as anotações (todas as páginas)
      const annotations = await this.annotationRepository.findByEssay(essayId);

      // Se não houver anotações, retornar estrutura vazia
      if (annotations.length === 0) {
        return [
          {
            essayId,
            pageNumber: 1,
            annotationData: { version: '1.0', lines: [] },
          },
        ];
      }

      return annotations;
    }
  }

  /**
   * Valida se o usuário tem permissão para ver as anotações
   *
   * Permissões:
   * - Professor: Pode ver anotações de redações da sua turma
   * - Aluno: Pode ver apenas anotações da própria redação
   *
   * @private
   * @async
   * @param {Object} essay - Redação
   * @param {string} userId - ID do usuário
   * @param {string} userType - Tipo ('teacher' ou 'student')
   * @throws {ForbiddenError} Se não tiver permissão
   */
  async _validatePermissions(essay, userId, userType) {
    if (userType === 'student') {
      // Aluno só pode ver anotações da própria redação
      if (essay.studentId !== userId) {
        throw new ForbiddenError('Você não tem permissão para ver esta redação');
      }
    } else if (userType === 'teacher') {
      // Professor pode ver redações da sua turma
      // TODO: Validar que o professor é dono da turma
      // Por enquanto, qualquer professor pode ver qualquer redação
    } else {
      throw new ForbiddenError('Tipo de usuário inválido');
    }
  }
}
