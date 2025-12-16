/**
 * Use Case para criação de turma
 * Segue o Single Responsibility Principle - só cria turmas
 */
export class CreateClassUseCase {
  constructor(classRepository, teacherRepository) {
    this.classRepository = classRepository;
    this.teacherRepository = teacherRepository;
  }

  async execute(createClassDTO) {
    // Verificar se o professor existe
    const teacher = await this.teacherRepository.findById(createClassDTO.teacherId);

    if (!teacher) {
      throw new Error('Professor não encontrado');
    }

    // Criar a turma
    const classEntity = await this.classRepository.create({
      name: createClassDTO.name,
      description: createClassDTO.description,
      teacherId: createClassDTO.teacherId,
    });

    return classEntity.toPublicData();
  }
}
