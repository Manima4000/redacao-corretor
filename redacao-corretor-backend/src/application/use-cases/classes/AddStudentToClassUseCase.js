import { NotFoundError, ForbiddenError } from '../../../utils/errors.js';

export class AddStudentToClassUseCase {
  constructor(classRepository, studentRepository) {
    this.classRepository = classRepository;
    this.studentRepository = studentRepository;
  }

  async execute(classId, studentId, teacherId) {
    // 1. Verificar se a turma existe
    const classEntity = await this.classRepository.findById(classId);

    if (!classEntity) {
      throw new NotFoundError('Turma');
    }

    // 2. Verificar se o professor é o dono da turma
    if (classEntity.teacherId !== teacherId) {
      throw new ForbiddenError('Você não tem permissão para adicionar alunos a esta turma');
    }

    // 3. Verificar se o aluno existe
    const student = await this.studentRepository.findById(studentId);

    if (!student) {
      throw new NotFoundError('Aluno');
    }

    // 4. Atualizar a turma do aluno
    const updatedStudent = await this.studentRepository.update(studentId, {
      classId: classId,
    });

    return updatedStudent;
  }
}
