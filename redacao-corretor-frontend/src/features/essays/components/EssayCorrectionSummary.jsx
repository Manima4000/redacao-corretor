import { useState } from 'react';
import { EssayGradeCard } from './EssayGradeCard';
import { EssayFeedbackCard } from './EssayFeedbackCard';

/**
 * Componente que agrupa nota e comentários da correção (REFATORADO)
 *
 * Responsabilidade Única (SRP):
 * - Compõe visualização de nota + feedback
 * - Layout compacto para painel lateral
 * - Pode ser minimizado/expandido
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
  const [isMinimized, setIsMinimized] = useState(false);

  // Se não há nota nem feedback, não renderiza nada
  const hasGrade = grade !== null && grade !== undefined;
  const hasFeedback = writtenFeedback && writtenFeedback.trim();

  if (!hasGrade && !hasFeedback) return null;

  return (
    <div className="bg-white rounded-lg shadow-xl border border-gray-200">
      {/* Header do Card (sempre visível) */}
      <div className="bg-linear-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <i className="bi bi-star-fill text-yellow-300"></i>
          <span className="font-bold text-sm">Correção</span>
        </div>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="hover:bg-white/20 p-1 rounded transition-colors"
          title={isMinimized ? 'Expandir' : 'Minimizar'}
        >
          <i className={`bi ${isMinimized ? 'bi-chevron-down' : 'bi-chevron-up'}`}></i>
        </button>
      </div>

      {/* Conteúdo (colapsável) */}
      {!isMinimized && (
        <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Nota */}
          {hasGrade && (
            <div className="mb-4">
              <EssayGradeCard grade={grade} />
            </div>
          )}

          {/* Comentários */}
          {hasFeedback && (
            <div className="space-y-3">
              <button
                onClick={() => setShowFeedback(!showFeedback)}
                className="w-full flex items-center justify-between gap-2 text-indigo-600 hover:text-indigo-800 font-medium transition-colors bg-indigo-50 px-3 py-2 rounded hover:bg-indigo-100"
              >
                <div className="flex items-center gap-2">
                  <i className="bi bi-chat-left-text"></i>
                  <span className="text-sm">Comentários</span>
                </div>
                <i className={`bi ${showFeedback ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
              </button>

              {showFeedback && (
                <div className="animate-fade-in">
                  <EssayFeedbackCard feedback={writtenFeedback} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
