/**
 * Use Case para buscar turmas
 * Segue o Single Responsibility Principle - só busca turmas
 */
export class GetClassesUseCase {
  constructor(classRepository) {
    this.classRepository = classRepository;
  }

  async execute(filters = {}) {
    const { teacherId } = filters;

    // Se teacherId for fornecido, busca turmas do professor
    if (teacherId) {
      const classes = await this.classRepository.findByTeacherId(teacherId);
      return classes.map(c => c.toPublicData());
    }

    // Caso contrário, busca todas as turmas
    const classes = await this.classRepository.findAll();
    return classes.map(c => c.toPublicData());
  }
}
