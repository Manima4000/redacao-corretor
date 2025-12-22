export class GetStudentDashboardStatsUseCase {
  constructor(taskRepository, essayRepository, studentRepository) {
    this.taskRepository = taskRepository;
    this.essayRepository = essayRepository;
    this.studentRepository = studentRepository;
  }

  async execute(studentId) {
    const student = await this.studentRepository.findById(studentId);
    if (!student) {
      throw new Error('Student not found');
    }

    let taskCount = 0;
    if (student.classId) {
       taskCount = await this.taskRepository.countByClassId(student.classId);
    }

    const essayCount = await this.essayRepository.countByStudentId(studentId);
    // Student logic for classes is "1" if classId exists, else "0".
    const classCount = student.classId ? 1 : 0;

    return {
      classCount,
      taskCount,
      essayCount, // Total essays submitted
    };
  }
}
