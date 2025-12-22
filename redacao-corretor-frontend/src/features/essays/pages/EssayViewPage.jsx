import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { essayService } from '../services/essayService';
import { EssayAnnotator } from '@/features/annotations/components/EssayAnnotator';
import { FloatingCorrectionPanel } from '../components/FloatingCorrectionPanel';
import { Spinner } from '@/shared/components/ui/Spinner';
import { useToast } from '@/shared/hooks/useToast';

/**
 * Página de visualização de redação (apenas aluno - read-only)
 *
 * Features:
 * - Carrega dados da redação
 * - Exibe informações da tarefa
 * - Visualiza redação com anotações da professora (read-only)
 * - Não permite edição
 *
 * Rota: /essays/:essayId/view
 */
export const EssayViewPage = () => {
  const { essayId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [essay, setEssay] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Carrega dados da redação
   */
  useEffect(() => {
    const loadEssay = async () => {
      try {
        setIsLoading(true);
        const data = await essayService.getEssayById(essayId);
        setEssay(data);
      } catch (err) {
        console.error('Erro ao carregar redação:', err);
        setError(err.response?.data?.error || 'Erro ao carregar redação');
        toast.error('Erro ao carregar redação');
      } finally {
        setIsLoading(false);
      }
    };

    if (essayId) {
      loadEssay();
    }
  }, [essayId]);

  /**
   * Voltar para detalhes da tarefa
   */
  const handleBack = () => {
    if (essay?.taskId) {
      navigate(`/tasks/${essay.taskId}`);
    } else {
      navigate('/home');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Carregando redação...</p>
        </div>
      </div>
    );
  }

  if (error || !essay) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Erro ao carregar redação</h2>
          <p className="text-gray-600 mb-6">{error || 'Redação não encontrada'}</p>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header COMPACTO */}
      <div className="bg-white border-b border-gray-200 shadow-sm px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm"
          >
            ← Voltar
          </button>

          <div className="border-l border-gray-300 pl-3">
            <h1 className="text-base font-bold text-gray-800">{essay.task?.title || 'Sua Redação'}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="text-right">
            <p className="font-medium">
              {essay.status === 'pending' && <span className="text-orange-600">⏳ Aguardando</span>}
              {essay.status === 'correcting' && <span className="text-blue-600">✏️ Em correção</span>}
              {essay.status === 'corrected' && <span className="text-green-600">✅ Corrigido</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Canvas de visualização (read-only) - TELA CHEIA */}
      <div className="flex-1 relative overflow-hidden">
        <EssayAnnotator
          essayId={essayId}
          imageUrl={`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/essays/${essayId}/image`}
          readOnly={true}
        />

        {/* Painel Flutuante com Nota e Comentários (apenas se corrigido) */}
        {essay.status === 'corrected' && (
          <FloatingCorrectionPanel grade={essay.grade} writtenFeedback={essay.writtenFeedback} position="left" />
        )}
      </div>
    </div>
  );
};
