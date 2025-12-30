/**
 * Use Case: Enviar Lembretes de Prazo Próximo
 *
 * Este use case busca tarefas com prazo próximo (ex: nas próximas 24h)
 * e envia emails de lembrete para alunos que ainda não enviaram redação.
 *
 * Seguindo princípios SOLID:
 * - SRP: Apenas envia lembretes de prazo
 * - DIP: Depende de abstrações (interfaces)
 */
export class SendDeadlineReminderUseCase {
  constructor(taskRepository, studentRepository, essayRepository, emailService) {
    this.taskRepository = taskRepository;
    this.studentRepository = studentRepository;
    this.essayRepository = essayRepository;
    this.emailService = emailService;
  }

  /**
   * Executa o envio de lembretes
   * @param {Object} params
   * @param {number} params.hoursBeforeDeadline - Quantas horas antes do prazo enviar lembrete (padrão: 24h)
   * @returns {Promise<Object>} Estatísticas do envio
   */
  async execute({ hoursBeforeDeadline = 24 } = {}) {
    console.log(`🔔 Iniciando envio de lembretes de prazo (${hoursBeforeDeadline}h antes)...`);

    const stats = {
      tasksChecked: 0,
      emailsSent: 0,
      emailsFailed: 0,
      errors: [],
    };

    try {
      // 1. Buscar tarefas com prazo próximo
      const now = new Date();
      const deadlineWindow = new Date(now.getTime() + hoursBeforeDeadline * 60 * 60 * 1000);

      const upcomingTasks = await this.taskRepository.findUpcomingDeadlines({
        startDate: now,
        endDate: deadlineWindow,
      });

      console.log(`   Encontradas ${upcomingTasks.length} tarefas com prazo próximo`);
      stats.tasksChecked = upcomingTasks.length;

      // 2. Para cada tarefa, verificar alunos que não enviaram
      for (const task of upcomingTasks) {
        try {
          // Buscar classe da tarefa para obter alunos
          const classData = await this.taskRepository.getClassByTaskId(task.id);
          if (!classData) {
            console.warn(`   ⚠️  Turma não encontrada para tarefa ${task.id}`);
            continue;
          }

          // Buscar alunos da turma
          const students = await this.studentRepository.findByClassId(classData.id);

          // Buscar redações já enviadas para esta tarefa
          const submittedEssays = await this.essayRepository.findByTaskId(task.id);
          const submittedStudentIds = new Set(submittedEssays.map((e) => e.studentId));

          // Filtrar alunos que NÃO enviaram
          const studentsWithoutSubmission = students.filter(
            (student) => !submittedStudentIds.has(student.id)
          );

          console.log(
            `   Tarefa "${task.title}": ${studentsWithoutSubmission.length} alunos sem envio`
          );

          // 3. Enviar email para cada aluno
          for (const student of studentsWithoutSubmission) {
            try {
              await this.emailService.sendDeadlineReminder({
                to: student.email,
                studentName: student.fullName,
                taskTitle: task.title,
                className: classData.name,
                deadline: task.deadline,
              });

              stats.emailsSent++;
            } catch (error) {
              console.error(`   ❌ Erro ao enviar email para ${student.email}:`, error.message);
              stats.emailsFailed++;
              stats.errors.push({
                studentEmail: student.email,
                taskTitle: task.title,
                error: error.message,
              });
            }
          }
        } catch (error) {
          console.error(`   ❌ Erro ao processar tarefa ${task.id}:`, error.message);
          stats.errors.push({
            taskId: task.id,
            taskTitle: task.title,
            error: error.message,
          });
        }
      }

      console.log(`✅ Lembretes enviados com sucesso!`);
      console.log(`   📊 Estatísticas:`);
      console.log(`      - Tarefas verificadas: ${stats.tasksChecked}`);
      console.log(`      - Emails enviados: ${stats.emailsSent}`);
      console.log(`      - Emails com erro: ${stats.emailsFailed}`);

      return stats;
    } catch (error) {
      console.error('❌ Erro ao enviar lembretes:', error);
      throw error;
    }
  }
}
