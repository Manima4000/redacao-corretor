/**
 * Card de exibição de comentários escritos da professora
 *
 * Responsabilidade Única (SRP):
 * - Apenas exibe comentários escritos
 * - Formatação visual consistente
 *
 * @param {Object} props
 * @param {string} props.feedback - Comentários escritos da professora
 */
export const EssayFeedbackCard = ({ feedback }) => {
  if (!feedback) return null;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
          <i className="bi bi-chat-left-text text-indigo-600 text-lg"></i>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
            Comentários da Professora
          </h3>
          <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
            {feedback}
          </div>
        </div>
      </div>
    </div>
  );
};
