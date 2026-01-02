/**
 * Use Case: Enviar Notificação de Correção Finalizada
 *
 * Este use case envia email para o aluno quando a professora
 * finaliza a correção de uma redação.
 *
 * Seguindo princípios SOLID:
 * - SRP: Apenas envia notificação de correção finalizada
 * - DIP: Depende de abstrações (interfaces)
 */
export class SendCorrectionCompletedUseCase {
  constructor(essayRepository, studentRepository, taskRepository, emailService) {
    this.essayRepository = essayRepository;
    this.studentRepository = studentRepository;
    this.taskRepository = taskRepository;
    this.emailService = emailService;
  }

  /**
   * Executa o envio da notificação
   * @param {Object} params
   * @param {string} params.essayId - ID da redação corrigida
   * @returns {Promise<void>}
   */
  async execute({ essayId }) {
    console.log(`📧 Enviando notificação de correção finalizada para redação ${essayId}...`);

    try {
      // 1. Buscar dados da redação
      const essay = await this.essayRepository.findById(essayId);
      if (!essay) {
        throw new Error('Redação não encontrada');
      }

      // 2. Buscar dados do aluno
      const student = await this.studentRepository.findById(essay.studentId);
      if (!student) {
        throw new Error('Aluno não encontrado');
      }

      // 3. Buscar dados da tarefa
      const task = await this.taskRepository.findById(essay.taskId);
      if (!task) {
        throw new Error('Tarefa não encontrada');
      }

      // 4. Buscar dados da turma
      const classData = await this.taskRepository.getClassByTaskId(task.id);
      if (!classData) {
        throw new Error('Turma não encontrada');
      }

      // 5. Montar URL da redação (frontend)
      const essayUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/essays/${essayId}/view`;

      // 6. Enviar email
      await this.emailService.sendCorrectionCompleted({
        to: student.email,
        studentName: student.fullName,
        taskTitle: task.title,
        className: classData.name,
        grade: essay.grade,
        writtenFeedback: essay.writtenFeedback,
        essayUrl,
      });

      console.log(`✅ Notificação enviada para ${student.email}`);
    } catch (error) {
      console.error('❌ Erro ao enviar notificação de correção:', error.message);
      // Não lançar erro para não bloquear a finalização da correção
      // O email é uma funcionalidade secundária
    }
  }
}
