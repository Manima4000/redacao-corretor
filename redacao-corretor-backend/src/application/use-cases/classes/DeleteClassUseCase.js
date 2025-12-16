import { NotFoundError, ForbiddenError } from '../../../utils/errors.js';

/**
 * Use Case para deletar turma
 * Segue o Single Responsibility Principle - só deleta turmas
 */
export class DeleteClassUseCase {
  constructor(classRepository) {
    this.classRepository = classRepository;
  }

  async execute(classId, requestingTeacherId) {
    // Buscar turma existente
    const existingClass = await this.classRepository.findById(classId);

    if (!existingClass) {
      throw new NotFoundError('Turma');
    }

    // Verificar se o professor está autorizado (apenas o dono da turma pode deletar)
    if (existingClass.teacherId !== requestingTeacherId) {
      throw new ForbiddenError('Você não tem permissão para deletar esta turma');
    }

    // Deletar a turma
    await this.classRepository.delete(classId);

    return true;
  }
}
