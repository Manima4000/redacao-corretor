import { NotFoundError, ForbiddenError } from '../../../utils/errors.js';

/**
 * Use Case para atualizar turma
 * Segue o Single Responsibility Principle - só atualiza turmas
 */
export class UpdateClassUseCase {
  constructor(classRepository) {
    this.classRepository = classRepository;
  }

  async execute(classId, updateClassDTO, requestingTeacherId) {
    // Buscar turma existente
    const existingClass = await this.classRepository.findById(classId);

    if (!existingClass) {
      throw new NotFoundError('Turma');
    }

    // Verificar se o professor está autorizado (apenas o dono da turma pode atualizar)
    if (existingClass.teacherId !== requestingTeacherId) {
      throw new ForbiddenError('Você não tem permissão para atualizar esta turma');
    }

    // Atualizar a turma
    const updatedClass = await this.classRepository.update(classId, {
      name: updateClassDTO.name,
      description: updateClassDTO.description,
    });

    return updatedClass.toPublicData();
  }
}
