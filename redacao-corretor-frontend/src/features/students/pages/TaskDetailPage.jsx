import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTaskDetail } from '@/features/students/hooks/useTaskDetail';
import { essayService } from '@/features/essays/services/essayService';
import { UploadEssayForm } from '@/features/essays/components/UploadEssayForm';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Spinner } from '@/shared/components/ui/Spinner';

/**
 * Página de detalhes da tarefa para o aluno
 * SRP: Apenas orquestra exibição de detalhes e upload
 *
 * Mostra informações da tarefa e permite upload de redação
 */
export const TaskDetailPage = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const {
    task,
    isLoading,
    error,
    isTaskActive,
    isNearDeadline,
    formatDeadline
  } = useTaskDetail(taskId);

  /**
   * Estado da redação do aluno
   */
  const [essay, setEssay] = useState(null);
  const [isLoadingEssay, setIsLoadingEssay] = useState(true);

  /**
   * Busca redação do aluno para esta tarefa
   */
  useEffect(() => {
    const fetchEssay = async () => {
      if (!taskId) return;

      try {
        setIsLoadingEssay(true);
        const essayData = await essayService.getStudentEssay(taskId);
        setEssay(essayData);
      } catch (error) {
        console.error('Erro ao buscar redação:', error);
      } finally {
        setIsLoadingEssay(false);
      }
    };

    fetchEssay();
  }, [taskId]);

  /**
   * Callback quando upload for bem-sucedido
   */
  const handleUploadSuccess = () => {
    // Recarregar redação
    essayService.getStudentEssay(taskId).then(setEssay);
  };

  const hasSubmitted = !!essay;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 mt-8">
        <p>{error}</p>
        <Button
          variant="secondary"
          onClick={() => navigate('/')}
          className="mt-4"
        >
          Voltar para Home
        </Button>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center text-gray-600 mt-8">
        <p>Tarefa não encontrada</p>
        <Button
          variant="secondary"
          onClick={() => navigate('/')}
          className="mt-4"
        >
          Voltar para Home
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header com botão voltar */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="flex items-center gap-2"
        >
          ← Voltar
        </Button>
      </div>

      {/* Título da tarefa */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
        <div className="flex items-center gap-4 mt-2">
          {/* Deadline */}
          <span
            className={`text-sm font-medium ${
              isNearDeadline
                ? 'text-orange-600'
                : isTaskActive
                ? 'text-gray-600'
                : 'text-red-600'
            }`}
          >
            📅 {formatDeadline}
          </span>

          {/* Badge de status */}
          {isNearDeadline && isTaskActive && (
            <span className="bg-orange-100 text-orange-700 text-xs px-3 py-1 rounded-full font-medium">
              ⚠️ Prazo próximo!
            </span>
          )}
          {!isTaskActive && (
            <span className="bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full font-medium">
              ⏰ Prazo encerrado
            </span>
          )}
          {hasSubmitted && (
            <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">
              ✓ Enviada
            </span>
          )}
        </div>
      </div>

      {/* Descrição da tarefa */}
      <Card>
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              📋 Tema da Redação
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {task.description}
            </p>
          </div>
        </div>
      </Card>

      {/* Seção de upload */}
      <Card>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            📤 Envio da Redação
          </h2>

          {hasSubmitted ? (
            // Já enviou
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">✓</span>
                  <div className="flex-1">
                    <p className="text-green-800 font-medium">
                      Redação enviada com sucesso!
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      Enviada em{' '}
                      {new Date(essay.submittedAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status da correção */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Status da correção:
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {essay.status === 'pending' && 'Aguardando correção'}
                    {essay.status === 'correcting' && 'Em correção'}
                    {essay.status === 'corrected' && 'Corrigida'}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    essay.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : essay.status === 'correcting'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {essay.status === 'pending' && '⏳ Pendente'}
                  {essay.status === 'correcting' && '✍️ Corrigindo'}
                  {essay.status === 'corrected' && '✓ Corrigida'}
                </span>
              </div>

              {/* Botões de ação */}
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  size="md"
                  className="flex-1"
                  onClick={() => window.open(essay.publicUrl, '_blank')}
                >
                  👁️ Visualizar redação
                </Button>
                {essay.status === 'pending' && isTaskActive && (
                  <Button
                    variant="danger"
                    size="md"
                    onClick={() => {
                      if (
                        window.confirm(
                          'Deseja deletar sua redação para enviar outra? Esta ação não pode ser desfeita.'
                        )
                      ) {
                        // TODO: Implementar delete
                        alert('Funcionalidade de delete será implementada em breve');
                      }
                    }}
                  >
                    🗑️ Deletar e reenviar
                  </Button>
                )}
              </div>

              {essay.status === 'pending' && (
                <p className="text-xs text-gray-500 text-center">
                  Você pode deletar e reenviar sua redação enquanto o prazo não encerrar.
                </p>
              )}
            </div>
          ) : !isTaskActive ? (
            // Prazo encerrado
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⏰</span>
                <div>
                  <p className="text-red-800 font-medium">
                    Prazo de entrega encerrado
                  </p>
                  <p className="text-sm text-red-600 mt-1">
                    Você não pode mais enviar redação para esta tarefa.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Pode enviar
            <UploadEssayForm
              taskId={taskId}
              onUploadSuccess={handleUploadSuccess}
            />
          )}
        </div>
      </Card>
    </div>
  );
};
