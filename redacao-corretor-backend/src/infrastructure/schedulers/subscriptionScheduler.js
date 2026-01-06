import cron from 'node-cron';
import path from 'path';
import { fileURLToPath } from 'url';
import { SubscriptionSyncService } from '../services/SubscriptionSyncService.js';
import logger from '../../utils/logger.js';

// Obter __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Scheduler para sincronização automática de assinaturas
 *
 * Executa periodicamente a sincronização de alunos baseado
 * no arquivo de assinaturas.
 *
 * Configuração padrão: Todo dia às 3h da manhã (horário de Brasília)
 */
class SubscriptionScheduler {
  constructor() {
    this.syncService = new SubscriptionSyncService();
    this.isRunning = false;
    this.lastRun = null;
    this.nextRun = null;

    // Expressão cron: '0 3 * * *' = Todo dia às 3h
    // Formato: segundo minuto hora dia mês dia-da-semana
    this.cronExpression = process.env.SYNC_CRON_SCHEDULE || '0 3 * * *';
  }

  /**
   * Inicia o scheduler
   */
  async start() {
    try {
      logger.info('📅 Iniciando scheduler de sincronização de assinaturas');
      logger.info(`⏰ Agendamento: ${this.cronExpression}`);
      logger.info(`📡 Fonte: API Guru (dados NUNCA salvos em disco)`);

      // Validar expressão cron
      if (!cron.validate(this.cronExpression)) {
        throw new Error(`Expressão cron inválida: ${this.cronExpression}`);
      }

      // Agendar execução
      this.job = cron.schedule(this.cronExpression, async () => {
        await this._executeSyncJob();
      }, {
        scheduled: true,
        timezone: 'America/Sao_Paulo', // Horário de Brasília
      });

      // Calcular próxima execução
      this._updateNextRun();

      logger.info(`✅ Scheduler configurado com sucesso`);
      logger.info(`🕐 Próxima execução: ${this.nextRun}`);

      // Se configurado, executar imediatamente na primeira vez
      if (process.env.SYNC_ON_STARTUP === 'true') {
        logger.info('🚀 Executando sincronização inicial...');
        await this._executeSyncJob();
      }
    } catch (error) {
      logger.error('❌ Erro ao iniciar scheduler', {
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Para o scheduler
   */
  stop() {
    if (this.job) {
      this.job.stop();
      logger.info('⏹️  Scheduler parado');
    }
  }

  /**
   * Executa manualmente a sincronização
   * @returns {Promise<Object>}
   */
  async executeManually() {
    logger.info('🔧 Execução manual solicitada');
    return await this._executeSyncJob();
  }

  /**
   * Obtém status do scheduler
   * @returns {Object}
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      nextRun: this.nextRun,
      cronExpression: this.cronExpression,
      source: 'API Guru',
    };
  }

  /**
   * Executa job de sincronização
   * @private
   */
  async _executeSyncJob() {
    // Prevenir execuções concorrentes
    if (this.isRunning) {
      logger.warn('⚠️  Sincronização já está em execução. Pulando...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      logger.info('🔄 Iniciando job de sincronização agendado');

      // Executar sincronização direto da API (SEM salvar em disco)
      const result = await this.syncService.syncFromAPI();

      // Atualizar timestamp da última execução
      this.lastRun = new Date().toISOString();

      // Log do resultado
      if (result.success) {
        logger.info('✅ Job de sincronização concluído com sucesso', {
          duration: result.duration,
          stats: result.stats,
        });

        // Enviar notificação (se configurado)
        await this._sendSuccessNotification(result);
      } else {
        logger.error('❌ Job de sincronização falhou', {
          error: result.error,
          stats: result.stats,
        });

        // Enviar alerta de falha (se configurado)
        await this._sendErrorNotification(result);
      }

      return result;
    } catch (error) {
      logger.error('❌ Erro crítico no job de sincronização', {
        message: error.message,
        stack: error.stack,
      });

      // Enviar alerta crítico (se configurado)
      await this._sendCriticalErrorNotification(error);

      throw error;
    } finally {
      this.isRunning = false;

      // Atualizar próxima execução
      this._updateNextRun();

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      logger.info(`⏱️  Tempo total do job: ${duration}s`);
    }
  }

  /**
   * Atualiza timestamp da próxima execução
   * @private
   */
  _updateNextRun() {
    // Calcular próxima execução (aproximado)
    const now = new Date();

    // Para cron diário às 3h
    const next = new Date(now);
    next.setHours(3, 0, 0, 0);

    // Se já passou das 3h hoje, agendar para amanhã
    if (now.getHours() >= 3) {
      next.setDate(next.getDate() + 1);
    }

    this.nextRun = next.toISOString();
  }

  /**
   * Envia notificação de sucesso (webhook, email, etc)
   * @private
   */
  async _sendSuccessNotification(result) {
    // TODO: Implementar notificações (Slack, email, etc)
    // if (process.env.WEBHOOK_URL) {
    //   await fetch(process.env.WEBHOOK_URL, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ type: 'success', result }),
    //   });
    // }
  }

  /**
   * Envia notificação de erro
   * @private
   */
  async _sendErrorNotification(result) {
    // TODO: Implementar alertas de erro
    logger.error('🚨 Enviando alerta de erro', { result });
  }

  /**
   * Envia notificação de erro crítico
   * @private
   */
  async _sendCriticalErrorNotification(error) {
    // TODO: Implementar alertas críticos
    logger.error('🚨🚨 Enviando alerta crítico', { error });
  }
}

// Exportar instância singleton
export const subscriptionScheduler = new SubscriptionScheduler();
