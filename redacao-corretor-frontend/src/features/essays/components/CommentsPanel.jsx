import { useState, useEffect, useRef } from 'react';
import { essayService } from '../services/essayService';

/**
 * Painel lateral para escrever comentários da redação
 *
 * Responsabilidades:
 * - Exibir campo de texto para comentários
 * - Auto-save a cada 3 segundos após parar de digitar
 * - Feedback visual de salvamento
 *
 * Segue SOLID:
 * - SRP: Apenas gerencia comentários (não mexe em anotações ou notas)
 * - Props: essayId, initialComments, onCommentsSaved
 *
 * @param {Object} props
 * @param {string} props.essayId - ID da redação
 * @param {string} props.initialComments - Comentários iniciais (do banco)
 * @param {Function} props.onCommentsSaved - Callback quando comentários são salvos
 */
export const CommentsPanel = ({ essayId, initialComments = '', onCommentsSaved }) => {
  const [comments, setComments] = useState(initialComments);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const saveTimeoutRef = useRef(null);
  const lastSavedCommentsRef = useRef(initialComments);

  // Auto-save quando parar de digitar
  useEffect(() => {
    // Se comentários não mudaram, não fazer nada
    if (comments === lastSavedCommentsRef.current) {
      setHasUnsavedChanges(false);
      return;
    }

    setHasUnsavedChanges(true);

    // Cancelar timeout anterior
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Aguardar 3 segundos após parar de digitar
    saveTimeoutRef.current = setTimeout(async () => {
      await saveComments();
    }, 3000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [comments]);

  // Atualizar quando initialComments mudar (quando carregar do backend)
  useEffect(() => {
    setComments(initialComments);
    lastSavedCommentsRef.current = initialComments;
    setHasUnsavedChanges(false);
  }, [initialComments]);

  /**
   * Salva comentários no backend
   */
  const saveComments = async () => {
    if (comments === lastSavedCommentsRef.current) {
      return; // Nada mudou
    }

    try {
      setIsSaving(true);

      await essayService.updateComments(essayId, comments.trim() || null);

      lastSavedCommentsRef.current = comments;
      setLastSaved(new Date());
      setHasUnsavedChanges(false);

      // Notificar componente pai
      if (onCommentsSaved) {
        onCommentsSaved(comments);
      }
    } catch (error) {
      console.error('Erro ao salvar comentários:', error);
      // TODO: Mostrar toast de erro
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Formata tempo desde último salvamento
   */
  const getLastSavedText = () => {
    if (!lastSaved) return null;

    const seconds = Math.floor((new Date() - lastSaved) / 1000);

    if (seconds < 5) return 'Salvo agora';
    if (seconds < 60) return `Salvo há ${seconds}s`;
    if (seconds < 3600) return `Salvo há ${Math.floor(seconds / 60)}min`;
    return `Salvo há ${Math.floor(seconds / 3600)}h`;
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-300">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="bi bi-chat-left-text text-blue-600"></i>
            <h3 className="font-semibold text-gray-800 text-sm">Comentários</h3>
          </div>

          {/* Status de salvamento */}
          <div className="flex items-center gap-1.5 text-xs">
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-500 border-t-transparent"></div>
                <span className="text-blue-600">Salvando...</span>
              </>
            ) : hasUnsavedChanges ? (
              <>
                <i className="bi bi-circle-fill text-orange-500 text-[6px]"></i>
                <span className="text-orange-600">Não salvo</span>
              </>
            ) : lastSaved ? (
              <>
                <i className="bi bi-check-circle-fill text-green-500"></i>
                <span className="text-green-600">{getLastSavedText()}</span>
              </>
            ) : null}
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-1">
          Escreva seus comentários enquanto corrige. Salvamento automático a cada 3s.
        </p>
      </div>

      {/* Textarea */}
      <div className="flex-1 p-4">
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Digite seus comentários sobre a redação...&#10;&#10;• Pontos positivos&#10;• Áreas de melhoria&#10;• Sugestões específicas"
          className="w-full h-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm leading-relaxed"
          style={{ fontFamily: 'inherit' }}
        />
      </div>

      {/* Footer com dicas */}
      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
        <div className="flex items-start gap-2 text-xs text-gray-600">
          <i className="bi bi-info-circle shrink-0 mt-0.5"></i>
          <p>
            Ao finalizar a correção, você poderá revisar e editar estes comentários antes de enviar ao aluno.
          </p>
        </div>
      </div>
    </div>
  );
};
