/**
 * Template de email para lembrete de prazo próximo
 */
export const deadlineReminderTemplate = ({ studentName, taskTitle, className, deadline }) => {
  const deadlineDate = new Date(deadline);
  const formattedDate = deadlineDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const formattedTime = deadlineDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return {
    subject: `⏰ Lembrete: Prazo próximo para "${taskTitle}"`,
    html: `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #f0f0f0;
          }
          .header h1 {
            color: #ff6b6b;
            margin: 0;
            font-size: 24px;
          }
          .icon {
            font-size: 48px;
            margin-bottom: 10px;
          }
          .content {
            margin-bottom: 30px;
          }
          .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #555;
          }
          .alert-box {
            background-color: #fff3cd;
            border-left: 4px solid #ff6b6b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .info-item {
            margin: 15px 0;
            padding: 10px;
            background-color: #f8f9fa;
            border-radius: 4px;
          }
          .info-label {
            font-weight: bold;
            color: #666;
            display: block;
            margin-bottom: 5px;
          }
          .info-value {
            color: #333;
            font-size: 16px;
          }
          .deadline-highlight {
            color: #ff6b6b;
            font-size: 20px;
            font-weight: bold;
          }
          .cta-button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #f0f0f0;
            text-align: center;
            color: #888;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="icon">⏰</div>
            <h1>Lembrete de Prazo</h1>
          </div>

          <div class="content">
            <p class="greeting">Olá, <strong>${studentName}</strong>!</p>

            <div class="alert-box">
              <p style="margin: 0;">
                <strong>⚠️ Atenção:</strong> O prazo para envio da sua redação está próximo e ainda não identificamos seu envio.
              </p>
            </div>

            <div class="info-item">
              <span class="info-label">📚 Turma:</span>
              <span class="info-value">${className}</span>
            </div>

            <div class="info-item">
              <span class="info-label">📝 Tarefa:</span>
              <span class="info-value">${taskTitle}</span>
            </div>

            <div class="info-item">
              <span class="info-label">🕐 Prazo final:</span>
              <span class="info-value deadline-highlight">${formattedDate} às ${formattedTime}</span>
            </div>

            <p style="margin-top: 20px;">
              Não perca o prazo! Acesse a plataforma e envie sua redação o quanto antes.
            </p>

            <center>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="cta-button">
                Enviar Redação Agora
              </a>
            </center>

            <p style="margin-top: 20px; font-size: 14px; color: #666;">
              💡 <strong>Dica:</strong> Certifique-se de que seu arquivo está no formato correto (JPEG, PNG ou PDF) e não ultrapassa 10MB.
            </p>
          </div>

          <div class="footer">
            <p>Este é um email automático. Não responda a esta mensagem.</p>
            <p>Sistema de Correção de Redações</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Olá, ${studentName}!

⚠️ LEMBRETE DE PRAZO

O prazo para envio da sua redação está próximo e ainda não identificamos seu envio.

📚 Turma: ${className}
📝 Tarefa: ${taskTitle}
🕐 Prazo final: ${formattedDate} às ${formattedTime}

Não perca o prazo! Acesse a plataforma e envie sua redação o quanto antes.

Link: ${process.env.FRONTEND_URL || 'http://localhost:5173'}

Este é um email automático. Não responda a esta mensagem.
Sistema de Correção de Redações
    `.trim(),
  };
};
