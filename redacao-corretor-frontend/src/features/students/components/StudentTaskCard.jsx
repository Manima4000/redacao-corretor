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
      className={`cursor-pointer transition-all hover:shadow-lg ${
        isNearDeadline() ? 'border-l-4 border-l-orange-500' : ''
      } ${!isPending ? 'opacity-75' : ''}`}
    >
      <div className="space-y-3">
        {/* Título e Descrição */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {task.description}
          </p>
        </div>

        {/* Prazo */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">📅</span>
          <span
            className={`font-medium ${
              isNearDeadline()
                ? 'text-orange-600'
                : isPending
                ? 'text-gray-700'
                : 'text-gray-500'
            }`}
          >
            {formatDate(task.deadline)}
          </span>
          {isNearDeadline() && (
            <span className="ml-auto bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full">
              Prazo próximo!
            </span>
          )}
        </div>

        {/* Status */}
        <div className="pt-2 border-t border-gray-100">
          {isPending ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Clique para enviar redação
              </span>
              <span className="text-blue-600 text-sm font-medium">→</span>
            </div>
          ) : (
            <div className="text-sm text-gray-500">Prazo encerrado</div>
          )}
        </div>
      </div>
    </Card>
  );
};
