import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { essayService } from '../services/essayService';
import { EssayAnnotator } from '@/features/annotations/components/EssayAnnotator';
import { EssayCorrectionSummary } from '../components/EssayCorrectionSummary';
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
      {/* Header com informações */}
      <div className="bg-white border-b border-gray-200 shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            ← Voltar
          </button>

          <div className="border-l border-gray-300 pl-4">
            <h1 className="text-xl font-bold text-gray-800">{essay.task?.title || 'Sua Redação'}</h1>
            <p className="text-sm text-gray-600">{essay.task?.description || ''}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-500">Status</p>
            <p className="font-medium">
              {essay.status === 'pending' && (
                <span className="text-orange-600 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-600" />
                  Aguardando correção
                </span>
              )}
              {essay.status === 'correcting' && (
                <span className="text-blue-600 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600" />
                  Em correção
                </span>
              )}
              {essay.status === 'corrected' && (
                <span className="text-green-600 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-600" />
                  Corrigido
                </span>
              )}
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-500">Enviado em</p>
            <p className="font-medium">
              {new Date(essay.submittedAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          {essay.correctedAt && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Corrigido em</p>
              <p className="font-medium">
                {new Date(essay.correctedAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Banner de status */}
      {essay.status === 'pending' && (
        <div className="bg-orange-50 border-b border-orange-200 px-6 py-3">
          <p className="text-orange-800 text-center">
            ⏳ Sua redação está aguardando correção. Você será notificado quando for corrigida.
          </p>
        </div>
      )}

      {essay.status === 'correcting' && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
          <p className="text-blue-800 text-center">
            ✏️ A professora está corrigindo sua redação. Você será notificado quando a correção for finalizada.
          </p>
        </div>
      )}

      {essay.status === 'corrected' && (
        <div className="bg-green-50 border-b border-green-200 px-6 py-3">
          <p className="text-green-800 text-center">
            ✅ Sua redação foi corrigida! Veja abaixo as anotações e comentários da professora.
          </p>
        </div>
      )}

      {/* Nota e Comentários da Correção */}
      {essay.status === 'corrected' && (
        <EssayCorrectionSummary grade={essay.grade} writtenFeedback={essay.writtenFeedback} />
      )}

      {/* Canvas de visualização (read-only) */}
      <div className="flex-1 min-h-0 relative">
        <EssayAnnotator
          essayId={essayId}
          imageUrl={`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/essays/${essayId}/image`}
          readOnly={true}
          className="h-full"
        />
      </div>
    </div>
  );
};
