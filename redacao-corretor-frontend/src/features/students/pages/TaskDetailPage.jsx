import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTaskDetail } from '@/features/students/hooks/useTaskDetail';
import { essayService } from '@/features/essays/services/essayService';
import { UploadEssayForm } from '@/features/essays/components/UploadEssayForm';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Spinner } from '@/shared/components/ui/Spinner';
import { ConfirmationModal } from '@/shared/components/ui/ConfirmationModal';
import { useToast } from '@/shared/hooks/useToast';

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
  const [_isLoadingEssay, setIsLoadingEssay] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const toast = useToast();

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

  /**
   * Abre modal de confirmação de exclusão
   */
  const handleDelete = () => {
    if (!essay) return;
    setShowDeleteModal(true);
  };

  /**
   * Confirma e executa a exclusão da redação
   */
  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      await essayService.deleteEssay(essay.id);

      // Limpa estado da redação
      setEssay(null);

      // Fecha modal
      setShowDeleteModal(false);

      // Toast de sucesso
      toast.success('Redação deletada com sucesso! Você pode enviar outra agora.');
    } catch (error) {
      console.error('Erro ao deletar redação:', error);

      // Toast de erro
      const errorMessage =
        error.response?.data?.error || 'Erro ao deletar redação. Tente novamente.';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
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
          <i className="bi bi-arrow-left"></i> Voltar
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
            <i className="bi bi-calendar-event"></i> {formatDeadline}
          </span>

          {/* Badge de status */}
          {isNearDeadline && isTaskActive && (
            <span className="bg-orange-100 text-orange-700 text-xs px-3 py-1 rounded-full font-medium">
              <i className="bi bi-exclamation-triangle-fill"></i> Prazo próximo!
            </span>
          )}
          {!isTaskActive && (
            <span className="bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full font-medium">
              <i className="bi bi-alarm-fill"></i> Prazo encerrado
            </span>
          )}
          {hasSubmitted && (
            <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">
              <i className="bi bi-check-lg"></i> Enviada
            </span>
          )}
        </div>
      </div>

      {/* Content Stack */}
      <div className="space-y-6">
        {/* Descrição da tarefa (Tema) */}
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <i className="bi bi-clipboard-data-fill text-blue-600"></i> Tema da Redação
              </h2>
              <div className="prose max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                {task.description}
              </div>
            </div>
          </div>
        </Card>

        {/* Seção de upload */}
        <Card className="p-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <i className="bi bi-cloud-upload-fill text-blue-600"></i> Envio da Redação
            </h2>

            {hasSubmitted ? (
              // Já enviou
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl text-green-600"><i className="bi bi-check-lg"></i></span>
                    <div className="flex-1">
                      <p className="text-green-800 font-medium">
                        Redação enviada!
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        {new Date(essay.submittedAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status da correção */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                  <p className="text-sm font-medium text-gray-700">Status:</p>
                  <div className="flex items-center gap-2">
                      <span
                      className={`px-3 py-1.5 rounded-full text-sm font-medium inline-flex items-center gap-2 w-full justify-center ${
                          essay.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : essay.status === 'correcting'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                      >
                      {essay.status === 'pending' && <><i className="bi bi-hourglass-split"></i> Pendente</>}
                      {essay.status === 'correcting' && <><i className="bi bi-pencil-fill"></i> Corrigindo</>}
                      {essay.status === 'corrected' && <><i className="bi bi-check-lg"></i> Corrigida</>}
                      </span>
                  </div>
                </div>

                {/* Botões de ação */}
                <div className="flex gap-3 pt-2">
                  {/* Botão Ver Correção - aparece quando status é 'corrected' ou 'correcting' */}
                  {(essay.status === 'corrected' || essay.status === 'correcting') && (
                    <Button
                      variant="primary"
                      className="flex-1 justify-center"
                      onClick={() => navigate(`/essays/${essay.id}/view`)}
                    >
                      <i className="bi bi-pencil-square mr-2"></i>
                      {essay.status === 'corrected' ? 'Ver Correção' : 'Ver Anotações'}
                    </Button>
                  )}

                  <Button
                    variant={essay.status === 'corrected' || essay.status === 'correcting' ? 'secondary' : 'primary'}
                    className="flex-1 justify-center"
                    onClick={() => window.open(essay.publicUrl, '_blank')}
                  >
                    <i className="bi bi-eye-fill mr-2"></i> Visualizar Original
                  </Button>

                  {essay.status === 'pending' && isTaskActive && (
                    <Button
                      variant="danger"
                      className="flex-1 justify-center"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? <span><i className="bi bi-hourglass-split"></i> Deletando...</span> : <span><i className="bi bi-trash-fill mr-2"></i> Deletar e reenviar</span>}
                    </Button>
                  )}
                </div>

                {essay.status === 'pending' && (
                  <p className="text-xs text-gray-400 text-center">
                    Você pode reenviar enquanto o prazo estiver aberto.
                  </p>
                )}
              </div>
            ) : !isTaskActive ? (
              // Prazo encerrado
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                  <div className="text-4xl text-red-400 mb-3"><i className="bi bi-alarm-fill"></i></div>
                  <p className="text-red-800 font-medium">
                      Prazo Encerrado
                  </p>
                  <p className="text-sm text-red-600 mt-1">
                      Não é mais possível enviar.
                  </p>
              </div>
            ) : (
              // Pode enviar
              <div>
                <UploadEssayForm
                  taskId={taskId}
                  onUploadSuccess={handleUploadSuccess}
                />
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Deletar Redação"
        message="Deseja deletar sua redação para enviar outra? Esta ação não pode ser desfeita."
        confirmText="Deletar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
