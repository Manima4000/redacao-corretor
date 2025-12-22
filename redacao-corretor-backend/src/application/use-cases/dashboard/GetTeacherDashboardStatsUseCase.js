export class GetTeacherDashboardStatsUseCase {
  constructor(classRepository, taskRepository, essayRepository) {
    this.classRepository = classRepository;
    this.taskRepository = taskRepository;
    this.essayRepository = essayRepository;
  }

  async execute(teacherId) {
    const [classCount, taskCount, pendingEssaysCount] = await Promise.all([
      this.classRepository.countByTeacherId(teacherId),
      this.taskRepository.countByTeacherId(teacherId),
      this.essayRepository.countByTeacherIdAndStatus(teacherId, 'pending'),
    ]);

    return {
      classCount,
      taskCount,
      pendingEssaysCount,
    };
  }
}
