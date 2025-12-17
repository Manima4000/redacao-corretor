import { useNavigate } from 'react-router-dom';
import { Card } from '@/shared/components/ui/Card';

/**
 * Card de tarefa para visualização do aluno
 * SRP: Apenas renderiza informações de uma tarefa para o aluno
 *
 * @param {Object} props
 * @param {Object} props.task - Dados da tarefa
 * @param {boolean} props.isPending - Se a tarefa está pendente
 */
export const StudentTaskCard = ({ task, isPending }) => {
  const navigate = useNavigate();

  /**
   * Formata data para exibição
   * @param {string} dateString - Data em formato ISO
   * @returns {string} Data formatada
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'Sem prazo';

    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Verifica se o prazo está próximo (3 dias ou menos)
   * @returns {boolean} True se o prazo está próximo
   */
  const isNearDeadline = () => {
    if (!task.deadline) return false;

    const deadline = new Date(task.deadline);
    const now = new Date();
    const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

    return daysUntilDeadline <= 3 && daysUntilDeadline >= 0;
  };

  /**
   * Navega para página de detalhes/upload da tarefa
   */
  const handleClick = () => {
    navigate(`/tasks/${task.id}`);
  };

  return (
    <Card
      onClick={handleClick}
      className={`p-6 hover:border-blue-500 border-2 border-transparent cursor-pointer transition-all ${
        !isPending ? 'opacity-75 bg-gray-50' : ''
      }`}
    >
      <div className="space-y-3">
        {/* Título e Descrição */}
        <div>
          <h3 className="text-xl font-bold text-gray-900">{task.title}</h3>
          <p className="text-gray-600 text-sm line-clamp-2 mt-1">
            {task.description}
          </p>
        </div>

        {/* Footer Info */}
        <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span><i className="bi bi-calendar-event" /></span>
            <span
              className={`${
                isNearDeadline() ? 'text-orange-600 font-medium' : ''
              }`}
            >
              Entrega: {formatDate(task.deadline)}
            </span>
          </div>

          {isNearDeadline() && isPending && (
            <p className="text-xs text-orange-600 font-medium flex items-center gap-1">
              <i className="bi bi-exclamation-triangle-fill" /> Prazo encerrando em breve!
            </p>
          )}

          {!isPending && (
            <p className="text-xs text-gray-400">
              Prazo encerrado
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};
