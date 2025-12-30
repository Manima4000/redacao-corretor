import nodemailer from 'nodemailer';
import { IEmailService } from '../../domain/services/IEmailService.js';
import { deadlineReminderTemplate } from './email/templates/deadlineReminder.js';
import { correctionCompletedTemplate } from './email/templates/correctionCompleted.js';

/**
 * Implementação concreta do serviço de email usando Nodemailer
 *
 * Seguindo o princípio de Inversão de Dependência (DIP),
 * esta classe implementa a interface IEmailService.
 */
export class EmailService extends IEmailService {
  constructor() {
    super();
    this.transporter = null;
    this._initializeTransporter();
  }

  /**
   * Inicializa o transporter do Nodemailer
   * @private
   */
  _initializeTransporter() {
    const emailConfig = {
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: process.env.EMAIL_SECURE === 'true', // true para porta 465, false para outras
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    };

    // Validar configuração
    if (!emailConfig.host || !emailConfig.auth.user || !emailConfig.auth.pass) {
      console.warn('⚠️  Email service não configurado. Emails não serão enviados.');
      console.warn('Configure as variáveis: EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD');
      return;
    }

    this.transporter = nodemailer.createTransport(emailConfig);

    // Verificar conexão no início
    this.verifyConnection().catch((error) => {
      console.error('❌ Erro ao verificar conexão com servidor de email:', error.message);
    });
  }

  /**
   * Verifica se o serviço de email está configurado e funcionando
   * @returns {Promise<boolean>}
   */
  async verifyConnection() {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✅ Serviço de email conectado e pronto');
      return true;
    } catch (error) {
      console.error('❌ Erro ao conectar com servidor de email:', error.message);
      return false;
    }
  }

  /**
   * Método auxiliar para enviar email
   * @private
   */
  async _sendEmail({ to, subject, html, text }) {
    if (!this.transporter) {
      console.warn(`⚠️  Email não enviado (serviço não configurado): ${subject} para ${to}`);
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'Sistema de Redações'}" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        text,
      });

      console.log(`✅ Email enviado com sucesso: ${subject} para ${to}`);
      console.log(`   Message ID: ${info.messageId}`);

      return info;
    } catch (error) {
      console.error(`❌ Erro ao enviar email para ${to}:`, error.message);
      throw error;
    }
  }

  /**
   * Envia email de lembrete de prazo próximo
   */
  async sendDeadlineReminder({ to, studentName, taskTitle, className, deadline }) {
    const template = deadlineReminderTemplate({
      studentName,
      taskTitle,
      className,
      deadline,
    });

    return this._sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Envia email de correção finalizada
   */
  async sendCorrectionCompleted({
    to,
    studentName,
    taskTitle,
    className,
    grade,
    writtenFeedback,
    essayUrl,
  }) {
    const template = correctionCompletedTemplate({
      studentName,
      taskTitle,
      className,
      grade,
      writtenFeedback,
      essayUrl,
    });

    return this._sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }
}
