/**
 * Template de email para correção finalizada
 */
export const correctionCompletedTemplate = ({
  studentName,
  taskTitle,
  className,
  grade,
  writtenFeedback,
  essayUrl,
}) => {
  // Garantir que grade é um número
  const gradeNumber = typeof grade === 'number' ? grade : parseFloat(grade);

  // Determina cor baseada na nota
  let gradeColor = '#4CAF50'; // Verde (bom)
  if (gradeNumber < 5) gradeColor = '#ff6b6b'; // Vermelho (precisa melhorar)
  else if (gradeNumber < 7) gradeColor = '#ffa500'; // Laranja (médio)

  return {
    subject: `✅ Correção concluída: "${taskTitle}"`,
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
            color: #4CAF50;
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
          .success-box {
            background-color: #d4edda;
            border-left: 4px solid #4CAF50;
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
          .grade-box {
            text-align: center;
            padding: 20px;
            margin: 20px 0;
            background-color: #f8f9fa;
            border-radius: 8px;
          }
          .grade-label {
            font-size: 16px;
            color: #666;
            margin-bottom: 10px;
          }
          .grade-value {
            font-size: 48px;
            font-weight: bold;
            color: ${gradeColor};
            margin: 0;
          }
          .feedback-box {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .feedback-label {
            font-weight: bold;
            color: #856404;
            margin-bottom: 10px;
            display: block;
          }
          .feedback-content {
            color: #333;
            white-space: pre-wrap;
            line-height: 1.6;
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
            <div class="icon">✅</div>
            <h1>Correção Concluída</h1>
          </div>

          <div class="content">
            <p class="greeting">Olá, <strong>${studentName}</strong>!</p>

            <div class="success-box">
              <p style="margin: 0;">
                <strong>🎉 Boa notícia!</strong> A correção da sua redação foi finalizada e já está disponível para visualização.
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

            <div class="grade-box">
              <div class="grade-label">Sua Nota:</div>
              <div class="grade-value">${gradeNumber.toFixed(1)}</div>
            </div>

            ${
              writtenFeedback
                ? `
            <div class="feedback-box">
              <span class="feedback-label">💬 Comentários da Professora:</span>
              <div class="feedback-content">${writtenFeedback}</div>
            </div>
            `
                : ''
            }

            <p style="margin-top: 20px;">
              Acesse a plataforma para visualizar sua redação com as anotações e observações detalhadas da professora.
            </p>

            <center>
              <a href="${essayUrl || process.env.FRONTEND_URL || 'http://localhost:5173'}" class="cta-button">
                Ver Redação Corrigida
              </a>
            </center>

            <p style="margin-top: 20px; font-size: 14px; color: #666;">
              💡 <strong>Dica:</strong> Revise atentamente as anotações e comentários para melhorar suas próximas redações!
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

✅ CORREÇÃO CONCLUÍDA

A correção da sua redação foi finalizada e já está disponível para visualização.

📚 Turma: ${className}
📝 Tarefa: ${taskTitle}
📊 Sua Nota: ${gradeNumber.toFixed(1)}

${writtenFeedback ? `💬 Comentários da Professora:\n${writtenFeedback}\n` : ''}

Acesse a plataforma para visualizar sua redação com as anotações e observações detalhadas.

Link: ${essayUrl || process.env.FRONTEND_URL || 'http://localhost:5173'}

💡 Dica: Revise atentamente as anotações e comentários para melhorar suas próximas redações!

Este é um email automático. Não responda a esta mensagem.
Sistema de Correção de Redações
    `.trim(),
  };
};
