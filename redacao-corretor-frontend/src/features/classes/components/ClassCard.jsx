import { Card } from '@/shared/components/ui/Card';

export const ClassCard = ({ classData }) => {
  return (
    <Card className="p-6 hover:border-blue-500 border-2 border-transparent">
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-gray-900">{classData.name}</h3>

        {classData.description && (
          <p className="text-gray-600 text-sm line-clamp-2">{classData.description}</p>
        )}

        <div className="flex gap-4 text-sm text-gray-500 pt-2 border-t">
          <div className="flex items-center gap-1">
            <span>📋</span>
            <span>0 tarefas</span>
          </div>
          <div className="flex items-center gap-1">
            <span>👥</span>
            <span>0 alunos</span>
          </div>
        </div>

        <p className="text-xs text-gray-400">
          Criada em {new Date(classData.createdAt).toLocaleDateString('pt-BR')}
        </p>
      </div>
    </Card>
  );
};
