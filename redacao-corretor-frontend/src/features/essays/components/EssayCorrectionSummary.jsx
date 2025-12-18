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
  // Se não há nota nem feedback, não renderiza nada
  const hasGrade = grade !== null && grade !== undefined;
  const hasFeedback = writtenFeedback && writtenFeedback.trim();

  if (!hasGrade && !hasFeedback) return null;

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-4xl mx-auto">
        {/* Nota e Comentários */}
        <div className="flex flex-col md:flex-row gap-4">
          <EssayGradeCard grade={grade} />
          <EssayFeedbackCard feedback={writtenFeedback} />
        </div>

        {/* Dica para o aluno */}
        <div className="mt-4 flex items-start gap-2 text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <i className="bi bi-info-circle text-blue-600 shrink-0 mt-0.5"></i>
          <p>
            Além dos comentários acima, veja as anotações visuais (marcações em vermelho, azul, etc.)
            diretamente na sua redação abaixo. Role para visualizar toda a correção.
          </p>
        </div>
      </div>
    </div>
  );
};
