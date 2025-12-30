import cron from 'node-cron';
import { SendDeadlineReminderUseCase } from '../../application/use-cases/emails/SendDeadlineReminderUseCase.js';
import { TaskRepository } from '../database/repositories/TaskRepository.js';
import { StudentRepository } from '../database/repositories/StudentRepository.js';
import { EssayRepository } from '../database/repositories/EssayRepository.js';
import { EmailService } from '../services/EmailService.js';

/**
 * Scheduler de Emails
 *
 * Responsável por agendar e executar tarefas relacionadas a emails:
 * - Lembretes de prazo próximo (executa diariamente)
 */
export class EmailScheduler {
  constructor() {
    this.sendDeadlineReminderUseCase = null;
    this.isRunning = false;
  }

  /**
   * Inicializa o scheduler
   */
  async start() {
    console.log('📅 Iniciando scheduler de emails...');

    // Inicializar dependências
    const taskRepository = new TaskRepository();
    const studentRepository = new StudentRepository();
    const essayRepository = new EssayRepository();
    const emailService = new EmailService();

    this.sendDeadlineReminderUseCase = new SendDeadlineReminderUseCase(
      taskRepository,
      studentRepository,
      essayRepository,
      emailService
    );

    // Verificar se o serviço de email está configurado
    const isEmailConfigured = await emailService.verifyConnection();

    if (!isEmailConfigured) {
      console.warn('⚠️  Email scheduler não iniciado: serviço de email não configurado');
      return;
    }

    // Agendar verificação diária às 9h da manhã
    // Cron pattern: "minuto hora dia mês dia-da-semana"
    // "0 9 * * *" = todo dia às 9h
    cron.schedule('0 9 * * *', async () => {
      console.log('\n🔔 Executando verificação de prazos próximos...');
      await this._sendDeadlineReminders();
    });

    console.log('✅ Scheduler configurado: verificação diária às 9h');

    this.isRunning = true;

    // Executar uma vez na inicialização (opcional, comentado por padrão)
    // console.log('🔄 Executando verificação inicial...');
    // await this._sendDeadlineReminders();
  }

  /**
   * Executa o envio de lembretes de prazo
   * @private
   */
  async _sendDeadlineReminders() {
    try {
      // Enviar lembretes para tarefas com prazo nas próximas 24h
      const stats = await this.sendDeadlineReminderUseCase.execute({
        hoursBeforeDeadline: 24,
      });

      if (stats.emailsSent > 0) {
        console.log(`   ✅ ${stats.emailsSent} lembretes enviados com sucesso`);
      } else {
        console.log('   ℹ️  Nenhum lembrete necessário no momento');
      }

      if (stats.emailsFailed > 0) {
        console.warn(`   ⚠️  ${stats.emailsFailed} emails falharam`);
      }
    } catch (error) {
      console.error('❌ Erro ao executar verificação de prazos:', error);
    }
  }

  /**
   * Para o scheduler
   */
  stop() {
    if (this.isRunning) {
      console.log('🛑 Parando scheduler de emails...');
      this.isRunning = false;
      // node-cron não tem método de stop global, as tasks continuam registradas
    }
  }

  /**
   * Executa manualmente a verificação de prazos (útil para testes)
   */
  async executeManually() {
    console.log('🔄 Executando verificação manual de prazos...');
    await this._sendDeadlineReminders();
  }
}

// Exportar instância singleton
export const emailScheduler = new EmailScheduler();
