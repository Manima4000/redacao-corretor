import { useState } from 'react';
import { EssayGradeCard } from './EssayGradeCard';
import { EssayFeedbackCard } from './EssayFeedbackCard';

/**
 * Componente que agrupa nota e comentários da correção
 *
 * Responsabilidade Única (SRP):
 * - Compõe visualização de nota + feedback
 * - Layout responsivo
 * - Inclui dica para o aluno
 *
 * Princípios aplicados:
 * - SRP: Apenas composição visual de correção
 * - OCP: Pode ser estendido sem modificação
 * - DIP: Depende de componentes abstratos (EssayGradeCard, EssayFeedbackCard)
 *
 * @param {Object} props
 * @param {number} props.grade - Nota da redação (0-10, opcional)
 * @param {string} props.writtenFeedback - Comentários escritos (opcional)
 */
export const EssayCorrectionSummary = ({ grade, writtenFeedback }) => {
  const [showFeedback, setShowFeedback] = useState(false);

  // Se não há nota nem feedback, não renderiza nada
  const hasGrade = grade !== null && grade !== undefined;
  const hasFeedback = writtenFeedback && writtenFeedback.trim();

  if (!hasGrade && !hasFeedback) return null;

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-4xl mx-auto">
        {/* Container Principal */}
        <div className="flex flex-col items-center gap-6">
          {/* Nota (Centralizada) */}
          <EssayGradeCard grade={grade} />

          {/* Botão para ver comentários (se houver) */}
          {hasFeedback && (
            <button
              onClick={() => setShowFeedback(!showFeedback)}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium transition-colors bg-indigo-50 px-4 py-2 rounded-full hover:bg-indigo-100"
            >
              <i className={`bi ${showFeedback ? 'bi-chevron-up' : 'bi-chat-left-text'}`}></i>
              {showFeedback ? 'Ocultar comentários' : 'Ver comentários da professora'}
            </button>
          )}

          {/* Comentários (Collapsible) */}
          {hasFeedback && showFeedback && (
            <div className="w-full animate-fade-in">
              <EssayFeedbackCard feedback={writtenFeedback} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
