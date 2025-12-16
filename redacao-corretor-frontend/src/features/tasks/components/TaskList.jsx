import { TaskCard } from './TaskCard';

export const TaskList = ({ title, tasks, emptyMessage = "Nenhuma tarefa encontrada.", onTaskClick }) => {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <p className="text-gray-500 italic text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title} ({tasks.length})</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={() => onTaskClick?.(task.id)}
          />
        ))}
      </div>
    </div>
  );
};
