import { NotFoundError } from '../../../utils/errors.js';

/**
 * Use Case para buscar turma por ID
 * Segue o Single Responsibility Principle - só busca uma turma
 */
export class GetClassByIdUseCase {
  constructor(classRepository) {
    this.classRepository = classRepository;
  }

  async execute(classId) {
    const classEntity = await this.classRepository.findById(classId);

    if (!classEntity) {
      throw new NotFoundError('Turma');
    }

    return classEntity.toPublicData();
  }
}
