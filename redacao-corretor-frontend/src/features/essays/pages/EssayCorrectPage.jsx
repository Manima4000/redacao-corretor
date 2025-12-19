import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEssay } from '../hooks/useEssay';
import { essayService } from '../services/essayService';
import { EssayAnnotator } from '@/features/annotations/components/EssayAnnotator';
import { FinalizeEssayModal } from '../components/FinalizeEssayModal';
import { Spinner } from '@/shared/components/ui/Spinner';
import { useToast } from '@/shared/hooks/useToast';

/**
 * Página de correção de redação (REFATORADO)
 *
 * Responsabilidades:
 * - Exibir informações do aluno e tarefa (header)
 * - Renderizar componente de anotação (EssayAnnotator)
 * - Gerenciar modal de finalização
 * - Redirecionar após finalizar
 *
 * Segue SOLID:
 * - SRP: Apenas UI/UX (fetch delegado ao hook useEssay)
 * - Hook useEssay gerencia estado e carregamento
 *
 * ANTES: 195 linhas com fetch, estado, loading
 * DEPOIS: ~130 linhas apenas com UI
 *
 * Rota: /essays/:essayId/correct
 */
export const EssayCorrectPage = () => {
  const { essayId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  // Hook customizado (gerencia fetch e estado)
  const { essay, isLoading, error } = useEssay(essayId);

  // Estado local (apenas UI)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  /**
   * Callback ao clicar em "Finalizar Correção" - abre modal
   */
  const handleFinish = () => {
    setIsModalOpen(true);
  };

  /**
   * Callback ao submeter o modal com nota e comentários
   */
  const handleFinalizeSubmit = async (grade, writtenFeedback) => {
    try {
      setIsFinalizing(true);

      // Chama API para finalizar com nota e comentários
      await essayService.finalizeEssay(essayId, grade, writtenFeedback);

      toast.success('Correção finalizada com sucesso!');
      setIsModalOpen(false);

      // Redireciona para página de alunos da tarefa após 1.5s
      setTimeout(() => {
        if (essay?.task?.id && essay?.task?.classId) {
          navigate(`/classes/${essay.task.classId}/tasks/${essay.task.id}`);
        } else {
          navigate('/dashboard');
        }
      }, 1500);
    } catch (err) {
      console.error('Erro ao finalizar correção:', err);
      toast.error(err.response?.data?.error || 'Erro ao finalizar correção');
    } finally {
      setIsFinalizing(false);
    }
  };

  /**
   * Voltar para lista de alunos
   */
  const handleBack = () => {
    if (essay?.task?.id && essay?.task?.classId) {
      navigate(`/classes/${essay.task.classId}/tasks/${essay.task.id}`);
    } else {
      navigate('/dashboard');
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
            <h1 className="text-xl font-bold text-gray-800">{essay.task?.title || 'Redação'}</h1>
            <p className="text-sm text-gray-600">
              Aluno: <span className="font-medium">{essay.student?.fullName || 'Aluno'}</span>
              {essay.student?.enrollmentNumber && (
                <span className="ml-2 text-gray-500">({essay.student.enrollmentNumber})</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-500">Status</p>
            <p className="font-medium">
              {essay.status === 'pending' && <span className="text-orange-600">Pendente</span>}
              {essay.status === 'correcting' && <span className="text-blue-600">Corrigindo</span>}
              {essay.status === 'corrected' && <span className="text-green-600">Corrigido</span>}
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
        </div>
      </div>

      {/* Canvas de anotação */}
      <EssayAnnotator
        essayId={essayId}
        imageUrl={`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/essays/${essayId}/image`}
        onFinish={handleFinish}
      />

      {/* Modal de Finalização */}
      <FinalizeEssayModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onFinalize={handleFinalizeSubmit}
        isLoading={isFinalizing}
      />
    </div>
  );
};
