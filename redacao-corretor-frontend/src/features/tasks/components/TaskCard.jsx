import { Card } from '@/shared/components/ui/Card';

export const TaskCard = ({ task, onClick }) => {
  const isOverdue = new Date() > new Date(task.deadline);
  const deadlineDate = new Date(task.deadline).toLocaleDateString('pt-BR');
  const deadlineTime = new Date(task.deadline).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <Card
      className="p-6 hover:shadow-lg hover:border-blue-400 transition-all duration-200 border-l-4 border-l-blue-500 cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
            {task.title}
          </h4>
          <p className="text-sm text-gray-600 mt-2 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        </div>
        <span className={`
          text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap shrink-0
          ${isOverdue
            ? 'bg-red-100 text-red-700 border border-red-200'
            : 'bg-green-100 text-green-700 border border-green-200'
          }
        `}>
          {isOverdue ? '⏰ Encerrada' : '✅ Em andamento'}
        </span>
      </div>

      <div className="mt-5 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-base">📅</span>
            <span className="font-medium">
              {deadlineDate} às {deadlineTime}
            </span>
          </div>

          <div className="text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Ver detalhes →
          </div>
        </div>
      </div>
    </Card>
  );
};
