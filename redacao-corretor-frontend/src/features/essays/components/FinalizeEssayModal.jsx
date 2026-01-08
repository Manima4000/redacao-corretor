import { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/Button';

/**
 * Modal para finalizar correção de redação
 * Permite professora inserir nota (0-10) e comentários escritos
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Se modal está aberto
 * @param {Function} props.onClose - Callback ao fechar
 * @param {Function} props.onFinalize - Callback ao finalizar (grade, writtenFeedback)
 * @param {boolean} props.isLoading - Se está finalizando
 * @param {string} props.initialComments - Comentários já salvos (do CommentsPanel)
 */
export const FinalizeEssayModal = ({ isOpen, onClose, onFinalize, isLoading, initialComments = '' }) => {
  const [grade, setGrade] = useState('');
  const [writtenFeedback, setWrittenFeedback] = useState('');
  const [error, setError] = useState('');

  // Pré-popular comentários quando modal abre
  useEffect(() => {
    if (isOpen && initialComments) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWrittenFeedback(initialComments);
    }
  }, [isOpen, initialComments]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validar nota
    if (!grade) {
      setError('Nota é obrigatória');
      return;
    }

    const gradeNumber = parseFloat(grade);

    if (isNaN(gradeNumber) || gradeNumber < 0 || gradeNumber > 10) {
      setError('Nota deve ser um número entre 0 e 10');
      return;
    }

    // Chamar callback de finalização
    onFinalize(gradeNumber, writtenFeedback.trim() || null);
  };

  const handleClose = () => {
    if (!isLoading) {
      setGrade('');
      setWrittenFeedback('');
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Finalizar Correção</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="bi bi-x-lg text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo de Nota */}
          <div>
            <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">
              Nota <span className="text-red-500">*</span>
            </label>
            <input
              id="grade"
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Digite a nota (0 a 10)"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              Insira uma nota de 0 a 10 (ex: 8.5)
            </p>
          </div>

          {/* Campo de Comentários */}
          <div>
            <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
              Comentários Escritos <span className="text-gray-400 text-xs">(opcional)</span>
            </label>
            {initialComments && (
              <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700 flex items-center gap-1.5">
                <i className="bi bi-check-circle-fill"></i>
                <span>Comentários já salvos durante a correção. Você pode revisar ou editar abaixo.</span>
              </div>
            )}
            <textarea
              id="feedback"
              value={writtenFeedback}
              onChange={(e) => setWrittenFeedback(e.target.value)}
              disabled={isLoading}
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Escreva seus comentários sobre a redação (ex: pontos positivos, áreas de melhoria, etc.)"
            />
            <p className="text-xs text-gray-500 mt-1">
              {initialComments
                ? 'Revise ou edite os comentários antes de finalizar'
                : 'Adicione comentários adicionais que complementem as anotações visuais'}
            </p>
          </div>

          {/* Mensagem de Erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <i className="bi bi-exclamation-circle"></i>
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Finalizando...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle"></i>
                  <span>Finalizar Correção</span>
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Informação Adicional */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex gap-2 text-sm text-blue-800">
            <i className="bi bi-info-circle shrink-0 mt-0.5"></i>
            <p>
              Ao finalizar, as anotações serão salvas automaticamente e a redação será marcada como corrigida.
              O aluno poderá visualizar a nota e os comentários.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
